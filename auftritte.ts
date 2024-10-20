/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.spreadsheet.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.calendar.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/apis/calendar_v3.d.ts" />
/// <reference path="properties.ts" />
/// <reference path="slack.ts" />
/// <reference path="logging.ts" />
/// <reference path="producer-missing.ts" />
/// <reference path="global-functions.ts" />

interface Show {
  location: string;
  startDate: Date;
  endDate: Date;
  eventName: string;
  producer: string;
  notes: string;
  description: string;
}

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
  for (let i = 2; i <= lastRow; i++) {
    try {
      createOrUpdateEventForShowRow(sheet, header, i, calendar, dev);
    } catch (e) {
      Logger.log(FORMAT + "Row '%s' returned error...", ERROR, AUFTRITTE, i);
      Logger.log(e);
    }
  }
}

function createOrUpdateEventForShowRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, header: Header, rowNr: number, calendar: GoogleAppsScript.Calendar.Calendar, dev = false) {
  // Check if the event has passed already
  if (isShowEventInThePast(sheet, header, rowNr)) {
    Logger.log(FORMAT + 'skipping old show: %s', TRACE, AUFTRITTE, rowNr);
    return;
  }

  // Check for event status.
  // Delete event if 'canceled'
  const eventId = sheet.getRange(rowNr, header['ID']).getValue();
  const status = sheet.getRange(rowNr, header['Status']).getValue();
  if (status == 'abgesagt') {
    if (!eventId) {
      return;
    }
    Logger.log(FORMAT + "Deleting Event of row '%s' with the ID '%s'.", INFO, AUFTRITTE, rowNr, eventId);
    calendar.getEventById(eventId).deleteEvent();
    sheet.getRange(rowNr, header['ID']).setValue('');
    return;
  }

  // At this point we know the event is not canceled and in the future. Nice!
  const showData = getDataFromShowRow(sheet, header, rowNr);
  if (!eventId) {
    Logger.log(FORMAT + 'eventId not present for row: %s. Creating new Event.', INFO, AUFTRITTE, rowNr);
    const event = showRowToCalendarEvent(showData, calendar);
    sheet.getRange(rowNr, header['ID']).setValue(event.getId());
  } else {
    Logger.log(FORMAT + 'eventId present for row: %s. Checking to update event.', TRACE, AUFTRITTE, rowNr);
    const event = calendar.getEventById(eventId);
    if (!event) {
      Logger.log(FORMAT + 'eventId for row: %s seems to be invalid, clearing and re-running.', WARN, AUFTRITTE, rowNr);
      sheet.getRange(rowNr, header['ID']).setValue('');
      createOrUpdateEventForShowRow(sheet, header, rowNr, calendar, dev);
      return;
    }
    if (event.getTitle() === '') {
      Logger.log(FORMAT + 'Event %s title is empty, which results in errors when updating. Deleting event and triggering recreation...', WARN, PROBEN, eventId);
      event.deleteEvent();
      Logger.log(FORMAT + 'Event %s deleted, clearing ID of row %s', DEBUG, PROBEN, eventId, rowNr);
      sheet.getRange(rowNr, header['ID']).setValue('');
      Logger.log(FORMAT + 'Row %s cleared of event %s. Triggering recreation.', DEBUG, PROBEN, rowNr, eventId);
      createOrUpdateEventForShowRow(sheet, header, rowNr, calendar, dev);
      return;
    }
    patchEvent(event, showData, AUFTRITTE);
  }

  alertProducerMissingIfNecessary(showData, dev);

}

function getDataFromShowRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, header: Header, rowNr: number): Show {
  //get data from row
  const startDate = sheet.getRange(rowNr, header['Start']).getValue();
  let minutesToMeetBeforeShow = sheet.getRange(rowNr, header['Treffen (vorher MIN)']).getValue();
  let duration = sheet.getRange(rowNr, header['Dauer (MIN)']).getValue();
  const format = sheet.getRange(rowNr, header['Format']).getValue();
  const status = sheet.getRange(rowNr, header['Status']).getValue();
  const producer = sheet.getRange(rowNr, header['Verantwortlich']).getValue();
  const notes = sheet.getRange(rowNr, header['Notizen']).getValue();
  //make sure to have a meeting time
  if (!minutesToMeetBeforeShow || typeof(minutesToMeetBeforeShow)!="number" || minutesToMeetBeforeShow < 1) {
    minutesToMeetBeforeShow = 120;
  }
  //make sure to have a duration
  if (!duration || typeof(duration) != "number" || duration < 1) {
    duration = 120;
  }
  //adjust dates for calendar
  const location = sheet.getRange(rowNr, header['Location']).getValue();
  const meetUpDate = new Date(startDate.getTime() - minutesToMeetBeforeShow * 60000);
  const endDate = new Date(startDate.getTime() + duration * 60000);
  const eventName = format + ' (' + location + '), ' + status;
  const description = 'Verantwortlich: ' + producer + '\n' + notes;
  return {
    eventName,
    location,
    startDate: meetUpDate,
    description,
    endDate,
    producer,
    notes
  };
}

function isShowEventInThePast(sheet: GoogleAppsScript.Spreadsheet.Sheet, header: Header, rowNr: number): boolean {
  const eventStart = sheet.getRange(rowNr, header['Start']).getValue();
  if (!eventStart) {
    Logger.log(FORMAT + 'Event at row: %s has no value for column START!', WARN, AUFTRITTE, rowNr);
    return true;
  }
  const timestamp = eventStart.getTime();
  if (!timestamp) {
    Logger.log(FORMAT + 'Event at row: %s has no STARTING TIME!', WARN, AUFTRITTE, rowNr);
    return true;
  }
  return new Date().getTime() > timestamp;
}

function showRowToCalendarEvent(show: Show, calendar: GoogleAppsScript.Calendar.Calendar): GoogleAppsScript.Calendar.CalendarEvent {
  // create event with all necessities
  const event = calendar.createEvent(
    show.eventName,
    show.startDate,
    show.endDate
  )
  event.setLocation(show.location);
  event.setDescription(show.description);
  return event;
}
