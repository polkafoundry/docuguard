const { IceteaWeb3 } = require("@iceteachain/web3");
const rpc = process.env.ICETEA_RPC || "https://rpc.icetea.io";
const tweb3 = new IceteaWeb3(rpc);

const ct = process.env.LOVELOCK_CONTRACT.split(';')
const contract = tweb3.contract(ct[0]);

module.exports = {
  isAuthorized: async function(mainAddress, tokenAddress) {
    return contract.methods
      .isAuthorized(mainAddress, tokenAddress, ct)
      .call()
  }
};
