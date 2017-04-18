import Ember from 'ember';

let self
let cm

function buildTxList(recoveryInfo, oneBig, allSelected) {
  let recoveryData = recoveryInfo.recoveryData
  let accountInfo = recoveryInfo.accountInfo
  let unspents = recoveryData.unspents
  let feesPerByte = recoveryInfo.satoshisPerByte
  if (oneBig) {
    let amount = unspents.reduce((accumulator, item) => {
      return accumulator + item.amount
    }, 0)
    console.log("[buildTxList] big tx with amount:", amount)
    let txSize = cm.estimateTxSize(unspents.length, 1, cm.estimateInputSigSizeFromAccount(accountInfo))
    let fees = Math.ceil(feesPerByte * txSize)
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

  let res = []
  for (let i = 0; i < unspents.length; i++) {
    let unspent = unspents[i]
    if (!allSelected && !unspent.selected)
      continue
    console.log("[buildTxList] tx with single input:", unspent)
    let txSize = cm.estimateTxSize(1, 1, cm.estimateInputSigSizeFromAccount(accountInfo))
    let fees = Math.ceil(feesPerByte * txSize)
    res.push({
      unspent: unspent,
      address: '',
      fees: fees,
      amount: unspent.amount,
      txData: recoveryData.singleTxs[i]
    })
  }
  return res
}

function targetAddressesValid(txBuilder) {
  return txBuilder.every(o => cm.validateAddress(o.address))
}

export default Ember.Component.extend({

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

  formInvalid: Ember.computed('txBuilder.@each.address', function () {
    let txBuilder = this.get('txBuilder')
    return !targetAddressesValid(txBuilder)
  }),

  actions: {
  }
})
