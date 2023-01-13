/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.spreadsheet.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.calendar.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/apis/calendar_v3.d.ts" />
/// <reference path="properties.ts" />
/// <reference path="slack.ts" />
/// <reference path="logging.ts" />
/// <reference path="producer-missing.ts" />
/// <reference path="global-functions.ts" />

function test_updateAllShows() {
  updateAllShows(true);
}

function updateAllShows(dev = false) {
  const spreadsheet = SpreadsheetApp.openById(getPlanningSheetID(dev));
  const sheet = spreadsheet.getSheetByName(getPlanningSheetName()) as GoogleAppsScript.Spreadsheet.Sheet;
  const header = getHeaderOfSheet(sheet);
  const calendar = CalendarApp.getCalendarById(getCalendarID(dev));
  sortSheet(sheet, header['Start'], true);
  const lastRow = sheet.getLastRow();
  //Tables start with index 1, we ignore the header row as well, which makes it start at 2
  for (var i = 2; i <= lastRow; i++) {
    createOrUpdateEventForShowRow(sheet, header, i, calendar, dev);
  }
}

function createOrUpdateEventForShowRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, header: any, rowNr: number, calendar: GoogleAppsScript.Calendar.Calendar, dev = false) {
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
    checkAndUpdateShowRowEvent(showData, calendar.getId(), eventId);
  }

  alertProducerMissingIfNecessary(showData, dev);

}

function getDataFromShowRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, header: any, rowNr: number): any {
  var data: any = {};
  //get data from row
  const startDate = sheet.getRange(rowNr, header['Start']).getValue();
  var minutesToMeetBeforeShow = sheet.getRange(rowNr, header['Treffen (vorher MIN)']).getValue();
  var duration = sheet.getRange(rowNr, header['Dauer (MIN)']).getValue();
  const format = sheet.getRange(rowNr, header['Format']).getValue();
  const status = sheet.getRange(rowNr, header['Status']).getValue();
  const producer = sheet.getRange(rowNr, header['Verantwortlich']).getValue();
  const notes = sheet.getRange(rowNr, header['Notizen']).getValue();
  //make sure to have a meeting time
  if (!minutesToMeetBeforeShow || typeof(minutesToMeetBeforeShow)!="number" || minutesToMeetBeforeShow < 1) {
    minutesToMeetBeforeShow = 120;
  }
  //make sure to have a duration
  if (!duration || typeof(duration)!="number" || duration < 1) {
    duration = 120;
  }
  //adjust dates for calendar
  data.location = sheet.getRange(rowNr, header['Location']).getValue();
  data.startDate = new Date(startDate.getTime() - minutesToMeetBeforeShow * 60000);
  data.endDate = new Date(startDate.getTime() + duration * 60000);
  data.eventName = format + ' (' + data.location + '), ' + status;
  data.producer = producer;
  data.notes = notes;
  data.description = 'Verantwortlich: ' + producer + '\n' + notes;
  return data;
}

function isShowEventInThePast(sheet: GoogleAppsScript.Spreadsheet.Sheet, header: any, rowNr: number): boolean {
  var eventStart = sheet.getRange(rowNr, header['Start']).getValue();
  if (!eventStart) {
    Logger.log(FORMAT + 'Event at row: %s has no value for column START!', WARN, AUFTRITTE, rowNr);
    return true;
  }
  var timestamp = eventStart.getTime();
  if (!timestamp) {
    Logger.log(FORMAT + 'Event at row: %s has no STARTING TIME!', WARN, AUFTRITTE, rowNr);
    return true;
  }
  return new Date().getTime() > timestamp;
}

function showRowToCalendarEvent(showData: any, calendar: GoogleAppsScript.Calendar.Calendar): GoogleAppsScript.Calendar.CalendarEvent {
  // create event with all necessities
  const event = calendar.createEvent(
    showData.eventName,
    showData.startDate,
    showData.endDate
  )
  event.setLocation(showData.location);
  event.setDescription(showData.description);
  return event;
}

function checkAndUpdateShowRowEvent(showData: any, calendarId: string, eventId: string): boolean {
  const strippedId = eventId.split('@')[0];
  const cEvents = Calendar.Events as GoogleAppsScript.Calendar.Collection.EventsCollection;
  const event = cEvents.get(calendarId, strippedId) as GoogleAppsScript.Calendar.Schema.Event;
  const startDate = formatDateForEvent(showData.startDate);
  const endDate = formatDateForEvent(showData.endDate);
  
  var postUpdate = false;
  if (!event.start) {
    Logger.log(FORMAT + 'Event: %s has no start!', WARN, AUFTRITTE, eventId);
    event.start = {};
  }
  if (!event.end) {
    Logger.log(FORMAT + 'Event: %s has no end!', WARN, AUFTRITTE, eventId);
    event.end = {};
  }
  if (event.summary !== showData.eventName) {
    event.summary = showData.eventName;
    postUpdate = true;
  }
  if (event.start.dateTime !== startDate) {
    event.start.dateTime = startDate;
    postUpdate = true;
  }
  if (event.end.dateTime !== endDate) {
    event.end.dateTime = endDate;
    postUpdate = true;
  }
  if (event.description !== showData.description) {
    event.description = showData.description;
    postUpdate = true;
  }
  if (event.location !== showData.location) {
    event.location = showData.location;
    postUpdate = true;
  }
  if(postUpdate) {
    Logger.log(FORMAT + 'updating event: %s. Checking to update event.', INFO, AUFTRITTE, eventId);
  	cEvents.update(event, calendarId, strippedId);
  } else {
    Logger.log(FORMAT + 'Event did not change: %s', TRACE, AUFTRITTE, eventId);
  }
  return postUpdate;
}