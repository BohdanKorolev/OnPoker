import {Injectable} from '@angular/core';
import {EthereumService} from "./ethereum.service";
import {ApiService} from "./api.service";
import {map, switchMap} from "rxjs/operators";
import {parseUnits} from "ethers/lib/utils";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class RewardService {

  private _walletAddress = '';

  constructor(
    private eth: EthereumService,
    private api: ApiService
  ) {
  }

  getInpRewardInfo() {
    return this.checkWalletAddress()
      .pipe(
        switchMap((wallet) => {
          return this.api.post('reward/info/get', {
            sender: this._walletAddress
          })
        })
      )
      .pipe(
        map((resp: any) => {
          return resp.data.collectAmount;
        })
      );
  }

  getInpRewardSign(amount) {
    return this.checkWalletAddress()
      .pipe(
        switchMap((wallet) => {
          const inWei = parseUnits(amount.toString()).toString();
          return this.api.post('reward/collect', {
            sender: this._walletAddress,
            collectAmount: inWei,
          })
        })
      )
      .pipe(
        map((resp: any) => {
          return resp.data;
        })
      );
  }

  getRewardInfo() {
    return this.api.post('reward/info')
      .pipe(
        map((resp: any) => {
          return resp.data;
        })
      )
  }

  private checkWalletAddress(): Observable<any> {
    if (!this._walletAddress) {
      return new Observable((observer) => {
        this.eth.signer.getAddress()
          .then(address => {
            this._walletAddress = address;
            observer.next(this._walletAddress);
          })
      });
    } else {
      return new Observable((observer) => {
        observer.next(this._walletAddress);
      });
    }
  }

}
