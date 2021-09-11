import {Injectable} from '@angular/core';
import {EthereumService} from "./ethereum.service";
import {ContractsService} from "./contracts.service";
import {ApiService} from "./api.service";
import {Observable} from "rxjs";
import {map, switchMap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private _walletAddress = '';
  private _gameUrl;

  constructor(
    private eth: EthereumService,
    private api: ApiService
  ) {
  }

  getUserGameInfo(): Observable<any> {
    return this.checkWalletAddress()
      .pipe(
        switchMap((wallet) => {
          return this.api.get(`user/info?wallet=${wallet}`)
        })
      )
      .pipe(
        map((resp: any) => {
          return resp.data;
        })
      );
  }

  getGameUrl(login?, password?) {
    if (login && password) {
      return this.checkWalletAddress()
        .pipe(
          switchMap((wallet) => {
            return this.api.post('user/redirect', {
              wallet: wallet,
              login: login,
              password: password
            })
          })
        )
        .pipe(
          map((resp: any) => {
            if (resp.data) {
              return resp.data;
            } else {
              return false;
            }
          })
        )
    }
    else {
      return this.checkWalletAddress()
        .pipe(
          switchMap((wallet) => {
            return this.api.post('user/redirect', {
              wallet: wallet,
            })
          })
        )
    }
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
