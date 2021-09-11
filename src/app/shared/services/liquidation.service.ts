import {Injectable} from '@angular/core';
import {EthereumService} from "./ethereum.service";
import {ApiService} from "./api.service";
import {map} from "rxjs/operators";
import {formatUnits} from "ethers/lib/utils";

@Injectable({
  providedIn: 'root'
})
export class LiquidationService {

  private _walletAddress = '';

  constructor(
    private eth: EthereumService,
    private api: ApiService
  ) {
  }

  getLiquidationList() {
    return this.api.post('liquidation/list')
      .pipe(
        map((resp: any) => {
          return resp.data.map(liquidation => {
            return {
              ...liquidation,
              rewardTokens: formatUnits(liquidation.rewardWei).toString()
            }
          });
        })
      )
  }

  getLiquidationSign({currency, inAmountWei, wallet, chipAmountWei, rewardWei}) {
    console.log(currency, inAmountWei, wallet, chipAmountWei, rewardWei);
    if (this._walletAddress) {
      return this.api.post('liquidation/sign', {
        sender: this._walletAddress,
        inToken: currency,
        inAmount: inAmountWei,
        account: wallet,
        chipAmount: chipAmountWei,
        reward: rewardWei
      })
        .toPromise()
        .then((resp: any) => {
          console.log('resp', resp);
          return resp.data;
        });
    } else {
      return this.eth.signer.getAddress()
        .then(address => {
          this._walletAddress = address;
          return this.api.post('liquidation/sign', {
            sender: this._walletAddress,
            inToken: currency,
            inAmount: inAmountWei,
            account: wallet,
            chipAmount: chipAmountWei,
            reward: rewardWei
          })
            .toPromise()
            .then((resp: any) => {
              return resp.data;
            });
        })
    }
  }
}

// Ликвидация
// {
//   "currency": "BNB",
//   "debtAmountUsd": "773.16",
//   "inAmountWei": "2000000000000000000",
//   "inAmountToken": "2",
//   "chipAmountWei": "773160000000000000000",
//   "rewardsAmountUsd": "77.316",
//   "rewardWei": "850476000000000000000",
//   "wallet": "0xec4872C7d25D392e6598AFEcb905fd6c194A77e8"
// }
//    |
//    |
//    V
// Запрос на получение подписи для ликвидации
// {
//   "sender":"0xec4872C7d25D392e6598AFEcb905fd6c194A77e8",
//   "inToken":"INP",                                             currency
//   "inAmount":"500000000000000000000",                          inAmountWei
//   "account":"0xec4872C7d25D392e6598AFEcb905fd6c194A77e8",      wallet
//   "chipAmount":"125000000000000000000",                        chipAmountWei
//   "reward":"137500000000000000000"                             rewardWei
// }
