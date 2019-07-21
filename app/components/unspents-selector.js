import Component from '@ember/component';
import { Promise } from 'rsvp';
import { later } from '@ember/runloop';
import { next } from '@ember/runloop';
import { set } from '@ember/object';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

import CM from 'npm:melis-api-js';
const C = CM.C
let self

// const testnetProviders = [
//   { name: 'BlockCypher.com', code: 'blockcyphercom' },
//   { name: 'Chain.so', code: 'chainso' }
// ]

// const prodnetProviders = [
//   { name: 'BlockCypher.com', code: 'blockcyphercom' },
//   { name: 'Chain.so', code: 'chainso' }
// ]

function emptyPromise() {
  return new Promise((resolve, reject) => resolve())
}

function delay(ms) {
  return new Promise((resolve, reject) => {
    later(this, resolve, ms)
  })
}

//let lastFeeProvider = 0

// Non possiamo usare melis per ipotesi, perché potrebbe essere non disponibile
async function updateNetworkFees() {
  const recoveryInfo = self.get('recoveryInfo')
  const coin = recoveryInfo.accountInfo.coin
  console.log("Updating network fees for coin: " + coin)
  const cm = recoveryInfo.cm
  const names = cm.feeApi.getProviderNames(coin)
  // console.log("lastFeeProvider: "+lastFeeProvider+" provider names: ", JSON.stringify(names))
  // console.log("apiUrls: "+cm.apiUrls+" connected: "+cm.connected)
  // const providerName =names[lastFeeProvider++]
  // lastFeeProvider = lastFeeProvider % names.length
  const providerName = 'hardcoded'
  const res = await cm.feeApi.getFeesByProvider(coin, providerName)()
  console.log(providerName+" feeInfo: "+JSON.stringify(res))
  set(recoveryInfo, 'satoshisPerByte', res.mediumFee)
  set(recoveryInfo, 'feeInfo', res)
  //set(recoveryInfo, 'feeInfo', JSON.stringify(res))

  // if (coin !== 'BTC') {
  //   set(recoveryInfo, 'satoshisPerByte', 2)
  //   set(recoveryInfo, 'feeInfo', { detail: { provider: "hardcoded value" } })
  //   return
  // }
  // return cm.updateNetworkFeesFromExternalProviders().then(res => {
  //   console.log("Network fees: ", res)
  //   let fees = res.detail.mediumFee
  //   set(recoveryInfo, 'satoshisPerByte', fees)
  //   set(recoveryInfo, 'feeInfo', res)
  //   return fees
  // }).catch(err => {
  //   console.log("Error retrieving fees: ", err)
  //   set(recoveryInfo, 'satoshisPerByte', 100)
  //   set(recoveryInfo, 'feeInfo', { detail: { provider: "API ERROR -- proposed hardcoded value" } })
  // })
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

// function loadUnspentsStatus_OLD(unspents, height, bcApi, allSelected) {
//   let loadUnspent = (unspents, index) => {
//     let u = unspents[index]
//     let promise

//     if (!allSelected && !u.selected) {
//       //console.log("Skipping unspent #" + index, u)
//       //Ember.set(u, 'redeemStatus', "unknown")
//       promise = emptyPromise()
//     } else {
//       console.log("Loading unspent #" + index, u)
//       set(u, 'redeemStatus', 'loading')
//       let apiCall = bcApi.getTxOutputs([{ tx: u.tx, n: u.n }]).then(res => {
//         let out = res[0]
//         if (!out) {
//           console.log("Empty result for " + u.tx + "/" + u.n)
//           set(u, 'redeemStatus', "error")
//           return;
//         }
//         console.log("Unspent for " + u.tx + "/" + u.n, out)
//         if (out.spent)
//           set(u, 'redeemStatus', "spent")
//         else if (u.blockExpire >= height)
//           set(u, 'redeemStatus', "timelocked")
//         else
//           set(u, 'redeemStatus', "redeemable")
//       }).catch(err => {
//         console.log("API ERR: ", err)
//         set(u, 'redeemStatus', "error")
//       })
//       promise = delay(800).then(apiCall)
//     }

//     return promise.then(() => {
//       if (index >= unspents.length - 1)
//         return emptyPromise()
//       else {
//         return loadUnspent(unspents, index + 1)
//       }
//     })
//   }

//   if (unspents && unspents.length)
//     return loadUnspent(unspents, 0)
//   else
//     return emptyPromise()
// }

// function setUnspentStatus_OLD(provider) {
//   let recoveryInfo = this.get('recoveryInfo')
//   let allSelected = this.get('allSelected')
//   let unspents = this.get('unspents')
//   let extApis = new CM.BC_APIS().getProvider(provider, recoveryInfo.isTestnet).api
//   return extApis.getBlockChainStatus().then(res => {
//     console.log('blockchain height: ', res)
//     let height = res.height
//     self.set('blockChainHeight', height)
//     return loadUnspentsStatus_OLD(unspents, height, extApis, allSelected)
//   }).then(() => {
//     this.set('loading', false)
//   })
// }

// function updateBlockchainHeight_OLD1(apiName) {
//   let recoveryInfo = self.get('recoveryInfo')
//   let extApis = new CM.BC_APIS().getProvider(apiName, recoveryInfo.isTestnet).api
//   return extApis.getBlockChainStatus().then(res => {
//     console.log('blockchain height: ', res)
//     self.set('blockChainHeight', res.height)
//     return res.height
//   })
// }

// function updateBlockchainHeight_OLD2(apiName) {
//   let recoveryInfo = self.get('recoveryInfo')
//   const explorer = self.get('explorer')
//   return explorer.getBlockchainHeight(recoveryInfo.coin).then(height => {
//     console.log('blockchain height: ', height)
//     self.set('blockChainHeight', height)
//     return height
//   })
// }

function updateBlockchainHeight() {
  const recoveryInfo = self.get('recoveryInfo')
  const coin = recoveryInfo.accountInfo.coin
  const explorer = self.get('explorer')
  console.log("Checking blockchain height for coin: " + coin)
  return explorer.getBlockchainHeight(coin).then(height => {
    console.log('blockchain height: ', height)
    self.set('blockChainHeight', height)
    return height
  })
}

function setUnspentStatus() {
  const recoveryInfo = this.get('recoveryInfo')
  const allSelected = this.get('allSelected')
  const unspents = this.get('unspents')
  const explorer = self.get('explorer')
  const coin = recoveryInfo.accountInfo.coin
  return explorer.getBlockchainHeight(coin).then(height => {
    console.log('[setUnspentStatus] height: ', height)
    self.set('blockChainHeight', height)
    return explorer.loadUnspentsStatus(coin, unspents, height, allSelected)
  }).then(() => {
    this.set('loading', false)
  })
}

export default Component.extend({
  blockChainHeight: 'Unknown',
  recoveryInfo: null,
  unspents: null,
  allSelected: null,
  //apiProviders: testnetProviders,
  apiProviderName: 'none',
  explorer: service(),

  init() {
    this._super(...arguments)
    self = this
    let parent = this.get('parent')
    if (parent) {
      console.log("setting parent to unspentsSelector")
      parent.set('unspentsSelector', this)
    }
    console.log('initing unspents-selector')
    const recoveryInfo = this.get('recoveryInfo')
    const coin = recoveryInfo.accountInfo.coin
    this.set('unspents', recoveryInfo.recoveryData.unspents)
    this.set('allSelected', false)
    set(recoveryInfo, 'selectionResult', {
      oneBigDisabled: true,
      singleDisabled: true,
      allSelected: false
    })
    const explorer = self.get('explorer')
    //this.set('apiProviderName', explorer.getBaseApi(coin))
    this.set('apiProviderName', 'blockchair')
    console.log('coin: ' + coin)
    updateBlockchainHeight()
    updateNetworkFees()
  },

  numSelected: computed('allSelected', 'unspents.@each.selected', function () {
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

  inputSatoshis: computed('allSelected', 'unspents.@each.selected', function () {
    let arr = this.get('unspents')
    if (!arr)
      return -1
    let allSelected = this.get('allSelected')
    let sum = arr.reduce(function (acc, val) {
      return allSelected || val.selected ? acc + val.amount : acc
    }, 0)
    return sum
  }),

  analyzeDisabled: computed('allSelected', 'unspents.@each.selected', function () {
    let allSelected = this.get('allSelected')
    let unspents = this.get('unspents')
    let atLeastOneSelected = unspents.find(u => {
      return u.selected
    })
    let res = !(allSelected || atLeastOneSelected)
    return res
  }),

  oneBigDisabled: computed('allSelected', 'unspents.@each.{selected,redeemStatus}', function () {
    return oneBigDisabled(this.get('allSelected'), this.get('unspents'))
  }),

  singleDisabled: computed('allSelected', 'unspents.@each.{selected,redeemStatus}', function () {
    return singleDisabled(this.get('allSelected'), this.get('unspents'))
  }),

  actions: {
    analyze: function () {
      this.set('loading', true)
      //const apiName = this.get('apiProviderName')
      next(this, setUnspentStatus) //, apiName)
    },

    explorerClicked: () => {
      console.log("TODO: goto explorer")
    }, 
    updateNetworkFees: () => updateNetworkFees(),

    //updateBlockchainHeight: () => updateBlockchainHeight(self.get('apiProviderName'))
    updateBlockchainHeight: () => updateBlockchainHeight()

  }
})
