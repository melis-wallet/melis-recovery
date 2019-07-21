import Component from '@ember/component';
import Object from '@ember/object';
import { computed } from '@ember/object';
import { set } from '@ember/object';

import CM from 'npm:melis-api-js';
//const Bitcoin = CM.Bitcoin
const C = CM.C

import MelisCredentials from 'npm:melis-credentials-seed';
const bip39 = new MelisCredentials.credentials()

function normalizeWords(sourceWords) {
  const words = sourceWords.trim().replace(/\s\s+/g, ' ')
  const arr = words.split(' ')
  return [words, arr]
}

const UserInput = Object.extend({
  msg: computed('words', 'password', function () {
    const sourceWords = this.get('words')
    // const password = this.get('password')
    if (!sourceWords)
      return 'mnemonics not entered'
    const [words, arr] = normalizeWords(sourceWords)
    if (arr.length !== 24 && arr.length !== 30)
      return 'wrong number of words'
    else if (!bip39.isMnemonicValid(words))
      return 'invalid set of mnemonics'
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

  passMsg: computed('words', 'password', function () {
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
  //  pwDisabled: computed('words', function () {
  //    const sourceWords = this.get('words')
  //    if (!sourceWords)
  //      return true
  //    const [words, arr] = normalizeWords(sourceWords)
  //    return arr.length !== 30
  //  })
})

function calcXpubForSeed(cm, coin, seed, accountNum) {
  const walletHd = cm.hdNodeFromHexSeed(seed)
  const accountHd = cm.deriveAccountHdKey(walletHd, accountNum, coin)
  const xpub = cm.hdNodeToBase58Xpub(accountHd, coin)
  return xpub
}

export default Component.extend({
  mnemonics: null,
  numNeeded: null,

  init() {
    this._super(...arguments)
    const parent = this.get('parent')
    if (parent) {
      parent.set('mnemonicsForm', this)
    }
    const recoveryInfo = this.get('recoveryInfo')
    const numNeeded = recoveryInfo.accountInfo.minSignatures
    this.set('numNeeded', numNeeded)
    console.log("Initing mnemonics form component with num: " + numNeeded)
    const arr = []
    for (let i = 0; i < numNeeded; i++)
      arr.push(UserInput.create())
    this.set('mnemonics', arr)
    recoveryInfo.mnemonics = arr
    this.set('validSeeds', false)
  },

  validMnemonics: computed('mnemonics.@each.{msg,passMsg}', function () {
    //return !this.get('mnemonics').filterBy('msg').length
    const res = this.get('mnemonics').filter(o =>
      o.get('msg') || o.get('passMsg')).length
    return !res
  }),

  validSeeds: null,
  invalidForm: computed('validMnemonics', 'validSeeds', function () {
    return !this.get('validMnemonics') || !this.get('validSeeds')
  }),
  //  seeds: computed('invalidForm', function () {
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
      const allMnemonics = this.get('mnemonics')
      allMnemonics.forEach(o => {
        o.seed = bip39.parseMnemonics(o.words, o.password).seed
        o.found = false
        o.xpub = null
        set(o, 'msg2', null)
      })
      const recoveryInfo = this.get('recoveryInfo')
      const cm = recoveryInfo.cm
      const accountInfo = recoveryInfo.accountInfo
      const coin = recoveryInfo.accountInfo.coin
      let cosigners = accountInfo.cosigners
      if (accountInfo.type === C.TYPE_PLAIN_HD || accountInfo.type === C.TYPE_2OF2_SERVER) {
        cosigners = [{ accountNum: accountInfo.accountNum, xpub: calcXpubForSeed(cm, coin, allMnemonics[0].seed, accountInfo.accountNum) }]
      }
      console.log("Account type: " + accountInfo.type + " cosigners: ", cosigners)
      cosigners.forEach(x => x.found = false)
      cosigners.forEach(cosigner => {
        console.log("Looking for cosigner " + cosigner.xpub + " / " + cosigner.accountNum)
        const cosignerSeed = allMnemonics.filter(o => !o.found).find(o => {
          if (!o.xpub) {
            const xpub = calcXpubForSeed(cm, coin, o.seed, cosigner.accountNum)
            if (xpub === cosigner.xpub) {
              o.xpub = xpub
              o.mandatory = cosigner.mandatory
              o.found = true
            }
            console.log("found: " + o.found + " xpub: " + xpub + " seed: " + o.seed + " mnemonics:" + o.words)
          }
          return o.xpub === cosigner.xpub
        })
        if (cosignerSeed)
          cosigner.found = true
      })

      const numMandatorySigs = accountInfo.cosigners.reduce((v, o) => v + (o.mandatory ? 1 : 0), 0)
      const allMandatorySeedsFound = allMnemonics.reduce((v, o) => o.mandatory ? v && o.found : v, true)
      const numNonMandatorySeedsFound = allMnemonics.reduce((v, o) => v + ((o.found && !o.mandatory) ? 1 : 0), 0)
      const enoughSeedsFound = allMandatorySeedsFound && numNonMandatorySeedsFound >= (accountInfo.minSignatures - numMandatorySigs)
      console.log("numMandatorySigs: " + numMandatorySigs + " allMandatorySeedsFound: " + allMandatorySeedsFound + " numNonMandatorySeedsFound: " + numNonMandatorySeedsFound)
      allMnemonics.forEach(o => {
        console.log(o.seed + " found: " + o.found)
        const [words, arr] = normalizeWords(o.words)
        if (arr.length === 30)
          set(o, 'msg2', o.found ? null : 'Wrong key: maybe bad passphrase?')
        else
          set(o, 'msg2', o.found ? null : 'Key not found in account')
      })
      this.set('validSeeds', enoughSeedsFound)
    }
  }
})
