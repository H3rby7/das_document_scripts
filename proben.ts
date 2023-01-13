/// <reference path="node_modules/@types/google-apps-script/google-apps-script.spreadsheet.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.calendar.d.ts" />
/// <reference path="properties.ts" />
/// <reference path="slack.ts" />
/// <reference path="logging.ts" />
/// <reference path="global-functions.ts" />

const reminders = [60, 180, 24*60];

function test_updateAllTrainings() {
  updateAllTrainings(true);
}

function updateAllTrainings(dev = false) {
  // Get the right TAB
  const spreadsheet = SpreadsheetApp.openById(getPlanningSheetID(dev));
  const sheet = spreadsheet.getSheetByName(getTrainingSheetName()) as GoogleAppsScript.Spreadsheet.Sheet;
  // Get Headers
  const header = getHeaderOfSheet(sheet);
  // Get Calendar
  const calendar = CalendarApp.getCalendarById(getCalendarID(dev));
  sortSheet(sheet, header['Datum'], false);
  const lastRow = sheet.getLastRow();
  const now = new Date().getTime();
  //Tables start with index 1, we ignore the header row as well, which makes it start at 2
  for (var i = 2; i <= lastRow; i++) {
    var currentTraining = getDataFromTrainingRow(sheet, header, i);
    // If the start time is BEFORE now we stop
    if (currentTraining.startDate.getTime() < now) {
      Logger.log(FORMAT + 'reached old trainings at row: %s, aborting mission', INFO, PROBEN, i);
      return;
    }
    // Else we Create/Update/Delete Events based on the data
    createOrUpdateEventForTrainingRow(sheet, header, i, calendar, dev);
  }
}

function createOrUpdateEventForTrainingRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, header: any, rowNr: number, calendar: GoogleAppsScript.Calendar.Calendar, dev = false): string | undefined {
  var eventId = sheet.getRange(rowNr, header['ID']).getValue();
  var status = sheet.getRange(rowNr, header['Status']).getValue();
  if (status == 'fällt aus') {
    // Check if we also have an ID
    if (!eventId) {
      return;
    }
    // We do - we cancel the event in our calendar
    calendar.getEventById(eventId).deleteEvent();
    sheet.getRange(rowNr, header['ID']).setValue('');
    return;
  }
  if (!eventId) {
    // No ID = New Event
    Logger.log(FORMAT + 'eventId not present for Row %s. Creating new Event.', INFO, PROBEN, rowNr);
    eventId = trainingRowToCalendarEvent(sheet, header, rowNr, calendar, dev);
    sheet.getRange(rowNr, header['ID']).setValue(eventId);
    return eventId;
  }
  // We have an event ID for this row, check for updates
  Logger.log(FORMAT + 'eventId present for Row %s. Checking to update event.', TRACE, PROBEN, rowNr);
  checkAndUpdateTrainingRowEvent(sheet, header, rowNr, calendar, eventId, dev);
  return eventId;
}

// This function creates new Events based on the passed data
function trainingRowToCalendarEvent(sheet: GoogleAppsScript.Spreadsheet.Sheet, header: any, rowNr: number, calendar: GoogleAppsScript.Calendar.Calendar, dev = false): string {
  const data = getDataFromTrainingRow(sheet, header, rowNr);
  // create event with all necessities
  const event = calendar.createEvent(
    data.eventName,
    data.startDate,
    data.endDate
  )
  event.setDescription(data.description);
  event.setLocation(data.location);
  for (var r in reminders) {
    event.addPopupReminder(reminders[r]);
  }
  if (data.type === 'Impro-Jam') {
    // Invites the open calendar to the public event.
    event.addGuest(getJamGuestEmail(dev));
  }
  return event.getId();
}

function checkAndUpdateTrainingRowEvent(sheet: GoogleAppsScript.Spreadsheet.Sheet, header: any, rowNr: number, calendar: GoogleAppsScript.Calendar.Calendar, eventId: string, dev = false) {
  const event = calendar.getEventById(eventId);
  const dataNow = getDataFromTrainingRow(sheet, header, rowNr);
  
  if (event.getTitle() !== dataNow.eventName) {
    event.setTitle(dataNow.eventName);
    Logger.log(FORMAT + 'Event: %s, updating summary', INFO, PROBEN, eventId);
  }
  if (!areDatesEqual(event.getStartTime(), dataNow.startDate) || !areDatesEqual(event.getEndTime(), dataNow.endDate)) {
    event.setTime(dataNow.startDate, dataNow.endDate);
    Logger.log(FORMAT + 'Event: %s, updating time', INFO, PROBEN, eventId);
  }
  if (event.getDescription() !== dataNow.description) {
    event.setDescription(dataNow.description);
    Logger.log(FORMAT + 'Event: %s, updating description', INFO, PROBEN, eventId);
  }
  if (event.getLocation() !== dataNow.location) {
    event.setLocation(dataNow.location);
    Logger.log(FORMAT + 'Event: %s, updating location', INFO, PROBEN, eventId);
  }
  if (dataNow.type === 'Impro-Jam') {
    // It is a JAM
    if (event.getGuestByEmail(getJamGuestEmail(dev)) == null) {
      // Guest is not yet inivited -> invite
      event.addGuest(getJamGuestEmail(dev));
      Logger.log(FORMAT + 'Event %s is a jam, added guest %s', DEBUG, PROBEN, event.getId(), getJamGuestEmail(dev));
    }
  } else {
    // It is not a JAM
    if (event.getGuestByEmail(getJamGuestEmail(dev)) != null) {
      // Guest is invited, but it is not public -> remove
      event.removeGuest(getJamGuestEmail(dev));
      Logger.log(FORMAT + 'Event %s is not a jam (anymore?), removed guest %s', DEBUG, PROBEN, event.getId(), getJamGuestEmail(dev));
    }
  }
}

// CORE function, retrieves all data and puts it into one object for simple useage
function getDataFromTrainingRow(sheet: GoogleAppsScript.Spreadsheet.Sheet, header: any, rowNr: number): any {
  var data: any = {};
  //get data from row
  const type = sheet.getRange(rowNr, header['Probenform']).getValue();
  const location = sheet.getRange(rowNr, header['Location']).getValue();
  const status = sheet.getRange(rowNr, header['Status']).getValue();
  var durationInHours = sheet.getRange(rowNr, header['Dauer (in H)']).getValue();
  const notes = sheet.getRange(rowNr, header['Notizen']).getValue();
  var trainer = sheet.getRange(rowNr, header['Leitung']).getValue();
  var topic = sheet.getRange(rowNr, header['Thema']).getValue();
  //make sure to have a duration
  var duration = 120;
  if (durationInHours) {
    duration = durationInHours * 60;
  }
  if (!trainer || trainer === '') {
    trainer = 'Offen';
  }
  if (!topic || topic === '') {
    topic = 'Unbekanntes Thema';
  }
  //adjust dates for calendar
  data.startDate = sheet.getRange(rowNr, header['Datum']).getValue();
  data.endDate = new Date(data.startDate.getTime() + (duration * 60000));
  data.eventName = type + ': ' + topic + ', ' + status + '';
  data.description = 'Leitung: ' + trainer + '\n' + notes;
  data.location = location;
  // additional info
  data.type = type;
  data.topic = topic;
  data.status = status;
  data.trainer = trainer;
  data.notes = notes;
  return data;
}