import valueSetJson from '../cql/valueset-db.json';
export async function getIntervention() {
  let intervention = process.env.VUE_APP_INTERVENTION ? process.env.VUE_APP_INTERVENTION.toLowerCase() : "";
  if (intervention == 'briefintervention') {
    let namedExpression = 'BriefInterventions';
    let questionnaireUsAudit = await import('../fhir/Questionnaire-USAUDIT.json').then(module=>module.default);
    let questionnaireWhoAudit = await import('../fhir/Questionnaire-WHOAUDIT.json').then(module=>module.default);
    let questionnaireNidaQs = await import('../fhir/Questionnaire-NIDAQS2USAUDIT.json').then(module=>module.default);
    let elmJsonBriefIntervention = await import('../cql/BriefInterventionLogicLibrary.json').then(module=>module.default);
    let allQuestionnaires = [
      questionnaireUsAudit,
      questionnaireWhoAudit,
      questionnaireNidaQs
    ];
    return [allQuestionnaires, elmJsonBriefIntervention, valueSetJson, namedExpression];
  } else if (intervention == 'decisionaid') {
    let namedExpression = 'DecisionAids';
    let elmJsonDecisionAid = await import('../cql/DecisionAidLogicLibrary.json').then(module=>module.default);
    return [[], elmJsonDecisionAid, valueSetJson, namedExpression];
  } else {
    throw new Error('Unsupported alcohol intervention has been specified');
  }
}