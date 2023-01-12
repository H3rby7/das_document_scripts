var planningSheetID = PropertiesService.getScriptProperties().getProperty('planningSheetID');
var planningSheetName = PropertiesService.getScriptProperties().getProperty('planningSheetName');
var calendarID = PropertiesService.getScriptProperties().getProperty('calendarID');

function test() {
  const spreadsheet = SpreadsheetApp.openById(planningSheetID);
  const sheet = spreadsheet.getSheetByName('testCopy');
  const header = getHeaderOfSheet(sheet);
}

function updateAllShows() {
  const spreadsheet = SpreadsheetApp.openById(planningSheetID);
  const sheet = spreadsheet.getSheetByName(planningSheetName);
  const header = getHeaderOfSheet(sheet);
  const calendar = CalendarApp.getCalendarById(calendarID);
  sortSheet(sheet, header['Start'], true);
  const lastRow = sheet.getLastRow();
  //Tables start with index 1, we ignore the header row as well, which makes it start at 2
  for (var i = 2; i <= lastRow; i++) {
    createOrUpdateEventForShowRow(sheet, header, i, calendar);
  }
}

function createOrUpdateEventForShowRow(sheet, header, rowNr, calendar) {
  // Check if the event has passed already
  if (isShowEventInThePast(sheet, header, rowNr)) {
    Logger.log(FORMAT + 'skipping old show: %s', TRACE, AUFTRITTE, rowNr);
    return;
  }

  // Check for event status.
  // Delete event if 'canceled'
  var eventId = sheet.getRange(rowNr, header['ID']).getValue();
  var status = sheet.getRange(rowNr, header['Status']).getValue();
  if (status == 'abgesagt') {
    if (!eventId) {
      return;
    }
    calendar.getEventById(eventId).deleteEvent();
    sheet.getRange(rowNr, header['ID']).setValue('');
    return;
  }


  // At this point we know the event is not canceled and in the future. Nice!
  const showData = getDataFromShowRow(sheet, header, rowNr);
  if (!eventId) {
    Logger.log(FORMAT + 'eventId not present for row: %s. Creating new Event.', INFO, AUFTRITTE, rowNr);
    var event = showRowToCalendarEvent(showData, calendar);
    sheet.getRange(rowNr, header['ID']).setValue(event.getId());
  } else {
    Logger.log(FORMAT + 'eventId present for row: %s. Checking to update event.', TRACE, AUFTRITTE, rowNr);
    checkAndUpdateShowRowEvent(showData, calendar, eventId);
  }

  alertProducerMissingIfNecessary(showData);

}

function alertProducerMissingIfNecessary(showData) {

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
    producerMissing(showData);
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
function shouldSendProducerMissingAlert(utcMillisShowStart) {
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