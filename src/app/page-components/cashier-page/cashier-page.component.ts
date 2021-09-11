import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {SbModalComponent} from "./sb-modal/sb-modal.component";
import {RbModalComponent} from "./rb-modal/rb-modal.component";
import {ContractsService} from "../../shared/services/contracts.service";
import {EthereumService} from "../../shared/services/ethereum.service";
import {combineLatest, from, ReplaySubject} from "rxjs";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {NgxSpinnerService} from "ngx-spinner";
import {
  debounceTime,
  delay,
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom
} from "rxjs/operators";
import {ExchangeService} from "../../shared/services/exchange.service";
import {BalanceService, CreditLimitInfo, CreditPortfolioInfo} from "../../shared/services/balance.service";
import {ModalService} from "../../shared/services/modal/modal.service";

@Component({
  selector: 'app-cashier-page',
  templateUrl: './cashier-page.component.html',
  styleUrls: ['./cashier-page.component.scss']
})
export class CashierPageComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new ReplaySubject();
  @ViewChild('sbTemplateRef') templateSb: SbModalComponent;
  @ViewChild('rbTemplateRef') templateRb: RbModalComponent;

  Form: FormGroup = new FormGroup({
    tokenFrom: new FormControl('BNB'),
    tokenTo: new FormControl('CHIP'),
    amountFrom: new FormControl(''),
    amountTo: new FormControl(''),
    wallet: new FormControl('')
  });
  exchangeResponse: any = {
    priceImpact: 0,
    liquidityProviderFee: 'INPOKER'
  };
  fromArray = [
    {
      img: '/assets/image/icons/inp.svg',
      title: 'INP'
    },
    {
      img: '/assets/image/icons/bnb.svg',
      title: 'BNB'
    },
    {
      img: '/assets/image/icons/busd.svg',
      title: 'BUSD'
    },
    {
      img: '/assets/image/icons/chip.svg',
      title: 'CHIP'
    }
  ]
  mintedChip = '';

  contractsArray = [];
  sbSwitch: number = 0;
  creditPortfolio: CreditPortfolioInfo = {
    injar: '',
    netApy: 0,
    supply: '',
    netJarApy: 0
  };
  creditLimit: CreditLimitInfo = {
    availableCredit: 0,
    borrowLimit: 0,
    borrowLimitUsed: 0
  }

  constructor(
    private modalService: ModalService,
    private contractsService: ContractsService,
    private eth: EthereumService,
    private spinner: NgxSpinnerService,
    private exchangeService: ExchangeService,
    private balanceService: BalanceService,
  ) {
  }

  ngOnInit(): void {
    this.spinner.show();
    this.eth.signer.getAddress().then(address => {
      this.Form.patchValue({wallet: address})
      this.contractsService.getTokenNames()
        .pipe(
          takeUntil(this.unsubscribe$),
        )
        .subscribe((tokens) => {
          let innerTokens = tokens.filter(t => t !== "CHIP");
          this.getContractsArray(innerTokens, address)
            .pipe(
              switchMap(() => {
                return combineLatest([
                  this.contractsService.getCreditPortfolioInfo(address),
                  this.contractsService.getContract('CHIP')
                    .pipe(
                      switchMap((chipContract) => {
                        return chipContract.instance.userBorrow(address);
                      })
                    )
                ])
              })
            )
            .subscribe(([creditInfo, chipBorrow]) => {
              this.mintedChip = chipBorrow.toString();
              this.creditPortfolio = creditInfo;
              this.getCreditLimit()
                .subscribe((resp) => {
                  this.creditLimit = resp;
                  this.spinner.hide();
                })
            });
        })
    });
    this.subscribeInBalanceChanges();
    this.subscribeFormChanges();
  }

  private subscribeInBalanceChanges() {
    this.balanceService.onInBalanceChange$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .pipe(
        tap((change) => {
          for (let t of this.contractsArray) {
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
          this.contractsService.getCreditPortfolioInfo(this.Form.value.wallet)
        ])
          .subscribe(([creditLimit, creditPortfolio]) => {
            this.creditLimit = creditLimit;
            this.creditPortfolio = creditPortfolio;
            this.spinner.hide();
          })
      });
  }

  private subscribeFormChanges() {
    this.Form.get('tokenFrom').valueChanges.pipe(delay(100)).subscribe((value) => {
      this.Form.get('tokenTo').setValue(value === 'CHIP' ? 'BNB' : 'CHIP', {
        emitEvent: false
      });
      this.updateAmounts();
    });
    this.Form.get('tokenTo').valueChanges.pipe(delay(100)).subscribe((value) => {
      this.Form.get('tokenFrom').setValue(value === 'CHIP' ? 'BNB' : 'CHIP', {
        emitEvent: false
      });
      this.updateAmounts();
    });
    this.Form.get('amountFrom').valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      delay(100),
    ).subscribe(() => {
      this.updateAmounts();
    })
  }

  getContractsArray(innerTokens, address) {
    return combineLatest([
      this.balanceService.getRatedInBalances(innerTokens),
      this.balanceService.getInBalances(innerTokens),
      this.contractsService.getInContracts(innerTokens)
        .pipe(switchMap((inContracts) => combineLatest(
          inContracts.map((inContract, index) => {
            return inContract.instance.isCollateral(address);
          })
        ))),
      this.contractsService.getAPYs(),
    ])
      .pipe(map(([inRatedBalances, inBalances, isCollaterals, APYs]) => {
        innerTokens.forEach((token, index) => {
          this.contractsArray.push({
            title: token,
            rate: inRatedBalances[token],
            balance: inBalances[index],
            APY: APYs[innerTokens[index].toUpperCase()],
            isCollateral: isCollaterals[index],
          });
        })
      }))
  }

  // contractChip.userBorrow()

  getCreditLimit() {
    return this.contractsService.getCreditLimitInfo((() => {
      let requestObject = {
        supply: [],
        borrow: []
      };
      this.contractsArray.forEach(contract => {
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

  openSbModal(title, event) {
    if (!event.target.closest('.switch')) {
      this.templateSb.show(title);
    }
  }

  private updateAmounts() {
    if (!this.Form.value.amountFrom) {
      return;
    }
    const transferValue = Object.assign({}, this.Form.value, {
      amountFrom: parseUnits(this.Form.value.amountFrom.toString()).toString(),
    });
    this.exchangeService.exchangeToken(transferValue)
      .subscribe((resp: any) => {
        this.exchangeResponse = resp;
        this.Form.get('amountTo').setValue(formatUnits(this.exchangeResponse.amountTo).match(/.+\...../));
      });
  }

  switchTokens() {
    const reverseFormObject = {
      tokenTo: this.Form.value.tokenFrom,
      tokenFrom: this.Form.value.tokenTo,
      amountTo: this.Form.value.amountFrom,
      amountFrom: this.Form.value.amountTo,
    }
    this.Form.patchValue({
      tokenTo: this.Form.value.tokenFrom,
      tokenFrom: this.Form.value.tokenTo
    }, {emitEvent: false});
    this.Form.patchValue({
      amountTo: this.Form.value.amountFrom,
      amountFrom: this.Form.value.amountTo
    }, {emitEvent: true});
  }

  onCollateral(item, event) {
    this.spinner.show();
    this.contractsService.getCollateralConfirmation(item.rate)
      .subscribe(resp => {
        if (resp || !item.isCollateral) {
          this.contractsService.getInContract(item.title).subscribe(inContract => {
            inContract.instance.toggleCollateral()
              .then(t => {
                return this.eth.transactionWait(t)
              })
              .then(resp => {
                item.isCollateral = !item.isCollateral;
                this.getCreditLimit()
                  .subscribe((resp: CreditLimitInfo) => {
                    this.creditLimit = resp;
                    this.spinner.hide();
                  })
              })
              .catch(error => {
                event.target.checked = !event.target.checked;
                this.showMessage('Oops. Some troubles!', '300px', '60px');
              })
              .finally(() => {
                this.spinner.hide();
              });
          })
        }
        else {
          event.target.checked = !event.target.checked;
          this.showMessage('You can`t toggle collateral.', '320px', '60px');
          this.spinner.hide();
        }
      })
  }

  connectWallet() {
    if (this.Form.value.amountFrom) {
      this.spinner.show();
      const inWei = parseUnits(this.Form.value.amountFrom.toString());
      this.contractsService.getContract('CONTROLLER').subscribe(controller => {
        if (this.Form.value.tokenFrom.toLowerCase() !== 'bnb' && this.Form.value.tokenTo.toLowerCase() !== 'bnb') {
          this.contractsService.getContract(this.Form.value.tokenFrom).subscribe(contract => {
            contract.instance.approve(controller.address, inWei)
              .then((t: any) => {
                return this.eth.transactionWait(t);
              })
              .then(() => {
                return controller.instance.exchangeTokens(
                  this.exchangeResponse.tokenFrom,
                  this.exchangeResponse.amountFrom,
                  this.exchangeResponse.tokenTo,
                  this.exchangeResponse.amountTo,
                  this.exchangeResponse.nonce,
                  this.exchangeResponse.v,
                  this.exchangeResponse.r,
                  this.exchangeResponse.s
                )
              })
              .then(t => this.eth.transactionWait(t))
              .then(response => {
                this.Form.get('amountFrom').setValue('');
                this.Form.get('amountTo').setValue('');
                this.showMessage('Exchange success', '300px', '60px');
              })
              .catch(error => {
                this.showMessage('Exchange error', '300px', '60px');
              })
          })
        } else {
          if (this.Form.value.tokenFrom.toLowerCase() === 'bnb') {
            controller.instance.exchangeBnbToToken(
              this.exchangeResponse.tokenTo,
              this.exchangeResponse.amountTo,
              this.exchangeResponse.nonce,
              this.exchangeResponse.v,
              this.exchangeResponse.r,
              this.exchangeResponse.s,
              {
                value: inWei
              }
            )
              .then(t => this.eth.transactionWait(t))
              .then(response => {
                this.Form.get('amountFrom').setValue('');
                this.Form.get('amountTo').setValue('');
                this.showMessage('Exchange success', '300px', '60px');
              })
              .catch(error => {
                this.showMessage('Exchange error', '300px', '60px');
              });
          } else if (this.Form.value.tokenTo.toLowerCase() === 'bnb') {
            this.contractsService.getContract(this.Form.value.tokenFrom).subscribe(contract => {
              contract.instance.approve(controller.address, inWei)
                .then((t: any) => {
                  return this.eth.transactionWait(t);
                })
                .then(() => {
                  return controller.instance.exchangeTokenToBnb(
                    this.exchangeResponse.tokenFrom,
                    this.exchangeResponse.amountFrom,
                    this.exchangeResponse.amountTo,
                    this.exchangeResponse.nonce,
                    this.exchangeResponse.v,
                    this.exchangeResponse.r,
                    this.exchangeResponse.s,
                  )
                })
                .then(t => this.eth.transactionWait(t))
                .then(response => {
                  this.Form.get('amountFrom').setValue('');
                  this.Form.get('amountTo').setValue('');
                  this.showMessage('Exchange success', '300px', '60px');
                })
                .catch(error => {
                  this.showMessage('Exchange error', '300px', '60px');
                });
            })
          }
        }
      })
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private showMessage(message, windowWidth = 'auto', windowHeight = 'auto') {
    this.spinner.hide();
    this.modalService.open(message, {
      width: windowWidth,
      height: windowHeight
    }, {});
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
}








