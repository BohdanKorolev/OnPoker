import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {ContractInfo, ContractsService} from "../../../shared/services/contracts.service";
import {FormControl, Validators} from "@angular/forms";
import {BalanceService, CreditLimitInfo} from "../../../shared/services/balance.service";
import {ModalRef} from "../../../shared/services/modal/modal-ref";
import {ModalService} from "../../../shared/services/modal/modal.service";
import {EthereumService} from "../../../shared/services/ethereum.service";
import {NgxSpinnerService} from "ngx-spinner";
import {combineLatest} from "rxjs";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-deposit-modal',
  templateUrl: './deposit-modal.component.html',
  styleUrls: ['./deposit-modal.component.scss']
})
export class DepositModalComponent implements OnInit {
  depositSwitch: number = 0;
  depositContractTitle: string = '';
  currentContract: ContractInfo;
  depositUserAmountControl: FormControl;
  walletBalance = '';
  gameBalance: any;
  contractIcon = '';

  private controllerContract: ContractInfo;
  private wallet = '';

  @Input() creditLimitInfo: CreditLimitInfo;
  @Output() onUpdateGameBalance: EventEmitter<any>;

  @ViewChild('sbModalTemplate') template?: TemplateRef<any>;
  modalRef?: ModalRef;

  constructor(
    private modalService: ModalService,
    private contractService: ContractsService,
    private eth: EthereumService,
    private spinner: NgxSpinnerService,
    private balanceService: BalanceService
  ) {
    this.onUpdateGameBalance = new EventEmitter<any>();
    this.depositUserAmountControl = new FormControl('', [
      Validators.pattern(/^\d+\,?\.?\d{0,6}$/gm)
    ]);
  }

  ngOnInit(): void {
  }

  show(contractTitle, balance): void {
    this.contractIcon = `/assets/image/icons/${contractTitle.toLowerCase()}.svg`;
    this.depositUserAmountControl.reset();
    this.depositContractTitle = contractTitle;
    this.gameBalance = balance;
    this.spinner.show();
    const openModal = () => {
      this.depositContractTitle = contractTitle;
      this.spinner.hide();
      this.modalRef = this.modalService.open(
        this.template as TemplateRef<any>,
        {
          dlgClass: 'full-width-modal'
        },
        {}
      )
    }
    combineLatest([
      this.contractService.getContract('CONTROLLER'),
      this.contractService.getContract(contractTitle),
      this.eth.signer.getAddress(),
    ])
      .subscribe(([controller, currentContract, address]) => {
        this.controllerContract = controller;
        this.currentContract = currentContract;
        this.wallet = address as string;
        combineLatest([
          currentContract.instance.balanceOf(address),
        ])
          .subscribe(([walletBalance]) => {
            this.walletBalance = formatUnits(walletBalance.toString()) ? formatUnits(walletBalance.toString()) : '0';
            openModal();
          });
      });
  }

  deposit(): void {
    if (this.depositUserAmountControl.value.toString()) {
      const inWei = parseUnits(this.depositUserAmountControl.value.toString()).toString();
      this.spinner.show();
      this.currentContract.instance.approve(this.controllerContract.address, inWei, {from: this.wallet})
        .then((t: any) => {
          return this.eth.transactionWait(t);
        })
        .then(() => {
          return this.controllerContract.instance.supplyGameBalance(this.currentContract.address, inWei);
        })
        .then((t: any) => {
          console.log('t', t)
          return this.eth.transactionWait(t);
        })
        .then((t) => {
          return this.balanceService.supplyGameBalance();
        })
        .then((supplyGameBalance) => {
          this.onUpdateGameBalance.emit(true);
          this.modalService.open('Completed', {
            width: '170px',
            height: '60px'
          }, {});
        })
        .catch(error => {
          console.log(error)
          this.modalService.open('Deposit error', {
            width: '250px',
            height: '60px'
          }, {});
        })
        .finally(() => {
          this.modalRef.close();
          this.spinner.hide();
        });
    }
  }

  withdraw() {
    if (this.depositUserAmountControl.value.toString()) {
      this.spinner.show();
      const inWei = parseUnits(this.depositUserAmountControl.value.toString()).toString();
      this.contractService.withdrawGameBalanceSign(this.wallet, inWei, this.depositContractTitle)
        .subscribe((sign) => {
            if (sign.token) {
              this.controllerContract.instance.withdrawGameBalance(
                sign.token,
                sign.amount,
                sign.nonce,
                sign.v,
                sign.r,
                sign.s,
              )
                .then((t: any) => {
                  return this.eth.transactionWait(t);
                })
                .then((data) => {
                  this.onUpdateGameBalance.emit(true);
                  this.modalService.open('Completed', {
                    width: '170px',
                    height: '60px'
                  }, {});

                })
                .catch(error => {
                  this.modalService.open('Withdraw error', {
                    width: '250px',
                    height: '60px'
                  }, {});
                })
                .finally(() => {
                  this.modalRef.close();
                  this.spinner.hide();
                });
            }
            else {
              this.modalService.open('Withdraw error', {
                width: '250px',
                height: '60px'
              }, {});
            }
          }
        )
    }
  }

  setMaxAllowValue() {
    if (this.depositSwitch === 0) {
      this.depositUserAmountControl.setValue(this.walletBalance.match(/^\d*\.?\d{0,6}/)[0]);
    } else if (this.depositSwitch === 1) {
      this.depositUserAmountControl.setValue(this.gameBalance.match(/^\d*\.?\d{0,6}/)[0]);
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
}
