import {Injectable} from '@angular/core';
import {EthereumService} from "./ethereum.service";
import {ContractsService} from "./contracts.service";
import {map, switchMap} from "rxjs/operators";
import {BigNumber, } from "ethers";
import {combineLatest, Observable, Subject} from "rxjs";
import {ApiService} from "./api.service";

export interface BalanceChange {
  [key: string]: {
    ratedBalance: BigNumber,
    balance: BigNumber
  }
}

export interface CreditPortfolioInfo {
  netApy: number;
  supply: string;
  injar: string;
  netJarApy: number
}

export interface CreditLimitInfo {
  borrowLimit: number;
  borrowLimitUsed: number;
  availableCredit: number;
}

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private inBalanceChange = new Subject<BalanceChange>()
  private _creditLimitInfo: CreditLimitInfo;
  private _creditPortfolioInfo: CreditPortfolioInfo;
  private _walletAddress;

  constructor(
    private eth: EthereumService,
    private contracts: ContractsService,
    private api: ApiService
  ) {
  }

  getBalances(tokens: string[]): Promise<BigNumber[]> {
    return this.eth.signer.getAddress().then(
      (address) => {
        let promises = tokens.map(t => {
          return t === "BNB" ? this.eth.signer.getBalance() : this.contracts.getContract(t).pipe(map(c => c.instance.balanceOf(address))).toPromise()
        });
        return Promise.all(promises);
      }
    )
  }

  getRatedInBalances(tokens: string[]) {
    return combineLatest([this.eth.signer.getAddress(), this.getInBalances(tokens)])
      .pipe(switchMap(([address, tokensBalances]) => {
        let tokensData = tokens.map((tokenName, index) =>
          ({
            name: tokenName,
            wei: tokensBalances[index].toString()
          })
        );
        return this.api.post('token/rate/usd', {
          wallet: address,
          tokenData: tokensData
        }).pipe(map((response: any) => {
          let result = {};
          response.data.forEach(obj => {
            result[obj.name] = obj.usd
          })
          return result;
        }));
      })).toPromise();
  }

  getInBalances(tokens: string[]): Promise<BigNumber[]> {
    return this.eth.signer.getAddress().then(
      (address) => {
        return this.contracts.getInContracts(tokens).pipe(
          switchMap(
            contracts => {
              return Promise.all(contracts.map(c => c.instance.balanceOf(address)))
            }
          )
        ).toPromise();
      }
    )
  }

  notifyInBalanceChange(tokens: string[]) {
    combineLatest([
      this.getRatedInBalances(tokens),
      this.getInBalances(tokens),
    ])
    .subscribe(
      ([ratedBalances,inBalances]) => {
        let balanceChanges: BalanceChange = {};
        tokens.forEach((token, index) => {
          balanceChanges[token] = {
            ratedBalance: ratedBalances[token],
            balance: inBalances[index]
          };
        })
        this.inBalanceChange.next(balanceChanges);
      }
    )
  }

  supplyGameBalance() {
    return this.eth.signer.getAddress()
      .then(address => {
        return this.api.post('balance/deposit',{wallet: address})
          .pipe(
            map((resp: any) => {
              console.log('balance/deposit',resp)
              return resp.data;
            })
          ).toPromise();
      })
  }

  getAvailableChipLimit() {
    return this.checkWalletAddress()
      .pipe(
        switchMap((wallet) => {
          return this.api.post('token/mint/limit', {
            wallet: wallet
          });
        })
      )
      .pipe(
        map((resp: any) => {
          return resp.data.chipLimit;
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

  get onInBalanceChange$(): Observable<BalanceChange> {
    return this.inBalanceChange.asObservable();
  }

  get creditLimitInfo() {
    return this._creditLimitInfo;
  }

  set creditLimitInfo(value: CreditLimitInfo) {
    this._creditLimitInfo = value;
  }

  get creditPortfolioInfo() {
    return this._creditPortfolioInfo;
  }

  set creditPortfolioInfo(value: CreditPortfolioInfo) {
    this._creditPortfolioInfo = value;
  }
}
