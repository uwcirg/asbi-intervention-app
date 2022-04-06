<template>
  <div id="interventionElement">
    <div v-if="ready">
        <div>
          <h2>Alcohol Screening Summary</h2>
          <div>{{alcoholScreeningResultsSummary.summary}}</div>
          <details>
            <summary>Responses</summary>
            <ul>
              <li v-for="response in alcoholScreeningResultsSummary.responses" :key="response.question">
                <div class="question">{{response.question}}</div>
                <div class="response">{{response.answer}}</div>
              </li>
            </ul>
          </details>
        </div>
        <details>
          <summary>Alcohol Counseling Suggestions</summary>
          <div><span v-html="alcoholCounselingSuggestions.suggestions"></span></div>
          <div v-if="alcoholCounselingSuggestions.additional != ''">{{alcoholCounselingSuggestions.addition}}</div>
          <div v-if="alcoholCounselingSuggestions.referral"><em>A referral for treatment of possible alcohol use disorder is recommended.</em></div>
          <details>
            <summary>References:</summary>
            <div><span v-html="alcoholCounselingSuggestions.references"></span></div>
          </details>
        </details>
        <details>
          <summary>Patient Education Material</summary>
          <div><span v-html="alcoholPatientEducationResources"></span></div>
        </details>

        <div>
          <h2>Substance Use Screening Summary</h2>
          <div>{{nonAlcoholScreeningResultsSummary.summary}}</div>
          <details>
            <summary>Responses</summary>
            <ul>
              <li v-for="response in nonAlcoholScreeningResultsSummary.responses" :key="response.question">
                <div class="question">{{response.question}}</div>
                <div class="response">{{response.answer}}</div>
              </li>
            </ul>
          </details>
        </div>
        <details>
          <summary>Substance Use Counseling Suggestions</summary>
          <div><span v-html="nonAlcoholRelatedCounselingSuggestions.suggestions"></span></div>
          <div v-if="nonAlcoholRelatedCounselingSuggestions.additional != ''">{{nonAlcoholRelatedCounselingSuggestions.addition}}</div>
          <div v-if="nonAlcoholRelatedCounselingSuggestions.referral"><em>A referral for possible evaluation and treatment of substance use is recommended.</em></div>
          <details>
            <summary>References:</summary>
            <div><span v-html="nonAlcoholRelatedCounselingSuggestions.references"></span></div>
          </details>
        </details>
        <details>
          <summary>Patient Education Material</summary>
          <div><span v-html="nonAlcoholRelatedPatientEducationResources"></span></div>
        </details>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked';
// Define the survey component for Vue
export default {
  props: {
    intervention: Object
  },
  watch: {
    'intervention': function() {
      this.interventionCallback();
    }
  },
  data() {
    // Indicate we are not yet ready for the component to render
    return {
      alcoholScreeningResultsSummary: {},
      alcoholCounselingSuggestions: {},
      alcoholPatientEducationResources: {},
      nonAlcoholScreeningResultsSummary: {},
      nonAlcoholRelatedCounselingSuggestions: {},
      nonAlcoholRelatedPatientEducationResources: {},
      ready: false
    };
  },
  created() {
    
  },
  mounted() {
  },
  methods: {
    interventionCallback() {
      // Have the web worker evaluate the CQL and return the brief interventions
      // Unpack the alcohol brief interventions and assimilate into the component
      this.alcoholScreeningResultsSummary = this.intervention.alcohol_screening_results_summary;
      if (this.intervention.alcohol_counseling_suggestions) {
        this.alcoholCounselingSuggestions = {
          suggestions: marked(this.intervention.alcohol_counseling_suggestions.suggestions),
          additional: this.intervention.alcohol_counseling_suggestions.additional[0],
          references: marked(this.intervention.alcohol_counseling_suggestions.references),
          referral: this.intervention.alcohol_counseling_suggestions.referral
        };
      }
      this.alcoholPatientEducationResources = marked(this.intervention.alcohol_patient_education_resources);

      // Unpack the non-alcohol brief interventions and assimilate into the component
      this.nonAlcoholScreeningResultsSummary = this.intervention.non_alcohol_screening_results_summary;
      if (this.intervention.non_alcohol_related_counseling_suggestions) {
        this.nonAlcoholRelatedCounselingSuggestions = {
          suggestions: marked(this.intervention.non_alcohol_related_counseling_suggestions.suggestions),
          references: marked(this.intervention.non_alcohol_related_counseling_suggestions.references),
          referral: this.intervention.non_alcohol_related_counseling_suggestions.referral
        };
      }
      this.nonAlcoholRelatedPatientEducationResources = marked(this.intervention.non_alcohol_related_patient_education_resources);
      this.ready = true; 
    }
  }
};
</script>

