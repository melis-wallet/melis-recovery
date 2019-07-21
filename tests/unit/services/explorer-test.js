import {
  module,
  test
} from 'qunit';

import {
  setupTest
} from 'ember-qunit';

// Altro driver da scrivere: https://blockexplorer.com/
import DriverBlockchair from 'melis-recovery/classes/driver-blockchair'
import DriverInsight from 'melis-recovery/classes/driver-insight'
import {
  all
} from 'rsvp';

const jsonInput = "{\"accountInfo\":{\"cosigners\":[],\"type\":\"H\",\"coin\":\"BCH\",\"meta\":{\"color\":\"green\",\"name\":\"Cash single sig\",\"icon\":\"star\"},\"cd\":1512651945476,\"pubId\":\"M13nK5X96KRSbJaNTYZdnxCjvYebqR\",\"accountNum\":723289560,\"pubMeta\":{\"name\":\"Cash single sig\"},\"serverSignature\":false,\"minSignatures\":1,\"lockTimeDays\":0,\"serverXpub\":\"xpub6DsXfqJqXejC8xiGXeE1YEz2jHHNQ5Vj5aQ79B2orR8TPU47kuunzuVvk4pTPGbqb1LrsekSUh3PB1Ka6VGswyp17zj8FRT52dQiVA43a4T\",\"serverMandatory\":false},\"recoveryData\":{\"unspents\":[{\"n\":0,\"amount\":45000000,\"blockMature\":528633,\"cd\":1525375826283,\"tx\":\"315acfc0feedb3a6c14ed9668e1e7ec9f53c3cb16c4bc9c5efb907c1dcf66da3\",\"aa\":{\"chain\":0,\"hdindex\":9,\"address\":\"qzcfny9da0tnvkwmdmagw4e8tzdf2hu3kqec0zsmex\",\"numTxs\":1,\"cd\":1525375815946,\"lastRequested\":1525375815946}},{\"n\":0,\"amount\":213547620,\"blockMature\":513750,\"cd\":1516451007716,\"tx\":\"3d8eeee17c73f3a75b0af51d146b128fe93fbc3a405858c76c365f8d5d4e7f1e\",\"aa\":{\"chain\":1,\"hdindex\":2,\"address\":\"qp94xw5x69jg0lwf7428azuy05yepc5svqr0dn9ffv\",\"numTxs\":1,\"cd\":1516450971692,\"lastRequested\":1516450971692}},{\"n\":0,\"amount\":3631300000,\"blockMature\":512428,\"cd\":1515656116952,\"tx\":\"4413412b2a4f0c80de05a2f9520639b207153cc71e592a667f6e66e73acc5741\",\"aa\":{\"chain\":0,\"hdindex\":3,\"address\":\"qpkajf2dg7ffsp88cxzg0ucl6knxh7jrzugsu6zjv9\",\"numTxs\":1,\"cd\":1513583628130,\"lastRequested\":1515655783083}}]},\"balance\":{\"amAvailable\":3889847620,\"amReserved\":213547620,\"amUnconfirmed\":0,\"amUnmature\":0,\"spentInDay\":0,\"spentInWeek\":0,\"spentInMonth\":0},\"ts\":1559134240577}"

function readInput() {
  //assert.step("loading input")
  const input = JSON.parse(jsonInput)
  const accountInfo = input.accountInfo
  const recoveryData = input.recoveryData
  const potentialUnspents = recoveryData.unspents
  console.log("accountInfo: " + JSON.stringify(accountInfo))
  console.log("unspents: " + JSON.stringify(potentialUnspents))
  const addresses = potentialUnspents.map(o => o.aa.address)
  console.log("#addrs: " + addresses.length)
  return {
    coin: accountInfo.coin,
    addresses
  }
}

// TODO
// async function loadUnspentsStatus(coin, allUnspents, height, allSelected) {
//   console.log("[loadUnspentsStatus] coin: " + coin + " height: " + height + " allSelected: " + allSelected + " allUnspents: ", allUnspents)
//   const selectedUnspents = allUnspents.filter(u => allSelected || u.selected)
//   console.log("coin: " + coin + " # allUspents: " + allUnspents.length + " selected: " + selectedUnspents.length)
//   const addrs = []
//   selectedUnspents.forEach(u => {
//     const address = u.aa.address
//     //if (!addrs.find(o => o == address))
//     if (!addrs.includes(address))
//       addrs.push(address)
//   });
//   console.log("# of different selected addrs: " + addrs.length)
//   if (addrs.length === 0)
//     return emptyPromise()
//   return insightQueryTxo(coin, addrs).then(res => {
//     selectedUnspents.forEach(u => {
//       const found = res.some(o => o.txid.toLowerCase() === u.tx.toLowerCase() && o.vout === u.n)
//       if (!u.height && u.confirmations > 0)
//         u.height = height - u.confirmations
//       if (found)
//         if (u.blockExpire >= height)
//           set(u, 'redeemStatus', "timelocked")
//         else
//           set(u, 'redeemStatus', "redeemable")
//       else
//         set(u, 'redeemStatus', "spent")
//       console.log("unspent found: " + found + " for ", u)
//     })
//     return allUnspents
//   })
// }

// TBSV explorer: https://testnet.bitcoincloud.net/ faucet: https://bitcoincloud.net/faucet/

const TESTS = [
  {
    coin: 'BTC',
    address: '1MvLr7wSSVTkvemqaR6JYxB8qA8xRBprUr'
  },
  {
    coin: 'TBTC',
    address: '2NAg12Lw4VGTck2GrM6UwgeQXbuRYx9M578'
  },
  {
    coin: 'BCH',
    address: 'qqj32jfeg6y5z2hq0s4tytq7na6psl3ztcpn7kdhp7'
  },
  {
    coin: 'TBCH',
    address: 'bchtest:qzhrqpc29a8y7pg7eye0v54hwn5dp8hzjc2e4dggsh'
  },
  {
    coin: 'LTC',
    address: 'MUUj7WNdXemGiabkd4B6H9ynHKZ7aHnspg'
  },
  {
    coin: 'TLTC',
    address: '2N5F313e9777Yc32T3hBCpqanmd1t3fc3DU'
  },
  {
    coin: 'BSV',
    address: 'qq5cxhl8z4rztmwptqxnyak0j04n4m7e0y307sxmhl' // 14nW5w9pbzYoy32HbcgB6UHgvoFZCNxhVK
  },
  {
    coin: 'TBSV',
    address: '2N6Sq4pXWkw3DgWxRsiAk8W4oEmaFpJCtUn'
  },
  {
    coin: 'GRS',
    address: '3EvN3axZwzPTfWtFt4YNvaMv6AggQXiLrQ'
    //address: 'Fai7L9MJHa58NBe4RS4s4foXmBeMyN6N7a'
  },
  {
    coin: 'TGRS',
    address: 'tgrs1qw4z3xrtgx4f6w7akwpp2xa0gupmkv4yauemmm9'
  },
  {
    coin: 'DOGE',
    address: 'D9kSNvZH7HSNU6BsE9NYJgG3CebJCkpQGm'
  },
  {
    coin: 'TDOG',
    address: '2MsQug2PDbor2ndqYu9MxMij3MZFZ3EkGk9'
  },
]

async function singleTest(driverClass) {
  let allOk = true
  let result = ""
  for (let i = 0; i < TESTS.length; i++) {
    const logPrefix = "[" + driverClass.name + "] "
    const o = TESTS[i]
    const coin = o.coin
    const address = o.address
    //console.log("Testing " + driverClass.name + " driver for " + o.coin)
    const isSupported = await driverClass.supportsCoin(coin)
    if (!isSupported) {
      result += logPrefix + "skipping test because coin not supported: " + coin
      continue
    }
    const driver = new driverClass(coin)
    const unspents = await driver.findUnspents([address])
    //console.log("#UNSPENTS for " + address + ": " + unspents.length + "\n" + JSON.stringify(unspents))
    if (!unspents) {
      allOk = false
      result += logPrefix + "ERR   : " + coin + " impossibile prelevare gli unspents per: " + address + "\n"
    } else
      result += logPrefix + "OK PER: " + coin + " #unspents su " + address + " " + unspents.length + "\n"
  }
  console.log("Final test result: " + allOk + "\n" + result)
  return allOk
}

module('Service | explorer', function (hooks) {
  setupTest(hooks)

  // Assert functions: https://api.qunitjs.com/

  test('it reads input correctly', async function (assert) {
    const {
      coin,
      addresses
    } = readInput()
    assert.ok(addresses.length > 0)
  })

  test('Blockchair driver works correctly', async function (assert) {
    const res = await singleTest(DriverBlockchair)
    assert.ok(res, "Insight tests failed")
  })

  test('Insight driver works correctly', async function (assert) {
    const res = await singleTest(DriverInsight)
    assert.ok(res, "Insight tests failed")
  })

  // test('Blockchair driver works correctly--OLD', async function (assert) {
  //   const {
  //     coin,
  //     addresses
  //   } = readInput()
  //   const driver = new DriverBlockchair(coin)
  //   const unspents = await driver.findUnspents(addresses)

  //   console.log("#### BLOCKCHAIR UNSPENTS\n" + JSON.stringify(unspents) + "\n####")
  //   console.log("#unspents: " + unspents.length)
  //   assert.ok(unspents.length > 0)
  // })

  // test('Insight driver works correctly', async function (assert) {
  //   const {
  //     coin,
  //     addresses
  //   } = readInput()
  //   const driver = new DriverInsight(coin)
  //   const unspents = await driver.findUnspents(addresses)

  //   console.log("#### INSIGHT UNSPENTS\n" + JSON.stringify(unspents) + "\n####")
  //   console.log("#unspents: " + unspents.length)
  //   assert.ok(unspents.length > 0)
  // })

})
