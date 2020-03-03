const { IceteaWeb3 } = require("@iceteachain/web3");
const rpc = process.env.ICETEA_RPC || "https://rpc.icetea.io";
const tweb3 = new IceteaWeb3(rpc);
const usageControlService = require('./service/usageControlService');

module.exports = {
  isAuthorized: async function(appContract, mainAddress, tokenAddress, dataSize) {
    return usageControlService
      .getCurrentAppUsage(appContract)
      .then(result => {
        //if app contract not exists -> hasn't approved, return false
        if (result == null) {
          return false;
        }

        return tweb3.contract(appContract).methods
          .isAuthorized(mainAddress, tokenAddress, appContract)
          .call()
      });
  }
};
