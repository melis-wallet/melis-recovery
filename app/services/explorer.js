import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';

let self

//const CHAINZ_KEY = '29fdcec1c375'
//const CHAINZ_TESTNET_UNSPENT_QUERY = "https://chainz.cryptoid.info/tgrs/api.dws?q=unspent&key=29fdcec1c375&active="
// https://chainz.cryptoid.info/grs/api.dws?q=unspent&active=Fhp3sxymf2innucCmMphjprQauTByQevQ2&key=29fdcec1c375
// https://groestlsight.groestlcoin.org/api/addr/[:addr]/utxo[?noCache=1]

// BTC:  https://btc.blockdozer.com/insight-api/sync
// TBTC: https://tbtc.blockdozer.com/insight-api/sync
// BCH:  https://blockdozer.com/insight-api/sync
// TBCH: https://tbch.blockdozer.com/insight-api/sync

const coinInsightPrefixMap = {
  BTC: "https://insight.bitpay.com/api/",
  TBTC: "https://test-insight.bitpay.com/api/",
  BCH: "https://bch-insight.bitpay.com/api/",
  TBCH: "https://test-bch-insight.bitpay.com/api/",
  LTC: "https://insight.litecore.io/api/",
  GRS: "https://groestlsight.groestlcoin.org/api/"
}

// const coinInsightPrefixMap = {
//   BTC: "https://btc.blockdozer.com/insight-api/",
//   TBTC: "https://tbtc.blockdozer.com/insight-api/",
//   BCH: "https://blockdozer.com/insight-api/",
//   TBCH: "https://tbch.blockdozer.com/insight-api/",
//   LTC: "https://insight.litecore.io/api/",
//   GRS: "https://groestlsight.groestlcoin.org/api/"
// }

// const testnetProviders = [
//   { name: 'BlockCypher.com', code: 'blockcyphercom' }
// ]

// const prodnetProviders = [
//   { name: 'BlockCypher.com', code: 'blockcyphercom' },
//   { name: 'Chain.so', code: 'chainso' }
// ]

function emptyPromise() {
  return new Promise((resolve, reject) => resolve())
}

function getInsightPrefixForCoin(coin) {
  if (coinInsightPrefixMap[coin])
    return coinInsightPrefixMap[coin]
  throw "Unable to find an Insight service for coin: " + coin
}

function loadJsonUrl(url, params) {
  console.log("Loading JSON from url: " + url)
  if (!params)
    params = {}
  return self.get('ajax').request(url, params).then(res => {
    console.log("api result: ", res)
    //return JSON.parse(res)
    return res
  })
}

function insightQueryTxo(coin, addrs) {
  const url = getInsightPrefixForCoin(coin) + "addrs/" + addrs.join(',') + "/utxo"
  return loadJsonUrl(url)
}

export default Service.extend({
  ajax: service(),

  getBaseApi: function (coin) {
    return getInsightPrefixForCoin(coin)
  },

  isCoinSupported: function (coin) {
    return !!coinInsightPrefixMap[coin]
  },

  pushTx: function (coin, rawtx) {
    const params = {
      method: 'POST', data: { rawtx }
    }
    const url = getInsightPrefixForCoin(coin) + "tx/send"
    return loadJsonUrl(url, params)
      .then(res => res.txid)
      .catch(err => {
        console.log("Error pushing tx", err)
        return err.message
      })
  },

  getBlockchainHeight: function (coin) {
    const url = getInsightPrefixForCoin(coin) + "sync"
    return loadJsonUrl(url).then(res => res.blockChainHeight)
  },

  loadUnspentsStatus: function (coin, allUnspents, height, allSelected) {
    console.log("[loadUnspentsStatus] coin: " + coin + " height: " + height + " allSelected: " + allSelected + " allUnspents: ", allUnspents)
    const selectedUnspents = allUnspents.filter(u => allSelected || u.selected)
    console.log("coin: " + coin + " # allUspents: " + allUnspents.length + " selected: " + selectedUnspents.length)
    const addrs = []
    selectedUnspents.forEach(u => {
      const address = u.aa.address
      //if (!addrs.find(o => o == address))
      if (!addrs.includes(address))
        addrs.push(address)
    });
    console.log("# of different selected addrs: " + addrs.length)
    if (addrs.length === 0)
      return emptyPromise()
    return insightQueryTxo(coin, addrs).then(res => {
      selectedUnspents.forEach(u => {
        const found = res.some(o => o.txid.toLowerCase() === u.tx.toLowerCase() && o.vout === u.n)
        if (found)
          if (u.blockExpire >= height)
            set(u, 'redeemStatus', "timelocked")
          else
            set(u, 'redeemStatus', "redeemable")
        else
          set(u, 'redeemStatus', "spent")
        console.log("unspent found: " + found + " for ", u)
      })
      return allUnspents
    })
  },

  init() {
    this._super(...arguments)
    self = this
  }
});
