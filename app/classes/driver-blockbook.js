import DriverUtils from 'melis-recovery/classes/utils'

const OUR_COINS = [{
    coin: 'BTC',
    code: 'BTC'
  },
  {
    coin: 'TBTC',
    code: 'TEST'
  },
  {
    coin: 'BCH',
    code: 'BCH'
  },
  {
    coin: 'TBCH',
    code: 'TBCH'
  },
  {
    coin: 'LTC',
    code: 'LTC'
  },
  {
    coin: 'TLTC',
    code: 'tLTC'
  },
  {
    coin: 'BSV',
    code: 'BSV'
  },
  {
    coin: 'TBSV',
    code: 'TBSV'
  },
  {
    coin: 'GRS',
    code: 'GRS'
  },
  {
    coin: 'GRS',
    code: 'tGRS'
  },
  {
    coin: 'DOGE',
    code: 'tDOGE'
  },
]

const supportedCoins = {}

async function checkAndLoadAvailCoins() {
  if (Object.entries(supportedCoins).length === 0) {
    const res = await DriverUtils.loadJsonUrl("https://raw.githubusercontent.com/trezor/trezor-firmware/master/python/trezorlib/coins.json")
    res.forEach(o => {
      //console.log("coin_shortcut: " + o.coin_shortcut + " shortcut: " + o.shortcut + " " + o.name + " #blockbook: " + o.blockbook.length)
      const def = OUR_COINS.find(coindef => coindef.code === o.shortcut)
      if (def) {
        // console.log("FOUND! " + def.coin + " " + o.name)
        supportedCoins[def.coin] = {
          apis: o.blockbook
        }
      }
    })
  }
  return supportedCoins
}

// (async () => {
//   await checkAndLoadAvailCoins()
// })()

class DriverBlockbook {

  constructor(coin) {
    const res = supportedCoins[coin]
    if (!res)
      throw ("Unsupported coin: " + coin)
    this.apiPrefixes = res.apis
  }

  getName() {
    return "Blockbook(" + this.apiPrefixes + ")"
  }

  static async getSupportedCoins() {
    await checkAndLoadAvailCoins()
    console.log("DRIVERS FOR: " + Object.keys(supportedCoins))
    return Object.keys(supportedCoins)
  }

  static async supportsCoin(coin) {
    await checkAndLoadAvailCoins()
    return !!supportedCoins[coin]
  }

  async getApiPrefix() {
    await checkAndLoadAvailCoins()
    return this.apiPrefixes[0]
  }

  async getNumBlocks() {
    const prefix = await this.getApiPrefix()
    const url = prefix + "/api"
    const res = await DriverUtils.loadJsonUrl(url)
    console.log("API STATUS HEIGHT", res)
    if (res && res.blockbook)
      return res.blockbook.bestHeight
  }

  async findUnspents(addrs) {
    const prefix = await this.getApiPrefix()
    const currHeight = await this.getNumBlocks()
    let unspents = []
    for (let i = 0; i < addrs.length; i++) {
      const address = addrs[i]
      const url = prefix + "/api/v2/utxo/" + address
      const res = await DriverUtils.loadJsonUrl(url)
      //console.log("REMOVEME res: ", res)
      if (res)
        res.forEach(o => {
          const unspent = {
            address,
            txid: o.txid,
            vout: o.vout,
            amount: o.value,
            height: currHeight - o.confirmations
          }
          unspents.push(unspent)
        })
    }
    return unspents
  }

  async pushTx(rawtx) {
    const prefix = await this.getApiPrefix()
    const url = prefix + "/api/v2/sendtx/"
    const params = {
      method: 'POST',
      // headers: {
      //   'Content-Type': 'application/x-www-form-urlencoded'
      // },
      body: rawtx
    }
    const res = await DriverUtils.loadJsonUrl(url, params, {
      doDebug: true
    })
    console.log("TX PUSH RES: " + JSON.stringify(res))
    if (res)
      return res.result
  }

}

export default DriverBlockbook
