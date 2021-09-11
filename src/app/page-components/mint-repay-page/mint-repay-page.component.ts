import {Component, OnInit} from '@angular/core';
import {NgxSpinnerService} from "ngx-spinner";
import {
  ContractInfo,
  ContractsService,
} from "../../shared/services/contracts.service";
import {ModalService} from "../../shared/services/modal/modal.service";
import {EthereumService} from "../../shared/services/ethereum.service";
import {BalanceService, CreditLimitInfo, CreditPortfolioInfo} from "../../shared/services/balance.service";
import {combineLatest, ReplaySubject} from "rxjs";
import {map, switchMap, takeUntil, tap} from "rxjs/operators";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {FormControl, Validators} from "@angular/forms";
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-mint-repay-page',
  templateUrl: './mint-repay-page.component.html',
  styleUrls: ['./mint-repay-page.component.scss']
})
export class MintRepayPageComponent implements OnInit {

  private unsubscribe$ = new ReplaySubject();
  private _walletAddress: any;
  private _contractsArray = [];
  private _controllerContract: ContractInfo;

  mintInput: FormControl;
  mintRepayInput: FormControl;
  userBorrowedChip;
  chipBalance;
  availableChipLimit = '0';
  chipContract: ContractInfo = {
    mintFee: 0,
    instance: 0,
    availableToken: 0,
    APY: 0,
    address: ''
  };
  creditPortfolio: CreditPortfolioInfo = {
    injar: '',
    supply: '',
    netApy: 0,
    netJarApy: 0
  };
  creditLimit: CreditLimitInfo = {
    availableCredit: 0,
    borrowLimit: 0,
    borrowLimitUsed: 0
  };
  mintedChip = '';

  constructor(
    private spinner: NgxSpinnerService,
    private modalService: ModalService,
    private contractsService: ContractsService,
    private eth: EthereumService,
    private balanceService: BalanceService,
  ) {
    this.mintInput = new FormControl('', [
      Validators.pattern(/^\d+\,?\.?\d{0,6}$/gm)
    ]);
    this.mintRepayInput = new FormControl('', [
      Validators.pattern(/^\d+\,?\.?\d{0,6}$/gm)
    ]);
  }

  ngOnInit(): void {
    this.spinner.show();
    combineLatest([
      this.eth.signer.getAddress(),
      this.contractsService.getContract('CONTROLLER'),
      this.contractsService.getContract('CHIP'),
      this.balanceService.getAvailableChipLimit()
    ])
      .pipe(
        switchMap(([walletAddress, controllerContract, chipContract, chipLimit]) => {
          this._walletAddress = walletAddress;
          this.chipContract = chipContract;
          this._controllerContract = controllerContract;
          this.availableChipLimit = chipLimit;
          return combineLatest([
            this.contractsService.getCreditPortfolioInfo(this._walletAddress),
            this.balanceService.getBalances(['CHIP']),
            this.chipContract.instance.userBorrow(this._walletAddress),
            this.contractsService.getContract('CHIP')
              .pipe(
                switchMap((chipContract) => {
                  return chipContract.instance.userBorrow(walletAddress);
                })
              ),
            this.contractsService.getTokenNames(),
          ]);
        }),
      )
      .pipe(
        switchMap(([creditPortfolioInfo, balances, repayChipBalance, chipBorrow, tokenNames]) => {
          this.mintedChip = chipBorrow.toString();
          this.creditPortfolio = creditPortfolioInfo as CreditPortfolioInfo;
          this.chipBalance = formatUnits(balances[0]);
          this.userBorrowedChip = formatUnits(repayChipBalance.toString());
          return this.getContractsArray(tokenNames.filter(t => t !== "CHIP"))
            .pipe(
              switchMap(() => {
                return this.getCreditLimit();
              })
            )
        })
      )
      .subscribe((creditLimitInfo: any) => {
        this.creditLimit = creditLimitInfo;
        this.subscribeInBalanceChanges();
        this.spinner.hide();
      })
  }

  private getContractsArray(innerTokens) {
    return combineLatest([
      this.balanceService.getRatedInBalances(innerTokens),
      this.balanceService.getInBalances(innerTokens),
      this.contractsService.getInContracts(innerTokens)
        .pipe(switchMap((inContracts) => combineLatest(
          inContracts.map((inContract, index) => {
            return inContract.instance.isCollateral(this._walletAddress);
          })
        ))),
    ])
      .pipe(
        switchMap(([inRatedBalances, inBalances, isCollaterals]) => {
          innerTokens.forEach((token, index) => {
            this._contractsArray.push({
              title: token,
              rate: inRatedBalances[token],
              balance: inBalances[index],
              isCollateral: isCollaterals[index],
            });
          })
          return this._contractsArray;
        })
      )
  }

  private getCreditLimit() {
    return this.contractsService.getCreditLimitInfo((() => {
      let requestObject = {
        supply: [],
        borrow: []
      };
      this._contractsArray.forEach(contract => {
        if (contract.isCollateral) {
          requestObject.supply.push({
            name: contract.title,
            wei: contract.balance.toString()
          })
        }
      })
      requestObject.borrow.push({
        name: 'CHIP',
        wei: this.mintedChip
      })
      return requestObject;
    })())
      .pipe(map((resp: any) => {
        return resp.data;
      }))
  }

  mint() {
    if (this.mintInput.value && parseFloat(this.mintInput.value) > 0) {
      if (parseFloat(this.mintInput.value) <= parseFloat(this.availableChipLimit)) {
        const inWei = parseUnits(this.mintInput.value.toString()).toString();
        this.spinner.show();
        combineLatest([
          this.contractsService.getContract('CONTROLLER'),
          this.contractsService.getBorrowSign(this._walletAddress, inWei)
        ])
          .subscribe(([controllerContract, sign]) => {
            controllerContract.instance.mintChip(sign.amount, sign.nonce, sign.v, sign.r, sign.s)
              .then(t => {
                return this.eth.transactionWait(t);
              })
              .then((resp) => {
                this.updateTokensState();
                this.balanceService.notifyInBalanceChange(['CHIP']);
                this.mintInput.setValue('');
                this.modalService.open('Success!', {
                  width: '200px',
                  height: '60px'
                }, {});
              })
              .catch(error => {
                this.modalService.open('Mint error', {
                  width: '250px',
                  height: '60px'
                }, {});
              })
              .finally(() => {
                this.spinner.hide();
              });
          })
      } else {
        this.modalService.open('Limit is exceeded', {
          width: '270px',
          height: '60px'
        }, {});
      }
    }
  }

  repayChip() {
    if (this.mintRepayInput.value && parseFloat(this.mintRepayInput.value) > 0) {
      if (parseFloat(this.mintRepayInput.value) <= parseFloat(this.userBorrowedChip)) {
        this.spinner.show();
        const inWei = parseUnits(this.mintRepayInput.value.toString()).toString();
        this.chipContract.instance.approve(this._controllerContract.address, inWei)
          .then((t: any) => {
            return this.eth.transactionWait(t);
          })
          .then(() => {
            return this._controllerContract.instance.repayBorrow(inWei)
          })
          .then((t: any) => {
            return this.eth.transactionWait(t);
          })
          .then(response => {
            this.updateTokensState();
            this.balanceService.notifyInBalanceChange(['CHIP']);
            this.mintRepayInput.setValue('');
            this.modalService.open('Success!', {
              width: '200px',
              height: '60px'
            }, {});
          })
          .catch(error => {
            this.modalService.open('Repay error', {
              width: '270px',
              height: '60px'
            }, {});
          })
          .finally(() => {
            this.spinner.hide();
          });
      }
      else {
        this.modalService.open('Limit is exceeded', {
          width: '270px',
          height: '60px'
        }, {});
      }
    }
  }

  numberInputValidator(event) {
    if (/^\d*\.?\d{0,6}$/gm.test(event.target.value + event.key)) {
      return true;
    } else if (event.key === 'Backspace') {
      return true;
    } else {
      return false;
    }
  }

  private updateTokensState() {
    combineLatest([
      this.balanceService.getBalances(['CHIP']),
      this.chipContract.instance.userBorrow(this._walletAddress),
      this.balanceService.getAvailableChipLimit()
    ]).pipe(
      switchMap(([balances, repayChipBalance, chipLimit]) => {
        this.chipBalance = formatUnits(balances[0]);
        this.mintedChip = repayChipBalance.toString();
        this.userBorrowedChip = formatUnits(repayChipBalance.toString());
        this.availableChipLimit = chipLimit;
        return this.getCreditLimit();
      })
    )
      .subscribe((creditLimit: any) => {
        this.creditLimit = creditLimit;
      })
  }

  onRepayMax() {
    this.mintRepayInput.setValue(this.userBorrowedChip);
  }

  onMintSafeMax() {
    this.mintInput.setValue(this.availableChipLimit);
  }

  private subscribeInBalanceChanges() {
    this.balanceService.onInBalanceChange$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .pipe(
        tap((change) => {
          for (let t of this._contractsArray) {
            if (change[t.title]) {
              t.rate = change[t.title].ratedBalance;
              t.balance = change[t.title].balance;
            }
          }
        })
      )
      .subscribe(() => {
        combineLatest([
          this.getCreditLimit(),
          this.contractsService.getCreditPortfolioInfo(this._walletAddress)
        ])
          .subscribe(([creditLimit, creditPortfolio]) => {
            this.creditLimit = creditLimit;
            this.creditPortfolio = creditPortfolio;
            this.spinner.hide();
          })
      });
  }
}
