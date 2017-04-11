import Ember from 'ember';
import RSVP from 'rsvp';

import CM from 'npm:melis-api-js';
const C = CM.C
const Bitcoin = CM.Bitcoin
const Buffer = CM.Buffer

import MelisCredentials from 'npm:melis-credentials-seed';
const bip39 = new MelisCredentials.credentials()

function parseMnemonics(mnemonics) {
  return mnemonics.map(o => {
    return bip39.parseMnemonics(o.words, o.password)
  })
}

function signTxs() {
  let self = this
  const recoveryInfo = self.get('recoveryInfo')
  console.log('[tx-signer] mnemonics:', recoveryInfo.mnemonics)
  console.log('[tx-signer] txBuilder:', recoveryInfo.txBuilder)
  const onlyOneBigTx = recoveryInfo.selectionResult.oneBig
  const txBuilder = recoveryInfo.txBuilder
  const seedInfo = parseMnemonics(recoveryInfo.mnemonics)
  console.log("[tx-signer] seedInfo: ", seedInfo)
  let isTestnet = recoveryInfo.network === C.CHAIN_TESTNET
  let cm = new CM(isTestnet ? {apiDiscoveryUrl: C.MELIS_TEST_DISCOVER} : {})
  const network = cm.decodeNetworkName(recoveryInfo.network)
  console.log('[tx-signer] Account Type: ' + recoveryInfo.accountInfo.type + ' Network:', network)
  const seeds = seedInfo.map(item => item.seed)
  let promises = []
  for (let i = 0; (!onlyOneBigTx && i < txBuilder.length) || (onlyOneBigTx && i === 0); i++) {
    let inputData = txBuilder[i]
    console.log('preparing TX -- inputData:', inputData)
    const unspents = inputData.unspents ? inputData.unspents : [inputData.unspent]
    const outputSig = Bitcoin.address.toOutputScript(inputData.address, network)
    console.log("Recovery input#" + i + " outputSig: " + outputSig.toString('hex') + " fees: " + inputData.fees + " out: " + (inputData.amount - inputData.fees))
    if (recoveryInfo.accountInfo.type === C.TYPE_PLAIN_HD) {
      let seed = seeds[0]
      const hd = Bitcoin.HDNode.fromSeedHex(seed, network)
      const builder = new Bitcoin.TransactionBuilder(network)
      const unspent = inputData.unspent
      builder.addInput(unspent.tx, unspent.n, Bitcoin.Transaction.DEFAULT_SEQUENCE)
      builder.addOutput(outputSig, inputData.amount - inputData.fees)
      let key = cm.deriveHdAccount_explicit(network, hd, recoveryInfo.accountInfo.accountNum, unspent.aa.chain, unspent.aa.hdindex)
      builder.sign(0, key.keyPair)
      let tx = builder.build()
      let hexTx = tx.toHex()
      console.log('recovered tx: ', hexTx)
      console.log('recovered tx hash: ', tx.getHash().toString('hex'))
      promises.push(RSVP.resolve({tx: hexTx, to: inputData.address, amount: inputData.amount, fees: inputData.fees}))
    } else {
      let tx = Bitcoin.Transaction.fromBuffer(new Buffer(inputData.txData.rawTx, 'base64'))
      let outputSig = Bitcoin.address.toOutputScript(inputData.address, network)
      tx.addOutput(outputSig, inputData.amount - inputData.fees)
      let sigs = [inputData.txData]
      console.log("seeds: ", seeds)
      promises.push(cm.recoveryPrepareTransaction(recoveryInfo.accountInfo, tx, unspents, seeds, sigs, network).then(tx => {
        let hexTx = tx.toHex()
        console.log('recovered tx: ', hexTx)
        console.log('recovered tx hash: ', tx.getHash().toString('hex'))
        return {tx: hexTx, to: inputData.address, amount: inputData.amount, fees: inputData.fees}
      }))
    }
  }
  console.log("# of promises created: " + promises.length)
  RSVP.all(promises).then(res => {
    console.log("All promises resolved: ", res)
    self.set('signedTxs', res)
    self.set('loading', false)
  })
}

const testnetProviders = [
  {name: 'BlockCypher.com', code: 'blockcyphercom'}
]

const prodnetProviders = [
  {name: 'BlockCypher.com', code: 'blockcyphercom'},
  {name: 'Chain.so', code: 'chainso'}
]

export default Ember.Component.extend({

  signedTxs: null,
  signing: false,
  pushProviders: testnetProviders,

  init() {
    this._super(...arguments)
    let recoveryInfo = this.get('recoveryInfo')
    if (recoveryInfo.isTestnet)
      this.set('pushProviders', testnetProviders)
    else
      this.set('pushProviders', prodnetProviders)
  },

  actions: {

    prepareSingleTxRecovery: function () {
      this.set('signedTxs', [])
      this.set('loading', true)
      Ember.run.next(this, signTxs)
    },

    pushTx: function (obj, provider) {
      const recoveryInfo = this.get('recoveryInfo')
      console.log('Push apiName:' + provider + " isTestnet: " + recoveryInfo.isTestnet + " obj:", obj)
      let extApis = new CM.BC_APIS().getProvider(provider, recoveryInfo.isTestnet).api
      extApis.submitTx(obj.tx).then(res => {
        console.log("Push result:", res)
        Ember.set(obj, provider, {res: 'SUCCESS! ' + JSON.stringify(res)})
      }).catch(err => {
        console.log("Push Exception: ", err)
        Ember.set(obj, provider, {res: 'ERROR: ' + JSON.stringify(err)})
      })
    }
  }
})