import { helper } from '@ember/component/helper';

export function coinDecoder(params/*, hash*/) {
  const coin = params[0]
  switch (coin) {
    case 'BTC': return "Bitcoin"
    case 'TBTC': return "Bitcoin testnet"
    case 'RBTC': return "Bitcoin regtest (UNSUPPORTED)"
    case 'BCH': return "Bitcoin Cash"
    case 'TBCH': return "Bitcoin Cash testnet"
    case 'RBCH': return "Bitcoin Cash regtest (UNSUPPORTED)"
    case 'LTC': return "Litecoin"
    case 'TLTC': return "Litecoin testnet"
    case 'RLTC': return "Litecoin regtest (UNSUPPORTED)"
    case 'GRS': return "Groestlcoin"
    case 'TGRS': return "Groestlcoin testnet"
    case 'RGRS': return "Groestlcoin regtest (UNSUPPORTED)"
    default: return "Unknown coin"
  }
}

export default helper(coinDecoder);
