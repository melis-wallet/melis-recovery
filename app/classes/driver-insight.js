import DriverUtils from 'melis-recovery/classes/utils'

const supportedCoins = {
  BTC: "https://insight.bitpay.com/api/",
  TBTC: "https://test-insight.bitpay.com/api/",
  BCH: "https://bch-insight.bitpay.com/api/",
  //TBCH: "https://insight.imaginary.cash/api/BCH/testnet/",
  TBCH: "https://test-bch-insight.bitpay.com/api/",
  BSV: "https://bchsvexplorer.com/api/",
  LTC: "https://insight.litecore.io/api/",
  TLTC: "https://testnet.litecore.io/api/",
  GRS: "https://groestlsight.groestlcoin.org/api/",
  TGRS: "https://groestlsight-test.groestlcoin.org/api/"
}

// Bitcore BCH & testnet
// https://insight.imaginary.cash/api/BCH/mainnet/address/qrsrvtc95gg8rrag7dge3jlnfs4j9pe0ugrmeml950/?unspent=true
// TBCH: "https://insight.imaginary.cash/api/BCH/testnet/",

// https://github.com/bitpay/insight-api/tree/v0.3.0
class DriverInsight {

  constructor(coin) {
    const prefix = supportedCoins[coin]
    if (!prefix)
      throw ("Unsupported coin: " + coin)
    this.apiPrefix = prefix
  }

  getName() {
    return "Insight(" + this.apiPrefix + ")"
  }

  static getSupportedCoins() {
    return Object.keys(supportedCoins)
  }

  static async supportsCoin(coin) {
    return !!supportedCoins[coin]
  }

  async pushTx(rawtx) {
    const url = this.apiPrefix + "tx/send"
    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'rawtx:' + rawtx
    }
    const res = await DriverUtils.loadJsonUrl(url, params, {
      doDebug: true
    })
    console.log("TX PUSH RES: " + JSON.stringify(res))
    if (res)
      return res.txid
  }

  async getNumBlocks() {
    const url = this.apiPrefix + "sync"
    return DriverUtils.loadJsonUrl(url).then(res => res.blockChainHeight)
  }

  async findUnspents(addrs) {
    const url = this.apiPrefix + "addrs/" + addrs.join(',') + "/utxo?noCache=1"
    return DriverUtils.loadJsonUrl(url)
    // return insightQueryTxo(this.apiPrefix, addrs)
  }

}

export default DriverInsight
