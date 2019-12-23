const { IceteaWeb3 } = require("@iceteachain/web3");
const rpc = process.env.ICETEA_RPC || "https://rpc.icetea.io";
const tweb3 = new IceteaWeb3(rpc);

const CONTRACTS = process.env.LOVELOCK_CONTRACT.split(';')

module.exports = {
  isAuthorized: async function(appContract, mainAddress, tokenAddress) {
    if (!CONTRACTS.includes(appContract)) {
      return Promise.resolve(false)
    }

    return tweb3.contract(appContract).methods
      .isAuthorized(mainAddress, tokenAddress, appContract)
      .call()
  }
};
