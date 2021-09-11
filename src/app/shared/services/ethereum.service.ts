import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";
import detectEthereumProvider from '@metamask/detect-provider';
import { environment } from "../../../environments/environment";
import { Router } from '@angular/router';
import { ethers } from "ethers";

export enum MetamaskState { NOT_CHECKED, NO_METAMASK, NOT_CONNECTED, INCORRECT_NETWORK, NO_ACCOUNT, CONNECTED }

declare const ethereum: any;

interface ConnectInfo {
  chainId: string;
}


@Injectable({
  providedIn: 'root'
})
export class EthereumService {
  private provider: any;
  private _metamaskState$ = new BehaviorSubject<MetamaskState>(MetamaskState.NOT_CHECKED);
  private _singer: any;
  private _ethersProvider: any;

  get metamaskStateObservable() {
    return this._metamaskState$.asObservable();
  }

  get currentState() {
    return this._metamaskState$.value;
  }

  get ethersProvider() {
    if (this._ethersProvider) {
      return this._ethersProvider;
    }
    this._ethersProvider = new ethers.providers.Web3Provider(this.provider);
    return this._ethersProvider;
  }

  get signer() {
    if (this._singer) {
      return this._singer;
    }
    this._singer = this.ethersProvider.getSigner();
    return this._singer;
  }

  constructor(
    private router: Router
  ) {
    this.checkMetamaskState();
  }

  private checkAccount() {
    this.provider.request({ method: "eth_accounts" }).then((accounts: any[]) => {
      if (accounts.length === 0) {
        this._metamaskState$.next(MetamaskState.NO_ACCOUNT)
      } else {
        this._metamaskState$.next(MetamaskState.CONNECTED);
      }
    })
  }

  private async checkMetamaskState() {
    this.provider = await detectEthereumProvider();
    if (!this.provider) {
      this._metamaskState$.next(MetamaskState.NO_METAMASK);
    }

    if (this.provider.isConnected()) {
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      if (chainId !== environment.network) {
        this._metamaskState$.next(MetamaskState.INCORRECT_NETWORK);
      } else {
        this.checkAccount();
      }
    }



    this.provider.on('connect', (connectInfo: ConnectInfo) => {
      if (connectInfo.chainId == environment.network) {
        this.checkAccount();
      } else {
        this._metamaskState$.next(MetamaskState.INCORRECT_NETWORK)
      }
    });

    this.provider.on('chainChanged', (chainId: string) => {
      if (chainId !== environment.network) {
        this._metamaskState$.next(MetamaskState.INCORRECT_NETWORK);
      } else {
        this.checkAccount();
      }
    })

    this.provider.on('disconnect', (connectInfo: ConnectInfo) => {
      this._metamaskState$.next(MetamaskState.NOT_CONNECTED)
    });

    this.provider.on("accountsChanged", () => this.checkAccount())
  }

  connectAccount() {
    this.provider.request({ method: "eth_requestAccounts" }).then(() => {
      this.router.navigate(['/cashier'])
    });
  }


  transactionWait(t: any) {
    const catchError = (e) => {
      console.log('Transaction error ', e);
      if (!e.cancelled && e.replacement) {
        console.log('transaction replaced')
        return e.replacement.wait(environment.confirmationsNumber).catch(catchError);
      }
      throw e;
    }
    return t.wait(environment.confirmationsNumber).catch(catchError);
  }
}
