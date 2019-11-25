const { IceteaWeb3 } = require('@iceteachain/web3')
const rpc = process.env.ICETEA_RPC || 'https://rpc.icetea.io'
const tweb3 = new IceteaWeb3(rpc)

// Change the contract after each deployed
// const contractAddress = process.env.PROXY_CONTRACT
const contractAddress = 'teat1dpgwlr06ve6njgwlczxvf877mr7gq3lrmj5fqh'
const contract = tweb3.contract(contractAddress)

module.exports = {
  checkAuthorize: function (token) {
    return new Promise((resolve, reject) => {
      contract.methods.isAuthorized(token).call().then(ok => {
        if (ok) {
          resolve(true)
        } else {
          reject('something went wrong')
        }
      }).catch(e => reject(e))
    })
  }
}