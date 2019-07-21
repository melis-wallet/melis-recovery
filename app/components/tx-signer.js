import RSVP from 'rsvp';
import Component from '@ember/component';
import { next } from '@ember/runloop';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object'

import CM from 'npm:melis-api-js';
const C = CM.C
const Bitcoin = CM.Bitcoin
const Buffer = CM.Buffer
let self

import MelisCredentials from 'npm:melis-credentials-seed';
const bip39 = new MelisCredentials.credentials()

function parseMnemonics(mnemonics) {
  return mnemonics.map(o => {
    return bip39.parseMnemonics(o.words, o.password)
  })
}

function signTxs() {
  const recoveryInfo = self.get('recoveryInfo')
  const accountInfo = recoveryInfo.accountInfo
  console.log('[tx-signer] mnemonics:', recoveryInfo.mnemonics)
  console.log('[tx-signer] txBuilder:', recoveryInfo.txBuilder)
  const onlyOneBigTx = recoveryInfo.selectionResult.oneBig
  const txBuilder = recoveryInfo.txBuilder
  const seedInfo = parseMnemonics(recoveryInfo.mnemonics)
  console.log("[tx-signer] seedInfo: ", seedInfo)
  const coin = recoveryInfo.accountInfo.coin
  const cm = recoveryInfo.cm
  console.log('[tx-signer] Account type: ' + accountInfo.type + ' coin: ' + coin + " useTestPaths: " + cm.useTestPaths)
  const seeds = seedInfo.map(item => item.seed)
  const promises = []
  for (let i = 0; (!onlyOneBigTx && i < txBuilder.length) || (onlyOneBigTx && i === 0); i++) {
    const inputData = txBuilder[i]
    console.log('accountInfo.type: ' + accountInfo.type + ' inputData:', inputData)
    const unspents = inputData.unspents ? inputData.unspents : [inputData.unspent]
    console.log("Recovery input#" + i + " output address: " + inputData.address + " fees: " + inputData.fees + " out: " + (inputData.amount - inputData.fees))
    let promise
    if (accountInfo.type === C.TYPE_PLAIN_HD) {
      promise = cm.recoveryPrepareSimpleTx({
        seed: seeds[0], accountInfo, unspents,
        fees: inputData.fees, destinationAddress: inputData.address
      })
    } else {
      const tx = Bitcoin.Transaction.fromBuffer(new Buffer(inputData.txData.rawTx, 'base64'))
      const outputSig = cm.toOutputScript(coin, inputData.address)
      tx.addOutput(outputSig, inputData.amount - inputData.fees)
      promise = cm.recoveryPrepareMultiSigTx(accountInfo, tx, unspents, seeds, inputData.txData.sigs)
    }
    promises.push(promise.then(nativeTx => {
      const tx = nativeTx.toHex()
      console.log('recovered tx: ', tx)
      console.log('recovered tx hash: ', nativeTx.getHash().toString('hex'))
      return { coin, tx, to: inputData.address, amount: inputData.amount, fees: inputData.fees, lastMsg:'[result]'}
    }))
  }
  console.log("# of promises created: " + promises.length)
  RSVP.all(promises).then(res => {
    console.log("All promises resolved: ", res)
    self.set('signedTxs', res)
    self.set('loading', false)
  })
}

export default Component.extend({

  explorer: service(),
  signedTxs: null,
  signing: false,
  provider: null,

  pushDisabled: computed('signedTxs', 'pushed', function() {
    const signedTxs = this.get('signedTxs')
    const pushed = this.get('pushed')
    console.log("[computed] pushed: "+pushed+" #signedTxs: ", signedTxs.length)
    return pushed || signedTxs.length == 0
  }),

  init() {
    this._super(...arguments)
    self = this
    //const explorer = self.get('explorer')
    //const recoveryInfo = this.get('recoveryInfo')
    //this.set('provider', {api: explorer.getName(recoveryInfo.coin) })
    // const provider = {
    //   api: explorer.getBaseApi(recoveryInfo.accountInfo.coin),
    //   lastMsg: 'Click to push'
    // }
    // this.set('provider', provider)
  },

  actions: {

    prepareSingleTxRecovery: function () {
      this.set('signedTxs', [])
      this.set('loading', true)
      next(this, signTxs)
    },

    //pushTx: function (obj, provider) {
    pushTx: function (obj) {
      console.log("Push tx called with:", obj)
      const explorer = self.get('explorer')
      console.log("Pushing tx: " + obj.tx)
      this.set('pushed', true)
      explorer.pushTx(obj.coin, obj.tx).then(txid => {
        set(obj, 'lastMsg', 'Result: ' + txid)
      }).catch(err => {
        console.log("Push Exception: ", err)
        set(obj, 'lastMsg', 'ERROR: ' + err.message)
      })
      //const recoveryInfo = this.get('recoveryInfo')
      // console.log('Push apiName:' + provider + " isTestnet: " + recoveryInfo.isTestnet + " obj:", obj)
      // let extApis = new CM.BC_APIS().getProvider(provider, recoveryInfo.isTestnet).api
      // extApis.submitTx(obj.tx).then(res => {
      //   console.log("Push result:", res)
      //   set(obj, provider, { res: 'SUCCESS! ' + JSON.stringify(res) })
      // }).catch(err => {
      //   console.log("Push Exception: ", err)
      //   set(obj, provider, { res: 'ERROR: ' + JSON.stringify(err) })
      // })
    }
  }
})
