const { IceteaWeb3 } = require("@iceteachain/web3");
const rpc = process.env.ICETEA_RPC || "https://rpc.icetea.io";
const tweb3 = new IceteaWeb3(rpc);

// Change the contract after each deployed
const contract = tweb3.contract(process.env.LOVELOCK_CONTRACT);

module.exports = {
  isAuthorized: function(mainAddress, tokenAddress) {
      contract.methods
        .isAuthorized(mainAddress, tokenAddress, process.env.LOVELOCK_CONTRACT)
        .call()
  }
};
