/// <reference path="node_modules/@types/google-apps-script/google-apps-script.spreadsheet.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script-events.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/apis/calendar_v3.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.types.d.ts" />
/// <reference path="slack.ts" />
/// <reference path="logging.ts" />

function getDataFromShowRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, header: any, rowNr: number) {
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

function isShowEventInThePast(sheet, header, rowNr) {
  var eventStart = sheet.getRange(rowNr, header['Start']).getValue();
  if (!eventStart) return;
  var timestamp = eventStart.getTime();
  if (!timestamp) return;
  return new Date().getTime() > timestamp;
}

function showRowToCalendarEvent(showData, calendar) {
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
    Logger.log(FORMAT + 'Event: %s has no start!', WARN, EVENTS, eventId);
    event.start = {};
  }
  if (!event.end) {
    Logger.log(FORMAT + 'Event: %s has no end!', WARN, EVENTS, eventId);
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
    Logger.log(FORMAT + 'updating event: %s. Checking to update event.', INFO, EVENTS, eventId);
  	cEvents.update(event, calendarId, strippedId);
  } else {
    Logger.log(FORMAT + 'Event did not change: %s', TRACE, EVENTS, eventId);
  }
  return postUpdate;
}

function test_areDatesEqual() {
  const a = new Date();
  const b = new Date(a);
  b.setMinutes(0);
  const eq = areDatesEqual(a, b);
  Logger.log(eq);
}

function areDatesEqual(a, b) {
  if (!areDatesEqualDayOnly(a, b)) {
    return false;
  }
  if (a.getHours() != b.getHours()) {
    return false;
  }
  if (a.getMinutes() != b.getMinutes()) {
    return false;
  }
  if (a.getSeconds() != b.getSeconds()) {
    return false;
  }
  if (a.getMilliseconds() != b.getMilliseconds()) {
    return false;
  }
  return true;
}

function areDatesEqualDayOnly(a, b) {
  if (a.getTimezoneOffset() != b.getTimezoneOffset()) {
    return false;
  }
  if (a.getFullYear() != b.getFullYear()) {
    return false;
  }
  if (a.getMonth() != b.getMonth()) {
    return false;
  }
  if (a.getDate() != b.getDate()) {
    return false;
  }
  return true;
}

function formatDateForEvent(date) {
 date = date ? date : new Date();
 var offset = date.getTimezoneOffset();
 return padNumber(date.getFullYear(), 4)
   + "-" + padNumber(date.getMonth() + 1, 2)
   + "-" + padNumber(date.getDate(), 2)
   + "T" + padNumber(date.getHours(), 2)
   + ":" + padNumber(date.getMinutes(), 2)
   + ":" + padNumber(date.getSeconds(), 2)
   + (offset > 0 ? "-" : "+")
   + padNumber(Math.floor(Math.abs(offset) / 60), 2)
   + ":" + padNumber(Math.abs(offset) % 60, 2);
}