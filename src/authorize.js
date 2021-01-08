const { IceteaWeb3 } = require("@iceteachain/web3");
const logger = require("./log/logger");
const rpc = process.env.ICETEA_RPC || "https://rpc.icetea.io";
const tweb3 = new IceteaWeb3(rpc);
const usageControlService = require('./service/usageControlService');

module.exports = {
  isAuthorized: async function(appContract, mainAddress, tokenAddress, dataSize) {
    return usageControlService
      .getAppUsage(appContract)
      .then(result => {
        //if app contract not exists -> hasn't approved, return false
        if (result == null) {
          return false;
        }

        logger.info("appContract: " + appContract);
        logger.info("mainAddress: " + mainAddress)
        logger.info("tokenAddress: " + tokenAddress);

        return tweb3.contract(appContract).methods
          .isAuthorized(mainAddress, tokenAddress, appContract)
          .call()
      });
  }
};
