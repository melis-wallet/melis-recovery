import Component from '@ember/component';
import { computed } from '@ember/object';

let self
let cm

function buildTxList(recoveryInfo, oneBig, allSelected) {
  const recoveryData = recoveryInfo.recoveryData
  const accountInfo = recoveryInfo.accountInfo
  const unspents = recoveryData.unspents
  const feesPerByte = recoveryInfo.satoshisPerByte
  if (oneBig) {
    const amount = unspents.reduce((accumulator, item) => {
      return accumulator + item.amount
    }, 0)
    console.log("[buildTxList] big tx with amount:", amount)
    const txSize = cm.estimateTxSize(unspents.length, 1, cm.estimateInputSigSizeFromAccount(accountInfo))
    const fees = Math.ceil(feesPerByte * txSize)
    return [{
        unspents: unspents,
        address: '',
        fees: fees,
        amount: amount,
        txData: {
          rawTx: recoveryData.bigTx,
          sigs: recoveryData.bigTxSignatures
        }
      }]
  }

  const res = []
  for (let i = 0; i < unspents.length; i++) {
    const unspent = unspents[i]
    if (!allSelected && !unspent.selected)
      continue
    console.log("[buildTxList] tx with single input:", unspent)
    const txSize = cm.estimateTxSize(1, 1, cm.estimateInputSigSizeFromAccount(accountInfo))
    const fees = Math.ceil(feesPerByte * txSize)
    const txData = recoveryData.singleTxs ? recoveryData.singleTxs[i] : null
    res.push({
      unspents: [unspent],
      address: '',
      amount: unspent.amount,
      fees, txData
    })
  }
  return res
}

function targetAddressesValid(txBuilder) {
  const recoveryInfo = self.get('recoveryInfo')
  const coin = recoveryInfo.accountInfo.coin
  return txBuilder.every(o => cm.isValidAddress(coin, o.address))
}

export default Component.extend({

  parent: null,
  txBuilder: null,

  init() {
    this._super(...arguments)
    self = this
    let parent = this.get('parent')
    if (parent) {
      parent.set('txBuilderForm', this)
    }
    let recoveryInfo = this.get('recoveryInfo')
    cm = recoveryInfo.cm
    let selectionResult = recoveryInfo.selectionResult
    console.log('recoveryInfo.selectionResult:', selectionResult)
    let txBuilder = buildTxList(recoveryInfo, selectionResult.oneBig, selectionResult.allSelected)
    recoveryInfo.txBuilder = txBuilder
    this.set('txBuilder', txBuilder)
  },

  formInvalid: computed('txBuilder.@each.address', function () {
    let txBuilder = this.get('txBuilder')
    return !targetAddressesValid(txBuilder)
  }),

  actions: {
  }
})
