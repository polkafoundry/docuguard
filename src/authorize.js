const { IceteaWeb3 } = require('@iceteachain/web3')
const tweb3 = new IceteaWeb3('https://rpc.icetea.io')

// Change the contract after each deployed
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