import DriverUtils from 'melis-recovery/classes/utils'

const apiPrefix = "https://chain.so/api/v2/"

const supportedCoins = {
  BTC: "BTC",
  TBTC: "BTCTEST",
  LTC: "LTC",
  TLTC: "LTCTEST",
  DOGE: "DOGE",
  TDOG: "DOGETEST"
}

class DriverSoChain {

  constructor(coin) {
    const network = supportedCoins[coin]
    if (!network)
      throw ("Unsupported coin: " + coin)
    this.network = network
  }

  getName() {
    return "SoChain(" + this.network + ")"
  }

  static getSupportedCoins() {
    return Object.keys(supportedCoins)
  }

  static async supportsCoin(coin) {
    return !!supportedCoins[coin]
  }

  async pushTx(rawtx) {
    const url = this.apiPrefix + "send_tx"
    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: JSON.stringify({
        tx_hex: rawtx
      })
    }
    const res = await DriverUtils.loadJsonUrl(url, params, {
      doDebug: true
    })
    console.log("TX PUSH RES: " + JSON.stringify(res))
    if (res)
      return res.txid
  }

  async getNumBlocks() {
    const url = apiPrefix + "get_info/" + this.network
    return DriverUtils.loadJsonUrl(url).then(res => res.data.blocks)
  }

  // https://chain.so/api#get-unspent-tx
  async findUnspents(addrs) {
    console.log('TODO')
    return
    
    const url = this.apiPrefix + "get_tx_unspent/"+this.network+"/{ADDRESS}"
    return DriverUtils.loadJsonUrl(url)
  }

}

export default DriverSoChain
