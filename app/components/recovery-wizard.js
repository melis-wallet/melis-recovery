import Ember from 'ember';

import CM from 'npm:melis-api-js';
const C = CM.C

let self

function goStep(self, n) {
  self.set('step', n)
}

export default Ember.Component.extend({
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
        if (!recoveryInfo.accountInfo || !recoveryInfo.recoveryData || !recoveryInfo.network || !recoveryInfo.balance)
          throw new Error("Input json seems not a Melis recovery file")
        const isTestnet = recoveryInfo.network === C.CHAIN_TESTNET
        recoveryInfo.isTestnet = isTestnet
        recoveryInfo.cm = new CM(isTestnet ? {apiDiscoveryUrl: C.MELIS_TEST_DISCOVER} : {})
        this.set('recoveryInfo', recoveryInfo)
        this.set('fileValidated', true)
        console.log(recoveryInfo)
      } catch (e) {
        console.log("Exception reading input: ", e)
        this.set('fileError', e.message)
      }
    }
    reader.readAsText(file)
  }).observes('filename'),

  step1Disabled: Ember.computed('fileValidated', function () {
    return !this.get('fileValidated')
  }),

  step2Disabled: Ember.computed('txData', function () {
    return !this.get('txData')
  }),

  actions: {
    goStep0: () => goStep(self, 0),
    goStep1: () => goStep(self, 1),
    goTxBuilderForm: function (oneBig) {
      //this.set('oneBig', oneBig)
      let recoveryInfo = self.get('recoveryInfo')
      let unspentsSelector = self.get('unspentsSelector')
      let selectionResult = {
        oneBig: oneBig,
        allSelected: unspentsSelector.allSelected
      }
      Ember.set(recoveryInfo, 'selectionResult', selectionResult)
      console.log('selection result:', selectionResult)
      goStep(self, 2)
    },
    goStep3: () => goStep(self, 3),
    goStep4: () => goStep(self, 4),

    pushTx: function (obj, provider) {
      console.log('TEST provider: ' + provider, obj)
      Ember.set(obj, provider, {res: 'todo'})
    }
  }
})