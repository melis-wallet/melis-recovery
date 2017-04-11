import Ember from 'ember';
import CM from 'npm:melis-api-js';
const C = CM.C
let self

const testnetProviders = [
  {name: 'BlockCypher.com', code: 'blockcyphercom'},
  {name: 'Chain.so', code: 'chainso'}
]

const prodnetProviders = [
  {name: 'BlockCypher.com', code: 'blockcyphercom'},
  {name: 'Chain.so', code: 'chainso'}
]

function emptyPromise() {
  return new Ember.RSVP.Promise((resolve, reject) => resolve())
}

function delay(ms) {
  return new Ember.RSVP.Promise((resolve, reject) => {
    Ember.run.later(this, resolve, ms)
  })
}

function updateNetworkFees() {
  let recoveryInfo = self.get('recoveryInfo')
  return recoveryInfo.cm.updateNetworkFeesFromExternalProviders().then(res => {
    console.log("Network fees: ", res)
    let fees = res.detail.mediumFee
    Ember.set(recoveryInfo, 'satoshisPerByte', fees)
    Ember.set(recoveryInfo, 'feeInfo', res)
    return fees
  })
}

function updateBlockchainHeight(apiName) {
  let recoveryInfo = self.get('recoveryInfo')
  let extApis = new CM.BC_APIS().getProvider(apiName, recoveryInfo.isTestnet).api
  return extApis.getBlockChainStatus().then(res => {
    console.log('blockchain height: ', res)
    self.set('blockChainHeight', res.height)
    return res.height
  })
}

function loadUnspentsStatus(unspents, height, bcApi, allSelected) {
  let loadUnspent = (unspents, index) => {
    let u = unspents[index]
    let promise

    if (!allSelected && !u.selected) {
      //console.log("Skipping unspent #" + index, u)
      //Ember.set(u, 'redeemStatus', "unknown")
      promise = emptyPromise()
    } else {
      console.log("Loading unspent #" + index, u)
      Ember.set(u, 'redeemStatus', 'loading')
      let apiCall = bcApi.getTxOutputs([{tx: u.tx, n: u.n}]).then(res => {
        let out = res[0]
        if (!out) {
          console.log("Empty result for " + u.tx + "/" + u.n)
          Ember.set(u, 'redeemStatus', "error")
          return;
        }
        console.log("Unspent for " + u.tx + "/" + u.n, out)
        if (out.spent)
          Ember.set(u, 'redeemStatus', "spent")
        else if (u.blockExpire >= height)
          Ember.set(u, 'redeemStatus', "timelocked")
        else
          Ember.set(u, 'redeemStatus', "redeemable")
      }).catch(err => {
        console.log("API ERR: ", err)
        Ember.set(u, 'redeemStatus', "error")
      })
      promise = delay(800).then(apiCall)
    }

    return promise.then(() => {
      if (index >= unspents.length - 1)
        return emptyPromise()
      else {
        return loadUnspent(unspents, index + 1)
      }
    })
  }

  if (unspents && unspents.length)
    return loadUnspent(unspents, 0)
  else
    return emptyPromise()
}

function oneBigDisabled(allSelected, unspents) {
  if (!allSelected)
    return true
  return !unspents.every(item => item.redeemStatus === 'redeemable')
}

function singleEnabled(allSelected, unspents) {
  if (!allSelected && !unspents.find(item => item.selected))
    return false
  return unspents.every(item => (!allSelected && !item.selected) || item.redeemStatus === 'redeemable')
}

function singleDisabled(allSelected, unspents) {
  //return !unspents.find(item => item.redeemStatus === 'redeemable' && (allSelected || item.selected))
  return !singleEnabled(allSelected, unspents)
}

function setUnspentStatus(provider) {
  let recoveryInfo = this.get('recoveryInfo')
  let allSelected = this.get('allSelected')
  let unspents = this.get('unspents')
  let extApis = new CM.BC_APIS().getProvider(provider, recoveryInfo.isTestnet).api
  return extApis.getBlockChainStatus().then(res => {
    console.log('blockchain height: ', res)
    let height = res.height
    self.set('blockChainHeight', height)
    return loadUnspentsStatus(unspents, height, extApis, allSelected)
  }).then(() => {
    this.set('loading', false)
  })
}

export default Ember.Component.extend({
  blockChainHeight: 'Unknown',
  recoveryInfo: null,
  unspents: null,
  allSelected: null,
  apiProviders: testnetProviders,
  apiProviderName: 'blockcyphercom',

  init() {
    this._super(...arguments)
    self = this
    let parent = this.get('parent')
    if (parent) {
      console.log("setting parent to unspentsSelector")
      parent.set('unspentsSelector', this)
    }
    console.log('initing unspents-selector')
    let recoveryInfo = this.get('recoveryInfo')
    this.set('unspents', recoveryInfo.recoveryData.unspents)
    this.set('allSelected', false)
    Ember.set(recoveryInfo, 'selectionResult', {
      oneBigDisabled: true,
      singleDisabled: true,
      allSelected: false
    })
    updateBlockchainHeight(this.get('apiProviderName'))
    updateNetworkFees()
  },

  numSelected: Ember.computed('allSelected', 'unspents.@each.selected', function () {
    let arr = this.get('unspents')
    if (!arr)
      return -1
    if (this.get('allSelected'))
      return "All"
    else {
      return arr.reduce(function (acc, val) {
        return val.selected ? acc + 1 : acc
      }, 0)
    }
  }),

  inputSatoshis: Ember.computed('allSelected', 'unspents.@each.selected', function () {
    let arr = this.get('unspents')
    if (!arr)
      return -1
    let allSelected = this.get('allSelected')
    let sum = arr.reduce(function (acc, val) {
      return allSelected || val.selected ? acc + val.amount : acc
    }, 0)
    return sum
  }),

  analyzeDisabled: Ember.computed('allSelected', 'unspents.@each.selected', function () {
    let allSelected = this.get('allSelected')
    let unspents = this.get('unspents')
    let atLeastOneSelected = unspents.find(u => {
      return u.selected
    })
    let res = !(allSelected || atLeastOneSelected)
    return res
  }),

  oneBigDisabled: Ember.computed('allSelected', 'unspents.@each.{selected,redeemStatus}', function () {
    return oneBigDisabled(this.get('allSelected'), this.get('unspents'))
  }),

  singleDisabled: Ember.computed('allSelected', 'unspents.@each.{selected,redeemStatus}', function () {
    return singleDisabled(this.get('allSelected'), this.get('unspents'))
  }),

  actions: {
    analyze: function () {
      this.set('loading', true)
      const apiName = this.get('apiProviderName')
      Ember.run.next(this, setUnspentStatus, apiName)
    },

    updateNetworkFees: () => updateNetworkFees(),

    updateBlockchainHeight: () => updateBlockchainHeight(self.get('apiProviderName'))

  }
})
