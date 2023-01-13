/// <reference path="node_modules/@types/google-apps-script/google-apps-script.properties.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />


/*
Required properties:
  slackWebHookAllgemein
  slackWebHookProben
  test_slackWebHook
  trainingSheetName
  planningSheetName
  linkToSpreadsheet
  test_linkToSpreadsheet
  planningSheetID
  test_planningSheetID
  calendarID
  test_calendarID
  jamGuestEmail
  test_jamGuestEmail
 */

function getSlackHookAllgemein(dev = false): string {
  if (dev) {
    return PropertiesService.getScriptProperties().getProperty('test_slackWebHook') as string;
  }
  return PropertiesService.getScriptProperties().getProperty('slackWebHookAllgemein') as string;
}

function getSlackHookProben(dev = false): string {
  if (dev) {
    return PropertiesService.getScriptProperties().getProperty('test_slackWebHook') as string;
  }
  return PropertiesService.getScriptProperties().getProperty('slackWebHookProben') as string;
}

function getLinkToSpreadsheet(dev = false): string {
  return PropertiesService.getScriptProperties().getProperty(`${dev ? 'test_' : ''}linkToSpreadsheet`) as string;
}
function getTrainingSheetName(): string {
  return PropertiesService.getScriptProperties().getProperty('trainingSheetName') as string;
}

function getPlanningSheetName(): string {
  return PropertiesService.getScriptProperties().getProperty('planningSheetName') as string;
}

function getPlanningSheetID(dev = false): string {
  return PropertiesService.getScriptProperties().getProperty(`${dev ? 'test_' : ''}planningSheetID`) as string;
}

function getCalendarID(dev = false): string {
  return PropertiesService.getScriptProperties().getProperty(`${dev ? 'test_' : ''}calendarID`) as string;
}

function getJamGuestEmail(dev = false): string {
  return PropertiesService.getScriptProperties().getProperty(`${dev ? 'test_' : ''}jamGuestEmail`) as string;
}
