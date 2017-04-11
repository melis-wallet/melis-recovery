import Ember from 'ember';

import CM from 'npm:melis-api-js';
const Bitcoin = CM.Bitcoin

import MelisCredentials from 'npm:melis-credentials-seed';
const bip39 = new MelisCredentials.credentials()

function normalizeWords(sourceWords) {
  let words = sourceWords.trim().replace(/\s\s+/g, ' ')
  let arr = words.split(' ')
  return [words, arr]
}

const UserInput = Ember.Object.extend({
  msg: Ember.computed('words', 'password', function () {
    const sourceWords = this.get('words')
    const password = this.get('password')
    if (!sourceWords)
      return 'mnemonics not entered'
    const [words, arr] = normalizeWords(sourceWords)
    if (arr.length !== 24 && arr.length !== 30)
      return 'wrong number of words'
    else if (!bip39.isMnemonicValid(words))
      return 'invalid mnemonics'
    else if (arr.length === 30 && !bip39.isMnemonicEncrypted(words))
      return 'invalid encrypted mnemonics'
//    else if (arr.length === 30) {
//      if (!password || password.length < 6)
//        return 'passphrase too short'
//      else if (!bip39.isMnemonicEncrypted(words))
//        return 'invalid encrypted mnemonics'
//    } else
    else
      return null
  }),

  passMsg: Ember.computed('words', 'password', function () {
    const sourceWords = this.get('words')
    const password = this.get('password')
    if (!sourceWords)
      return null
    const [words, arr] = normalizeWords(sourceWords)
    //if (arr.length === 30 && bip39.isMnemonicValid(words) && (!password || password.length < 6))
    if (arr.length === 30 && (!password || password.length < 6))
      return 'passphrase too short'
    return null
  }),

  // Non funziona
//  pwDisabled: Ember.computed('words', function () {
//    const sourceWords = this.get('words')
//    if (!sourceWords)
//      return true
//    const [words, arr] = normalizeWords(sourceWords)
//    return arr.length !== 30
//  })
})

export default Ember.Component.extend({
  mnemonics: [],
  numNeeded: 3,

  init() {
    this._super(...arguments)
    let parent = this.get('parent')
    if (parent) {
      parent.set('mnemonicsForm', this)
    }
    let recoveryInfo = this.get('recoveryInfo')
    let numNeeded = recoveryInfo.accountInfo.minSignatures
    console.log("Initing mnemonics form component with num: " + numNeeded)
    let arr = []
    for (let i = 0; i < numNeeded; i++)
      arr.push(UserInput.create())
    this.set('mnemonics', arr)
    recoveryInfo.mnemonics = arr
    this.set('validSeeds', false)
  },

  validMnemonics: Ember.computed('mnemonics.@each.{msg,passMsg}', function () {
    //return !this.get('mnemonics').filterBy('msg').length
    let res = this.get('mnemonics').filter(o =>
      o.get('msg') || o.get('passMsg')).length
    return !res
  }),

  validSeeds: null,
  invalidForm: Ember.computed('validMnemonics', 'validSeeds', function () {
    return !this.get('validMnemonics') || !this.get('validSeeds')
  }),
//  seeds: Ember.computed('invalidForm', function () {
//    let invalidForm = this.get('invalidForm')
//    if (invalidForm)
//      return null
//    let mnemonics = this.get('mnemonics')
//    return mnemonics.map(o => {
//      return bip39.parseMnemonics(o.words, o.password)
//    })
//  }),
//
  actions: {
    validateSeeds: function () {
      let mnemonics = this.get('mnemonics')
      mnemonics.forEach(o => {
        o.seed = bip39.parseMnemonics(o.words, o.password).seed
        o.found = false
        Ember.set(o, 'msg2', null)
      })
      let recoveryInfo = this.get('recoveryInfo')
      let cm = recoveryInfo.cm
      const network = cm.decodeNetworkName(recoveryInfo.network)
      const cosigners = recoveryInfo.accountInfo.cosigners
      cosigners.forEach(x => x.found = false)
      cosigners.forEach(cosigner => {
        console.log("Checking cosigner " + cosigner.xpub + " num: " + cosigner.accountNum)
        let found = mnemonics.find(o => {
          let walletHd = Bitcoin.HDNode.fromSeedHex(o.seed, network)
          let accountHd = cm.deriveHdAccount_explicit(network, walletHd, cosigner.accountNum)
          return accountHd.neutered().toBase58() === cosigner.xpub
        })
        if (found)
          cosigner.found = found.found = true
      })
      let allFound = mnemonics.every(o => o.found)
      console.log("All cosigners found: " + allFound)
      mnemonics.forEach(o => {
        console.log(o.seed + " found: " + o.found)
        const [words, arr] = normalizeWords(o.words)
        if (arr.length === 30)
          Ember.set(o, 'msg2', o.found ? null : 'Wrong key: maybe bad passphrase?')
        else
          Ember.set(o, 'msg2', o.found ? null : 'Key not found in account')
      })
      this.set('validSeeds', allFound)
    }
  }
})