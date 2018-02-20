import Component from '@ember/component';
import { computed } from '@ember/object';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';

import CM from 'npm:melis-api-js';
//const C = CM.C

let self

function goStep(self, n) {
  self.set('step', n)
}

export default Component.extend({
  explorer: service(),
  step: 0,
  filename: null,
  fileValidated: false,
  recoveryInfo: null,
  txData: null,
  oneBigDisabled: true,
  singleDisabled: true,

  // Filled by components
  txBuilderForm: null,
  unspentsSelector: null,

  fileError: null,

  init() {
    this._super(...arguments)
    self = this
  },

  fileChanged: (function () {
    const explorer = self.get('explorer')
    this.set('fileValidated', false)
    let filename = this.get('filename')
    console.log('Reading file: ' + filename)
    if (!filename)
      return;
    let file = document.getElementById('fileinput').files[0]
    // console.log('file content: ', file)
    // let textType = /text.*/
    // application/json
    // if (file.type.match(textType)) {
    this.set('fileError', null)
    let reader = new FileReader()
    let input = ""
    reader.onload = (e) => {
      //console.log('loaded: ', e)
      //console.log('testo: ', e.target.result)
      input += e.target.result
    }

    reader.onloadend = () => {
      //console.log('loaded:', input)
      try {
        const recoveryInfo = JSON.parse(input)
        console.log("Loaded JSON: ", recoveryInfo)
        if (!recoveryInfo.accountInfo || !recoveryInfo.accountInfo.coin || !recoveryInfo.recoveryData)
          throw new Error("Input json seems not a Melis recovery file")
        const accountInfo = recoveryInfo.accountInfo
        const coin = accountInfo.coin
        const isTestnet = coin.startsWith('T') && accountInfo.coin.length === 4
        recoveryInfo.cm = new CM({ useTestPaths: isTestnet })
        this.set('recoveryInfo', recoveryInfo)
        if (!explorer.isCoinSupported(coin))
          throw new Error("Recovery file is for coin " + coin + " which is unsupported")
        this.set('fileValidated', true)
        console.log(recoveryInfo)
      } catch (e) {
        console.log("Exception reading input: ", e)
        this.set('fileError', e.message)
      }
    }

    reader.readAsText(file)
  }).observes('filename'),

  step1Disabled: computed('fileValidated', function () {
    return !this.get('fileValidated')
  }),

  step2Disabled: computed('txData', function () {
    return !this.get('txData')
  }),

  totalBalance: computed('recoveryInfo.balance.{amUnmature,amUnconfirmed,amAvailable}', function () {
    const recoveryInfo = self.get('recoveryInfo')
    const balance = recoveryInfo.balance
    return balance.amAvailable + balance.amUnconfirmed + balance.amUnmature
  }),

  actions: {
    goStep0: () => goStep(self, 0),
    goStep1: () => goStep(self, 1),
    goTxBuilderForm: function (oneBig) {
      //this.set('oneBig', oneBig)
      const recoveryInfo = self.get('recoveryInfo')
      const unspentsSelector = self.get('unspentsSelector')
      const selectionResult = {
        oneBig: oneBig,
        allSelected: unspentsSelector.allSelected
      }
      set(recoveryInfo, 'selectionResult', selectionResult)
      console.log('selection result:', selectionResult)
      goStep(self, 2)
    },
    goStep3: () => goStep(self, 3),
    goStep4: () => goStep(self, 4),

    pushTx: function (obj, provider) {
      console.log('TEST provider: ' + provider, obj)
      set(obj, provider, { res: 'todo' })
    }
  }
})
