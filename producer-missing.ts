/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.url-fetch.d.ts" />
/// <reference path="properties.ts" />
/// <reference path="slack.ts" />
/// <reference path="logging.ts" />

function testProducerMissing() {
  var data: any = {};
  const format = 'TBD';
  const status = 'zugesagt';
  const notes = 'Fuß, Inder, Tür';
  

  //adjust dates for calendar
  data.location = 'Virtual Testroom';
  data.startDate = new Date(Date.now() + 600000);
  data.eventName = format + ' (' + data.location + '), ' + status;
  data.notes = notes;
  sendAlert(getSlackMessageProducerMissing(data, true), getSlackHookAllgemein(true), false);
}

function producerMissing(showData, dev = false) {
  sendAlert(getSlackMessageProducerMissing(showData, dev), getSlackHookAllgemein(dev), true);
}

function formatDateForHumans(date) {
  return padNumber(date.getDate(), 2)
  + "." + padNumber(date.getMonth() + 1, 2)
  + "." + padNumber(date.getFullYear(), 4);
}

function formatTimeForHumans(date) {
 return padNumber(date.getHours(), 2)
   + ":" + padNumber(date.getMinutes(), 2);
}

function getSlackMessageProducerMissing(showData, dev = false) {
  Logger.log(FORMAT + "Producing Slack alert for missing producer on '%s' (%s)!", INFO, SLACK, showData.startDate, showData.eventName);

  const showStart = new Date(showData.startDate);
  const date = formatDateForHumans(showStart);
  const time = formatTimeForHumans(showStart);

  // https://app.slack.com/block-kit-builder
  return {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Producer fehlt für Auftritt am " + date + " um " + time + " Uhr, Location: " + showData.location + "!*"
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Ihr Gauner habt mal wieder einen Auftritt und niemand fühlt sich zuständig...\n\n*Was kannst du tun?*\n Übernimm die Führung!\nTrag dich im Dokument als *Verantwortliche(r)* für den Auftritt ein ein.\n(In der Spalte `Verantwortlich`)"
        },
        "accessory": {
          "type": "image",
          "image_url": "https://www.animierte-gifs.net/data/media/1330/animiertes-lucky-luke-bild-0020.gif",
          "alt_text": "alt text for image"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Wieso und Woher kommt dies Nachricht?*\nDiese Nachricht kommt immer, wenn eine Show näher rückt und niemand das Zepter in die Hand nimmt. Dafür gelten folgende Regeln:\n\n* 4-6 Wochen vor dem Termin kommt diese Nachricht ein Mal pro Woche\n * 4-2 Wochen vor dem Termin kommt diese Nachricht zwei Mal pro Woche\n * In den 2 Wochen vor dem Termin kommt sie täglich.\n\n Sobald jemand im Dokument für den Auftritt in der Spalte `Verantwortlich` steht, hört der Spuk auf"
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Los Jetzt!* @channel\n" + getLinkToSpreadsheet(dev)
        }
      }
    ]
  }

}

function sendAlert(payload, webhook, muteHttpExceptions) {
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
