/// <reference path="node_modules/@types/google-apps-script/google-apps-script.properties.d.ts" />
/// <reference path="node_modules/@types/google-apps-script/google-apps-script.base.d.ts" />

function printProperties() {
  const properties = PropertiesService.getScriptProperties();
  const keys = properties.getKeys();
  keys.sort().forEach(key => {
    Logger.log("'%s': '%s'", key, properties.getProperty(key));
  })
}

function configure() {
  Logger.log("\n\n============= Previous Properties =============");
  printProperties();

  // PropertiesService.getScriptProperties().setProperty("myKey", "myValue");
  // PropertiesService.getScriptProperties().deleteProperty("myKey");
  
  Logger.log("\n\n============= New Properties =============");
  printProperties();
}