import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {ModalService} from "../../../shared/services/modal/modal.service";
import {ModalRef} from "../../../shared/services/modal/modal-ref";
import {
  ContractInfo,
  ContractsService,
  ContractDetails,
} from "../../../shared/services/contracts.service";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {FormControl, Validators} from "@angular/forms";
import {EthereumService} from "../../../shared/services/ethereum.service";
import {NgxSpinnerService} from "ngx-spinner";
import {BalanceService, CreditLimitInfo} from "../../../shared/services/balance.service";
import {combineLatest, Observable} from "rxjs";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-sb-modal',
  templateUrl: './sb-modal.component.html',
  styleUrls: ['./sb-modal.component.scss']
})
export class SbModalComponent implements OnInit {

  sbSwitch: number = 0;
  sbContractTitle: string = '';
  currentContract: ContractInfo;
  sbUserAmountControl: FormControl;
  walletBalance = '';
  availableLimit: any;
  contractDetails: ContractDetails = {
    distributionApy: 0,
    supplyApy: 0
  };
  supplyBalance = '';

  @Input() creditLimitInfo: CreditLimitInfo;

  @ViewChild('sbModalTemplate') template?: TemplateRef<any>;
  modalRef?: ModalRef;

  constructor(
    private modalService: ModalService,
    private contractService: ContractsService,
    private eth: EthereumService,
    private spinner: NgxSpinnerService,
    private balanceService: BalanceService
  ) { }

  ngOnInit(): void {
    this.sbUserAmountControl = new FormControl('', [
      Validators.pattern(/^\d+\,?\.?\d{0,6}$/gm)
    ]);
  }

  show(contractTitle): void {
    this.sbUserAmountControl.reset();
    this.spinner.show();
    const openModal = () => {
      this.sbContractTitle = contractTitle;
      this.spinner.hide();
      this.modalRef = this.modalService.open(
        this.template as TemplateRef<any>,
        {
          dlgClass: 'full-width-modal'
        },
        {}
      )
    }
    if (contractTitle.toLowerCase() === 'bnb') {
      combineLatest([
        this.eth.signer.getBalance(),
        this.contractService.getContractDetailInfo(contractTitle),
        this.balanceService.getInBalances([contractTitle])
      ])
        .subscribe(([balance, contractDetails, inBalance]) => {
          this.walletBalance = formatUnits(balance.toString()) ? formatUnits(balance.toString()) : '0';
          if (<ContractDetails> contractDetails) {
            this.contractDetails = contractDetails
          }
          this.supplyBalance = formatUnits(inBalance.toString()).toString();
          openModal();
        })
    } else {
      combineLatest([
        this.contractService.getContract('CONTROLLER'),
        this.contractService.getContract(contractTitle),
        this.eth.signer.getAddress(),
        this.contractService.getContractDetailInfo(contractTitle),
        this.balanceService.getInBalances([contractTitle])
      ])
        .subscribe(([controller, currentContract, address, contractDetails, inBalance]) => {
          this.currentContract = currentContract;
          if (<ContractDetails> contractDetails) {
            this.contractDetails = contractDetails
          }
          combineLatest([
            currentContract.instance.balanceOf(address),
            currentContract.instance.balanceOf(controller.address)
          ])
            .subscribe(([walletBalance, availableLimit]) => {
              this.walletBalance = formatUnits(walletBalance.toString()) ? formatUnits(walletBalance.toString()) : '0';
              this.availableLimit = formatUnits(availableLimit.toString()) ? formatUnits(availableLimit.toString()) : '0';
              this.supplyBalance = formatUnits(inBalance.toString()).toString();
              openModal();
            });
        });
    }
  }

  supply(): void {
    if (this.sbUserAmountControl.value.toString()) {
      this.spinner.show();
      const inWei = parseUnits(this.sbUserAmountControl.value.toString());
      if (this.sbContractTitle.toLowerCase() === 'bnb') {
        this.contractService.getContract('CONTROLLER').subscribe(controllerContract => {
          this.eth.signer.getAddress().then((address) => {
            controllerContract.instance.supplyBnb({from: address, value: inWei})
              .then((t:any) => {
                return this.eth.transactionWait(t);
              })
              .then(() => {
                this.balanceService.notifyInBalanceChange([this.sbContractTitle]);
                this.modalService.open('Completed', {
                  width: '170px',
                  height: '60px'
                }, {});
              })
              .catch(error => {
                this.modalService.open('Supply error', {
                  width: '250px',
                  height: '60px'
                }, {});
              })
              .finally(() => {
                this.modalRef.close();
                this.spinner.hide();
              });
          });
        });
      }
      else {
        this.contractService.getContract('CONTROLLER').subscribe(controllerContract => {
          this.currentContract.instance.approve(controllerContract.address, inWei)
            .then((t:any) => {
              return this.eth.transactionWait(t);
            })
            .then(() => {
              return controllerContract.instance.supplyToken(this.currentContract.address, inWei);
            })
            .then((t:any) => {
              return this.eth.transactionWait(t);
            })
            .then(() => {
              this.balanceService.notifyInBalanceChange([this.sbContractTitle]);
              this.modalService.open('Completed', {
                width: '170px',
                height: '60px'
              }, {});
            })
            .catch(error => {
              this.modalService.open('Supply error', {
                width: '250px',
                height: '60px'
              }, {});
              console.log(error);
              console.log(`error.cancelled ${error.cancelled}, error.replacement ${error.replacement}`,)
            })
            .finally(() => {
              this.modalRef.close();
              this.spinner.hide();
            });
        });
      }
    }
  }

  withdraw() {
    if (this.sbUserAmountControl.value.toString()) {
      this.spinner.show();
      const inWei = parseUnits(this.sbUserAmountControl.value.toString());
      if (this.sbContractTitle.toLowerCase() === 'bnb') {
        this.contractService.getContract('CONTROLLER').subscribe(controllerContract => {
          controllerContract.instance.withdrawBnb(inWei)
            .then((t:any) => {
              return this.eth.transactionWait(t);
            })
            .then(() => {
              this.balanceService.notifyInBalanceChange([this.sbContractTitle]);
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
            });
        });
      }
      else {
        this.contractService.getContract('CONTROLLER').subscribe(controllerContract => {
          controllerContract.instance.withdrawToken(this.currentContract.address, inWei)
            .then((t:any) => {
              return this.eth.transactionWait(t);
            })
            .then(() => {
              this.balanceService.notifyInBalanceChange([this.sbContractTitle]);
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
        });
      }
    }
  }

  setMaxAllowValue() {
    if (this.sbSwitch === 0) {
      this.sbUserAmountControl.setValue(this.walletBalance);
    }
    else if (this.sbSwitch === 1) {
      this.sbUserAmountControl.setValue(this.supplyBalance);
    }
  }

  numberInputValidator(event) {
    if (/^\d*\.?\d{0,6}$/gm.test(event.target.value + event.key)) {
      return true;
    }
    else if (event.key === 'Backspace') {
      return true;
    }
    else {
      return false;
    }
  }

  private replacementErrorHandler() {

  }
}
