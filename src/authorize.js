const { IceteaWeb3 } = require("@iceteachain/web3");
const rpc = process.env.ICETEA_RPC || "https://rpc.icetea.io";
const tweb3 = new IceteaWeb3(rpc);

let ct = process.env.LOVELOCK_CONTRACT
const contract = tweb3.contract(ct);

module.exports = {
  isAuthorized: async function(mainAddress, tokenAddress) {
    if (ct.includes('.')) {
      ct = await tweb3.contract('system.alias').resolve(ct).call()
    }
    return contract.methods
      .isAuthorized(mainAddress, tokenAddress, ct)
      .call()
  }
};
