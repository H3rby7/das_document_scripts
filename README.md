# Automation Scripts

For Improv Group, from Planning spreadsheet to google calendar events and slack notifiers.

# Run

In google apps scripts. Make sure to set the necessary script properties as indicated in [properties.ts](properties.ts).

# Develop

Locally, [pull/push via clasp](https://github.com/H3rby7/clasp-docker).

  clasp login
  clasp pull
  [... work ...]
  git add -p
  git commit
  [... work ...]
  clasp version "description text"
  <Created Version 0000>
  clasp deploy -V 0000
  clasp push

Visit AppsScript in Web -> https://script.google.com/home/projects

Create new hourly trigger and delete old ones for:

  trigger_trainings (updates trainings in calendar)
  trigger_shows (updates shows in calendar)

Create new weekly trigger for tuesday 6-7pm for

  trigger_probe (posts time and location for next days rehearsal)


## DEV env

Highly suggest to have a copy of your planning spreadsheet and calendar(s) to test with.
