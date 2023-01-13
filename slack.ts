/// <reference path="node_modules/@types/google-apps-script/google-apps-script.url-fetch.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />

interface SlackSimpleText {
  text: string;
}

interface SlackBlocks {
  blocks: {
    type: string,
    text?: {
      type: string,
      text?: string
    },
    accessory?: {
      type: string,
      image_url?: string,
      alt_text?: string
    }
  }[]
}

function sendSlackAlert(payload: SlackSimpleText | SlackBlocks, webhook: string, muteHttpExceptions: boolean) {
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
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