/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />
/// <reference path="auftritte.ts" />
/// <reference path="properties.ts" />
/// <reference path="global-functions.ts" />
/// <reference path="slack.ts" />
/// <reference path="logging.ts" />

function alertProducerMissingIfNecessary(show: Show, dev = false) {

  if (show.producer && show.producer != "") {
    Logger.log(FORMAT + "Event on '%s' (%s) has a producer", TRACE, PRODUCER_MISSING, show.startDate, show.eventName);
    return;
  }

  // Show has no producer, check if it is far enough away to not worry
  const utcMillisShowStart = show.startDate.valueOf();
  if (!isWithinDays(utcMillisShowStart, 90)) {
    Logger.log(FORMAT + "Event on '%s' (%s) is far enough in the future -> does not need a producer (yet)", TRACE, AUFTRITTE, show.startDate, show.eventName);
    return;
  }
  // Show is imminent and has no producer... ALARM!
  Logger.log(FORMAT + "Event on '%s' (%s) needs a producer!", DEBUG, PRODUCER_MISSING, show.startDate, show.eventName);

  if (shouldSendProducerMissingAlert(utcMillisShowStart)) {
    producerMissing(show, dev);
  } else {
    Logger.log(FORMAT + "Event on '%s' (%s) will not alert for a producer on this invocation...", DEBUG, PRODUCER_MISSING, show.startDate, show.eventName);
  }
}

/**
   * Alert Slack, according to some rules:
   *
   * Within 90 to 31 days, it is only a weekly reminder on Saturday [weekday #6] at 12AM.
   * Within 31 days to 14 days it will add another reminder to tuesday [weekday #2] at 7pm.
   * Within 14 days turns into a daily reminder at 7pm.
   */
function shouldSendProducerMissingAlert(utcMillisShowStart: number): boolean {
  const today = new Date();
  const weekDay = today.getDay();
  const time = today.getHours();

  if (isWithinDays(utcMillisShowStart, 14)) {
    // Any weekday at 7 PM
    return time == 19;
  }
  if (isWithinDays(utcMillisShowStart, 31)) {
    // Saturday at 12 AM
    if (weekDay === 6 && time === 12) {
      return true;
    }
    // Tuesday at 7 PM
    if (weekDay === 2 && time === 19) {
      return true;
    }
  }
  if (isWithinDays(utcMillisShowStart, 90)) {
    // Saturday at 12 AM
    if (weekDay === 6 && time === 12) {
      return true;
    }
  }
  return false;
}

function test_producerMissingSlackMessage() {
  const location = 'Virtual Testroom';
  const startDate = new Date(Date.now() + 600000);
  
  const data: Show = {
    startDate,
    endDate: new Date(startDate.getUTCMilliseconds() + 1200000),
    eventName: 'TBD (' + location + '), zugesagt',
    location,
    notes: 'Fuß, Inder, Tür',
    producer: "Chaplin",
    description: "descr"
  };

  sendSlackAlert(getSlackMessageProducerMissing(data, true), getSlackHookAllgemein(true), false);
}

function producerMissing(show: Show, dev = false) {
  sendSlackAlert(getSlackMessageProducerMissing(show, dev), getSlackHookAllgemein(dev), true);
}

function getSlackMessageProducerMissing(show: Show, dev = false): SlackBlocks {
  Logger.log(FORMAT + "Producing Slack alert for missing producer on '%s' (%s)!", INFO, PRODUCER_MISSING, show.startDate, show.eventName);

  const showStart = new Date(show.startDate);
  const date = formatDateForHumans(showStart);
  const time = formatTimeForHumans(showStart);

  // https://app.slack.com/block-kit-builder
  return {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Producer fehlt für Auftritt am " + date + " um " + time + " Uhr, Location: " + show.location + "!*"
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
          "text": "*Wieso und Woher kommt dies Nachricht?*\nDiese Nachricht kommt immer, wenn eine Show näher rückt und niemand das Zepter in die Hand nimmt. Dafür gelten folgende Regeln:\n\n* drei bis ein Monate vor dem Termin kommt diese Nachricht ein Mal pro Woche\n * Vier bis zwei Wochen vor dem Termin kommt diese Nachricht zwei Mal pro Woche\n * In den 2 Wochen vor dem Termin kommt sie täglich.\n\n Sobald jemand im Dokument für den Auftritt in der Spalte `Verantwortlich` steht, hört der Spuk auf"
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
