/// <reference path="node_modules/@types/google-apps-script/google-apps-script.url-fetch.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />

function sendSlackAlert(payload: any, webhook: string, muteHttpExceptions: boolean) {
  var options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    "method": "post", 
    "contentType": "application/json", 
    "muteHttpExceptions": muteHttpExceptions, 
    "payload": JSON.stringify(payload) 
  };
  
  try {
    UrlFetchApp.fetch(webhook, options);
  } catch(e) {
    Logger.log(e);
  }
}