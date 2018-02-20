import { helper } from '@ember/component/helper';

export function coinDecoder(params/*, hash*/) {
  const coin = params[0]
  switch (coin) {
    case 'BTC': return "Bitcoin"
    case 'TBTC': return "Bitcoin testnet"
    case 'RBTC': return "Bitcoin regtest"
    case 'BCH': return "Bitcoin Cash"
    case 'TBCH': return "Bitcoin Cash testnet"
    case 'RBCH': return "Bitcoin Cash regtest"
    default: return "Unknown coin"
  }
}

export default helper(coinDecoder);
