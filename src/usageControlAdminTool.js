require("dotenv").config();
const usageControlService = require('./service/usageControlService');

if (process.argv.length < 4) {
  console.error("Missing parameter. Usage:");
  console.error("Usage: \n");
  console.error("    getAppUsage [app]: \n");
  console.error("    updateAppUsageLimitation [app]: \n");
  return;
}

const command = process.argv[2];
const app = process.argv[3];
if (command == "getAppUsage"){
  usageControlService.getAppUsage("contract.lovelockdev").then(result=>{
    console.log(result);
  }).then(()=>{
    usageControlService.closeConnection();
  });
}else if (command == "updateAppUsageLimitation") {
  if (process.argv.length < 5) {
    console.error("Missing parameter. Usage npm admin updateAppUsageLimitation [app] [newValue]");
  }
  const newValue = Number(process.argv[4]);
  usageControlService.updateAppUsageLimitation(app, newValue).then(result=>{
    console.log("set new limitation for app "+app);
    console.log(result);
  }).then(()=>{
    usageControlService.closeConnection();
  });
}
