/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />
/// <reference path="properties.ts" />
/// <reference path="global-functions.ts" />
/// <reference path="slack.ts" />
/// <reference path="logging.ts" />

function alertProducerMissingIfNecessary(showData: any, dev = false) {

  if (showData.producer && showData.producer != "") {
    Logger.log(FORMAT + "Event on '%s' (%s) has a producer", TRACE, AUFTRITTE, showData.startDate, showData.eventName);
    return;
  }

  // Show has no producer, check if it is far enough away to not worry
  const utcMillisShowStart = showData.startDate.valueOf();
  if (!isWithinDays(utcMillisShowStart, 42)) {
    Logger.log(FORMAT + "Event on '%s' (%s) is far enough in the future -> does not need a producer (yet)", TRACE, AUFTRITTE, showData.startDate, showData.eventName);
    return;
  }
  // Show is imminent and has no producer... ALARM!
  Logger.log(FORMAT + "Event on '%s' (%s) needs a producer!", DEBUG, AUFTRITTE, showData.startDate, showData.eventName);

  if (shouldSendProducerMissingAlert(utcMillisShowStart)) {
    producerMissing(showData, dev);
  } else {
    Logger.log(FORMAT + "Event on '%s' (%s) will not alert for a producer on this invocation...", DEBUG, AUFTRITTE, showData.startDate, showData.eventName);
  }
}

/**
   * Alert Slack, according to some rules:
   * 
   * Within 42 to 28 days, it is only a weekly reminder on Saturday [weekday #6] at 12AM.
   * Within 28 days to 14 days it will add another reminder to tuesday [weekday #2] at 7pm.
   * Within 14 days turns into a daily reminder at 7pm.
   */
function shouldSendProducerMissingAlert(utcMillisShowStart: number) {
  const today = new Date();
  const weekDay = today.getDay();
  const time = today.getHours();

  if (isWithinDays(utcMillisShowStart, 14)) {
    // Any weekday at 7 PM
    return time == 19;
  }
  if (isWithinDays(utcMillisShowStart, 28)) {
    // Saturday at 12 AM
    if (weekDay === 6 && time === 12) {
      return true;
    }
    // Tuesday at 7 PM
    if (weekDay === 2 && time === 19) {
      return true;
    }
  }
  if (isWithinDays(utcMillisShowStart, 42)) {
    // Saturday at 12 AM
    if (weekDay === 6 && time === 12) {
      return true;
    }
  }
  return false;
}

function test_producerMissingSlackMessage() {
  var data: any = {};
  const format = 'TBD';
  const status = 'zugesagt';
  const notes = 'Fuß, Inder, Tür';
  

  //adjust dates for calendar
  data.location = 'Virtual Testroom';
  data.startDate = new Date(Date.now() + 600000);
  data.eventName = format + ' (' + data.location + '), ' + status;
  data.notes = notes;
  sendSlackAlert(getSlackMessageProducerMissing(data, true), getSlackHookAllgemein(true), false);
}

function producerMissing(showData, dev = false) {
  sendSlackAlert(getSlackMessageProducerMissing(showData, dev), getSlackHookAllgemein(dev), true);
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
