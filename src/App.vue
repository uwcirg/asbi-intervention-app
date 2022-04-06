<template>
  <v-app>
    <v-app-bar
      dark
      color="primary"
      elevation=2
      app>
      <v-toolbar-title>{{title}}</v-toolbar-title>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-progress-circular
        :value="100"
        indeterminate
        color="primary"
        v-if="!error && !ready"
        ></v-progress-circular>
        <div id="app">
          <InterventionComponent
            :intervention="intervention"
            v-if="interventionType=='briefintervention'"/>
          <DecisionAidComponent
            :intervention="intervention"
            v-if="interventionType=='decisionaid'"/>
          <div v-if="!interventionType">No intervention specified</div>
        </div>
        <v-alert
          color="error"
          dark
          v-if="error">
          Error loading the summary.  See console for detail.
          <div v-html="error"></div>
        </v-alert>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { getIntervention } from './util/intervention-selector.js';
import Worker from "../node_modules/cql-worker/src/cql.worker.js"; // https://github.com/webpack-contrib/worker-loader
import { initialzieCqlWorker } from 'cql-worker';
import FHIR from 'fhirclient';
import { getObservationCategories } from './util/util.js';
import InterventionComponent from './components/InterventionComponent.vue'
import DecisionAidComponent from './components/DecisionAidComponent.vue'

var client;
// Define a web worker for evaluating CQL expressions
const cqlWorker = new Worker();
// Assemble the parameters needed by the CQL
let cqlParameters = {};
// Initialize the cql-worker
let [setupExecution, sendPatientBundle, evaluateExpression] = initialzieCqlWorker(cqlWorker);
const interventionType = process.env.VUE_APP_INTERVENTION ? process.env.VUE_APP_INTERVENTION.toLowerCase() : '';
const titles = {
  'decisionaid': 'DEMO ASBI CDS: Decision Aid App',
  'briefintervention': 'DEMO ASBI CDS: Brief Intervention App'
};

export default {
  name: 'App',
  components: {
    InterventionComponent,
    DecisionAidComponent
  },
  watch: {
    'intervention': function() {
      this.ready = true;
    }
  },
  data: function() {
    return {
      interventionType: interventionType,
      title: 
        titles[interventionType]? titles[interventionType]: 'Intervention Summary',
      patientBundle: {
        resourceType: 'Bundle',
        id: 'survey-bundle',
        type: 'collection',
        entry: []
      },
      questionnaires: [],
      intervention: null,
      error: "",
      ready: false
    }
  },
  async mounted() {
    var self = this;
    this.setAuthClient().then((result) => {
      client = result;
      if (this.error) return; // auth error, cannot continue
      this.setPatient().then((pt) => {
        if (this.error) return;
        if (pt) {
          this.patientBundle.entry.unshift({resource: pt});
          this.patientId = pt.id;
        }
        this.getFhirResources().then(() => {
          if (this.error || !this.patientId) return;
          getIntervention().then(data => {
            // Load the Questionniare, CQL ELM JSON, and value set cache which represents the alcohol intervention
            const [questionnaires, elmJson, valueSetJson, namedExpression] = data;

            // Send the cqlWorker an initial message containing the ELM JSON representation of the CQL expressions
            setupExecution(elmJson, valueSetJson, cqlParameters);

            if (questionnaires.length > 0) {
              questionnaires.forEach(questionnaire => {
                self.patientBundle.entry.push({resource: questionnaire});
              });
            }
            sendPatientBundle(self.patientBundle);
            self.handleEvalExpression(namedExpression);
          }).catch(e => {
            self.error = e;
            console.log("Questionnaire error ", e);
          })
        }).catch(e => {
          this.error = e;
          console.log("FHIR resources error ", e);
        })
      }).catch(e => {
        this.error = e;
        console.log("Patient resource error ", e);
      });
    }).catch(e => {
      console.log("Auth Error ", e);
      this.error = e;
      this.ready = true;
    });
  },
  methods: {
    async setAuthClient() {
       // Wait for authorization
      return await FHIR.oauth2.ready();
    },
    async setPatient() {
       // Get the Patient resource
      return await client.patient.read().then((pt) => {
        return pt;
      });
    },
    async getFhirResources() {
       // Get any Observation resources
      let observationQueryString = `/Observation?patient=${this.patientId}`;
      // Optionally request Observations using categories
      if (
        process.env.VUE_APP_FHIR_OBSERVATION_CATEGORY_QUERIES &&
        process.env.VUE_APP_FHIR_OBSERVATION_CATEGORY_QUERIES.toLowerCase() == 'true') {
        getObservationCategories().forEach(cat => {
          observationQueryString = observationQueryString + '&category=' + cat;
        });
      }
      const requests = [
        client.request('/Condition?patient=' +  this.patientId),
        client.request(observationQueryString),
        client.request('/Procedure?patient=' +  this.patientId),
        client.request('/QuestionnaireResponse?patient=' +  this.patientId)
      ];
      //get all resources
      Promise.all(requests).then(results => {
        results.forEach(result => {
          if (!result) return true;
          if (result.resourceType == 'Bundle' && result.entry) {
            result.entry.forEach(o => {
              if (o && o.resource) this.patientBundle.entry.push({resource: o.resource});
            });
          } else if (Array.isArray(result)) {
            result.forEach(o => {
              if (o.resourceType) this.patientBundle.entry.push({resource: o});
            });
          } else {
            this.patientBundle.entry.push({resource: result});
          }
        });
      });
    }, //
    async handleEvalExpression(namedExpression) {
      try {
       this.intervention = await evaluateExpression(namedExpression).catch(e => console.log("intervention error ", e));
      } catch(e) {
        console.log("error in promise ", e)
      }
    }
  }
}
</script>
