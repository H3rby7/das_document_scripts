/// <reference path="node_modules/@types/google-apps-script/google-apps-script.properties.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />

function getSlackHookAllgemein(): string {
  return PropertiesService.getScriptProperties().getProperty('slackWebHookAllgemein') as string;
}

function getSlackHookProben(): string {
  return PropertiesService.getScriptProperties().getProperty('slackWebHookProben') as string;
}

function getSlackHookTest(): string {
  return PropertiesService.getScriptProperties().getProperty('slackWebHookTest') as string;
}

function getLinkToSpreadsheet(): string {
  return PropertiesService.getScriptProperties().getProperty('linkToSpreadsheet') as string;
}
function getTrainingSheetName(): string {
  return PropertiesService.getScriptProperties().getProperty('trainingSheetName') as string;
}

function getPlanningSheetName(): string {
  return PropertiesService.getScriptProperties().getProperty('planningSheetName') as string;
}

function getPlanningSheetID(): string {
  return PropertiesService.getScriptProperties().getProperty('planningSheetID') as string;
}

function getCalendarID(): string {
  return PropertiesService.getScriptProperties().getProperty('calendarID') as string;
}

function getJamGuestEmail(): string {
  return PropertiesService.getScriptProperties().getProperty('jamGuestEmail') as string;
}


function printProperties() {
  const properties = PropertiesService.getScriptProperties();
  const keys = properties.getKeys();
  keys.sort().forEach(key => {
    Logger.log("'%s': '%s'", key, properties.getProperty(key));
  })
}

function configure() {
  Logger.log("\n\n============= Previous Properties =============");
  printProperties();

  // PropertiesService.getScriptProperties().setProperty("myKey", "myValue");
  // PropertiesService.getScriptProperties().deleteProperty("myKey");
  
  Logger.log("\n\n============= New Properties =============");
  printProperties();
}