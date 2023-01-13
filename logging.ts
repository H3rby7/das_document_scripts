/// <reference path="slack.ts" />
/// <reference path="global-functions.ts" />

const TRACE = logLevel("TRACE");
const DEBUG = logLevel("DEBUG");
const INFO =  logLevel("INFO");
const WARN =  logLevel("WARN");

const AUFTRITTE = fileName("auftritte");
const PROBEN = fileName("proben");
const EVENTS = fileName("events");
const SLACK = fileName("slack");

const FORMAT = "%s - %s => "

function logLevel(level: string) {
  return padText(level, 5, false);
}

function fileName(name: string) {
  return padText(name, 9, true);
}
