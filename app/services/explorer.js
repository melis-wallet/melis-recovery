import Service from '@ember/service';
import {
  inject as service
} from '@ember/service';
import {
  set
} from '@ember/object';

import DriverBlockchair from 'melis-recovery/classes/driver-blockchair'
import DriverInsight from 'melis-recovery/classes/driver-insight'
import DriverBlockbook from 'melis-recovery/classes/driver-blockbook'

let self

const DRIVER_LIST = {}

function addDriver(coin, driver) {
  let arr = DRIVER_LIST[coin]
  if (arr === undefined) {
    arr = []
    DRIVER_LIST[coin] = arr
  }
  arr.push(driver)
}

async function addDrivers(className) {
  let coins = await className.getSupportedCoins()
  console.log("COINS for " + className.name + ": ", coins)
  coins.forEach(coin => addDriver(coin, new className(coin)))
}

function printDrivers() {
  Object.keys(DRIVER_LIST).forEach(coin => {
    const arr = DRIVER_LIST[coin]
    let names = ""
    arr.forEach(o => names += o.getName() + " ")
    console.log(coin + " drivers: " + names)
  })
}

(async () => {
  await addDrivers(DriverBlockchair)
  await addDrivers(DriverBlockbook)
  await addDrivers(DriverInsight)
  //DriverBlockchair.getSupportedCoins().forEach(coin => addDriver(coin, new DriverBlockchair(coin)))
  //DriverInsight.getSupportedCoins().forEach(coin => addDriver(coin, new DriverInsight(coin)))
  // let coins = await DriverBlockbook.getSupportedCoins()
  // console.log("COINS: ", coins)
  // coins.forEach(coin => addDriver(coin, new DriverBlockbook(coin)))
  printDrivers()
})()

function getDriver(coin) {
  // const driverName = self.get('driverName')
  const drivers = DRIVER_LIST[coin]
  console.log("[getDriver] coin: " + coin + " drivers: ", drivers)
  if (!drivers)
    throw "Driver for '" + name + "' not found"
  return drivers[0]

  // const Driver = Drivers[driverName]
  // if (!Driver)
  //   throw "Driver for '" + name + "' not found"
  // return new Driver(coin)
}

export default Service.extend({
  driverName: 'blockchair',
  ajax: service(),

  getName: function (coin) {
    console.log("call to getName" + coin)
    return getDriver(coin).getName()
  },

  isCoinSupported: async function (coin) {
    return DRIVER_LIST[coin] != null
  },

  pushTx: function (coin, rawtx) {
    return getDriver(coin).pushTx(rawtx)
  },

  getBlockchainHeight: async function (coin) {
    console.log("call to getBlockChainHeight " + coin)
    return getDriver(coin).getNumBlocks()
  },

  loadUnspentsStatus: async function (coin, allUnspents, height, allSelected) {
    const driverName = this.get('driverName')
    console.log("[loadUnspentsStatus " + driverName + "] coin: " + coin + " height: " + height + " allSelected: " + allSelected + " allUnspents: ", allUnspents)
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
      return // emptyPromise()
    const res = await getDriver(coin).findUnspents(addrs)
    console.log("findUnspents result:", res)
    selectedUnspents.forEach(u => {
      const found = res.some(o => o.txid.toLowerCase() === u.tx.toLowerCase() && o.vout === u.n)
      if (!u.height && u.confirmations > 0)
        u.height = height - u.confirmations
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
  },

  init() {
    this._super(...arguments)
    self = this
  }
})


// Other possible drivers to write:
//const CHAINZ_KEY = '29fdcec1c375'
//const CHAINZ_TESTNET_UNSPENT_QUERY = "https://chainz.cryptoid.info/tgrs/api.dws?q=unspent&key=29fdcec1c375&active="
// https://chainz.cryptoid.info/grs/api.dws?q=unspent&active=Fhp3sxymf2innucCmMphjprQauTByQevQ2&key=29fdcec1c375
// https://groestlsight.groestlcoin.org/api/addr/[:addr]/utxo[?noCache=1]
// https://groestlsight-test.groestlcoin.org/api/addrs/2N5N5x8XNbMLxfdU145bM37SY4aJCfUAaTC/utxo?noCache=1

// TGTS: https://groestlsight-test.groestlcoin.org/
// BTC:  https://btc.blockdozer.com/insight-api/sync
// TBTC: https://tbtc.blockdozer.com/insight-api/sync
// BCH:  https://blockdozer.com/insight-api/sync
// TBCH: https://tbch.blockdozer.com/insight-api/sync

// BTC: "https://btc.blockdozer.com/insight-api/",
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
