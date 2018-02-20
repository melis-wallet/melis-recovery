import { helper } from '@ember/component/helper'

export function outBtc(params/*, hash*/) {
  var coin
  if (params.length < 2 || !params[1])
    coin = 'BXX'
  else
    coin = params[1]
  let amount = params[0]
  let sign = ""
  if (amount < 0) {
    sign = "-"
    amount = amount * -1
  }
  let unit, size
  if (amount === 0)
    return "0"
  else if (amount < 100000) {
    unit = "sat" + coin
    size = amount
  } else if (amount < 100000000) {
    unit = "m" + coin
    size = amount / 100000
  } else {
    unit = coin
    size = amount / 100000000
  }
  return sign + size + " " + unit;
}

export default helper(outBtc)