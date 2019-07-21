import DriverUtils from 'melis-recovery/classes/utils'

const baseUrl = "https://api.blockchair.com/"

//import fetch from 'fetch'
// // TODO: UTILIZZARE UN METODO COMUNE
// // Gestire eccezioni 
// async function loadJsonUrl(url, params, opts) {
//   console.log("Loading JSON from url: " + url)
//   if (!params)
//     params = {}
//   // params['no-cors'] = true
//   //params['mode'] = 'no-cors'
//   if (opts && opts.doDebug)
//     console.log("Fetching URL: " + url)
//   const res = await fetch(url, params)
//   if (opts && opts.doDebug)
//     console.log("api result: " + JSON.stringify(res))
//   if (res.status === 200)
//     return res.json()
//   console.log("Blockchair returned error: " + JSON.stringify(res))
//   return null
// }

const supportedCoins = {
  'BCH': 'bitcoin-cash',
  'BTC': 'bitcoin',
  'TBTC': 'bitcoin/testnet',
  'BSV': 'bitcoin-sv',
  'GRS': 'groestlcoin',
  'DOGE': 'dogecoin',
  'LTC': 'litecoin'
}

class DriverBlockchair {

  constructor(coin) {
    const chain = supportedCoins[coin]
    if (!chain)
      throw ("Unsupported coin: " + coin)
    this.chain = chain
  }

  static getSupportedCoins() {
    return Object.keys(supportedCoins)
  }

  getName() {
    return "blockchair.com (" + this.chain + ")"
  }

  static async supportsCoin(coin) {
    return !!supportedCoins[coin]
  }

  async getNumBlocks() {
    const url = baseUrl + this.chain + "/stats"
    const res = await DriverUtils.loadJsonUrl(url)
    if (res)
      return res.data.best_block_height
    return null
  }

  // async findUnspents(addrs) {
  //   const url = baseUrl + this.chain + "/dashboards/addresses/" + addrs.join(',')
  //   const res = await DriverUtils.loadJsonUrl(url)
  //   if (!res)
  //     return null
  //   const utxo = res.data.utxo
  //   const unspents = []
  //   utxo.forEach(o => {
  //     const unspent = {
  //       address: o.address,
  //       txid: o.transaction_hash,
  //       vout: o.index,
  //       amount: o.value,
  //       height: o.block_id
  //     }
  //     unspents.push(unspent)
  //   })
  //   return unspents
  // }

  // https://api.blockchair.com/bitcoin/dashboards/addresses/192kkZSRQHrS4dnBoPGgoYB6WeC1HXyYZe,17iyRRXBHJKbv5DKPPkttWewm3CHdNPGQd?limit=1000
  async findUnspents(addrs) {
    const maxQuerySize = 100
    const unspents = []
    let fromIndex = 0
    while (fromIndex < addrs.length) {
      const slice = addrs.slice(fromIndex, fromIndex + maxQuerySize)
      fromIndex += maxQuerySize
      const url = baseUrl + this.chain + "/dashboards/addresses/" + slice.join(',') + "?limit=1000"
      //console.log("Querying " + slice.length + " addrs in batch mode from blockchair.com. URL len: " + url.length)
      const res = await DriverUtils.loadJsonUrl(url, {
        // doDebug
      }, {
        okErrorCodes: [404]
      })
      if (!res)
        return null
      if (!res.data)
        continue
      const utxo = res.data.utxo
      utxo.forEach(o => {
        const unspent = {
          address: o.address,
          txid: o.transaction_hash,
          vout: o.index,
          amount: o.value,
          height: o.block_id
        }
        unspents.push(unspent)
      })
      if (fromIndex < addrs.length)
        await DriverUtils.sleep(2000)
    }
    return unspents
  }

  // https://github.com/Blockchair/Blockchair.Support/blob/master/API_DOCUMENTATION_EN.md#-broadcasting-transactions
  async pushTx(rawtx) {
    const url = baseUrl + this.chain + "/push/transaction"
    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'data=' + rawtx
    }
    const res = await DriverUtils.loadJsonUrl(url, params, {
      doDebug: true
    })
    console.log("TX PUSH RES: " + JSON.stringify(res))
    if (res)
      return res.data.transaction_hash
  }

  // // OLD CODE

  // async getUnspentsForAddress(address) {
  //   const url = baseUrl + this.chain + "/outputs?q=recipient(" + address + "),is_spent(false)"
  //   const res = await loadJsonUrl(url)
  //   if (res)
  //     return res.data
  // }

  // // [{"block_id":512428,"transaction_id":246765624,"index":0,"transaction_hash":"4413412b2a4f0c80de05a2f9520639b207153cc71e592a667f6e66e73acc5741","date":"2018-01-11","time":"2018-01-11 07:50:47","value":3631300000,"value_usd":90955.4,"recipient":"qpkajf2dg7ffsp88cxzg0ucl6knxh7jrzugsu6zjv9","type":"pubkeyhash","script_hex":"76a9146dd9254d47929804e7c18487f31fd5a66bfa431788ac","is_from_coinbase":false,"is_spendable":null,"is_spent":false,"spending_block_id":null,"spending_transaction_id":null,"spending_index":null,"spending_transaction_hash":null,"spending_date":null,"spending_time":null,"spending_value_usd":null,"spending_sequence":null,"spending_signature_hex":null,"lifespan":null,"cdd":null}]
  // async findUnspents_OLD(addrs) {
  //   const unspents = []
  //   for (let i = 0; i < addrs.length; i++) {
  //     const address = addrs[i]
  //     const data = await this.getUnspentsForAddress(address)
  //     data.forEach(out => {
  //       const unspent = {
  //         address,
  //         txid: out.transaction_hash,
  //         vout: out.index,
  //         amount: out.value,
  //         height: out.block_id
  //       }
  //       unspents.push(unspent)
  //     })
  //   }
  //   return unspents
  // }


  // // function findUnspentsOutput(outs, address) {
  // //   console.log("Looking for unspents for " + address + " # outs candidates: " + outs.length)
  // //   const unspents = []
  // //   for (let i = 0; i < outs.length; i++) {
  // //     const out = outs[i]
  // //     if (out.recipient == address) {
  // //       if (!out.is_spent) {
  // //         const unspent = {
  // //           address,
  // //           txid: out.transaction_hash,
  // //           vout: out.index,
  // //           amount: out.value,
  // //           height: out.block_id
  // //         }
  // //         unspents.push(unspent)
  // //         console.log("Found unspent: " + JSON.stringify(unspent))
  // //       } else
  // //         console.log("Skipping spent out " + out.transaction_hash + "/" + out.index)
  // //     } else {
  // //       console.log("Skipping unknown out with address " + out.recipient)
  // //     }
  // //   }
  // //   return unspents
  // // }

  // // // https://github.com/Blockchair/Blockchair.Support/blob/master/API_DOCUMENTATION_EN.md#link_bitcoinaddress
  // // async getAddressInfo(addr) {
  // //   const url = baseUrl + this.chain + "/dashboards/address/" + addr
  // //   const res = await loadJsonUrl(url)
  // //   //console.log("ADDRESS RES: " + JSON.stringify(res))
  // //   return res.data
  // // }

  // // // https://github.com/Blockchair/Blockchair.Support/blob/master/API_DOCUMENTATION_EN.md#link_transaction
  // // async getTransactionsInfo(txhashes) {
  // //   const url = baseUrl + this.chain + "/dashboards/transactions/" + txhashes.join(',')
  // //   const res = await loadJsonUrl(url)
  // //   //console.log("TRANSACTIONS RES: " + JSON.stringify(res))
  // //   return res.data
  // // }

  // // async findUnspents_old(addrs) {
  // //   let unspents = []
  // //   for (let i = 0; i < addrs.length; i++) {
  // //     const address = addrs[i]
  // //     const data = await this.getAddressInfo(address)
  // //     console.log("INFO: " + JSON.stringify(data))
  // //     const info = data[address]
  // //     if (info.address.unspent_output_count > 0) {
  // //       console.log("L'indirizzo " + address + " ha #unspents: " + info.address.unspent_output_count)
  // //       const txhashes = info.transactions
  // //       console.log("#txhashes to look trough: " + txhashes.length + ": " + JSON.stringify(txhashes))
  // //       const txinfos = await this.getTransactionsInfo(txhashes)
  // //       //console.log("txinfos: " + JSON.stringify(txinfos))
  // //       for (let j = 0; j < txhashes.length; j++) {
  // //         const txhash = txhashes[j]
  // //         const txinfo = txinfos[txhash]
  // //         console.log("[j=" + j + "] txinfo per " + txhash + ": " + JSON.stringify(txinfo))
  // //         const res = findUnspentsOutput(txinfo.outputs, address)
  // //         console.log("Unspents per " + address + ":" + JSON.stringify(res))
  // //         unspents = unspents.concat(res)
  // //       }
  // //     } //else console.log("L'indirizzo " + address + " non ha unspents")
  // //   }
  // //   return unspents
  // // }

}

export default DriverBlockchair
