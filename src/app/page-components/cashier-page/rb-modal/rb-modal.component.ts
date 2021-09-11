import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {ModalRef} from "../../../shared/services/modal/modal-ref";
import {ModalService} from "../../../shared/services/modal/modal.service";
import {NgxSpinnerService} from "ngx-spinner";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {
  ContractDetails,
  ContractInfo,
  ContractsService
} from "../../../shared/services/contracts.service";
import {FormControl, Validators} from "@angular/forms";
import {EthereumService} from "../../../shared/services/ethereum.service";
import {BalanceService, CreditLimitInfo} from "../../../shared/services/balance.service";
import {combineLatest, Observable} from "rxjs";
import {switchMap, tap} from "rxjs/operators";

@Component({
  selector: 'app-rb-modal',
  templateUrl: './rb-modal.component.html',
  styleUrls: ['./rb-modal.component.scss']
})
export class RbModalComponent implements OnInit {

  rbSwitch: number = 0;
  rbContractTitle = '';
  currentContract: ContractInfo;
  rbUserAmountControl: FormControl;
  walletBalance = '';
  availableLimit: any;
  contractDetails: ContractDetails = {
    distributionApy: 0,
    supplyApy: 0
  };

  private address: string;

  @Input() creditLimitInfo: CreditLimitInfo;

  @ViewChild('rbModalTemplate') template?: TemplateRef<any>;
  modalRef?: ModalRef;

  constructor(
    private contractService: ContractsService,
    private modalService: ModalService,
    private spinner: NgxSpinnerService,
    private eth: EthereumService,
    private balanceService: BalanceService
  ) { }

  ngOnInit(): void {
    this.rbUserAmountControl = new FormControl('', [
      Validators.pattern(/^\d+\,?\.?\d{0,6}$/gm)
    ]);
  }

  show(contractTitle): void {
    this.rbUserAmountControl.reset();
    this.spinner.show();
    const openModal = () => {
      this.rbContractTitle = contractTitle;
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
      combineLatest([this.eth.signer.getBalance(), this.getContractDetails(contractTitle)])
        .subscribe(([balance, contractDetails]) => {
          this.walletBalance = formatUnits(balance.toString()) ? formatUnits(balance.toString()) : '0';
          if (<ContractDetails> contractDetails) {
            this.contractDetails = contractDetails
          }
          openModal();
        })
    } else {
      combineLatest([
        this.contractService.getContract('CONTROLLER'),
        this.contractService.getContract(contractTitle),
        this.eth.signer.getAddress()
      ])
        .subscribe(([controller, currentContract, address]) => {
          this.address = address as string;
          this.currentContract = currentContract;
          combineLatest([
            currentContract.instance.balanceOf(address),
            currentContract.instance.balanceOf(controller.address)
          ])
            .subscribe(([walletBalance, availableLimit]) => {
              this.walletBalance = formatUnits(walletBalance.toString()) ? formatUnits(walletBalance.toString()) : '0';
              this.availableLimit = formatUnits(availableLimit.toString()) ? formatUnits(availableLimit.toString()) : '0';
              openModal();
            });
        });
    }
  }

  borrow() {
    if (this.rbUserAmountControl.value <= this.creditLimitInfo.availableCredit) {
      const inWei = parseUnits(this.rbUserAmountControl.value.toString()).toString();
      if (this.rbContractTitle.toLowerCase() !== 'bnb') {
        this.borrowToken(inWei);
      }
      else {
        this.borrowBnb(inWei);
      }
    }
    else {
      this.modalService.open('Desired amount exceeding credit limit!', {
        width: '450px',
        height: '60px'
      }, {});
    }
  }

  private borrowToken(inWei) {
    this.spinner.show();
    combineLatest([
      this.contractService.getContract('CONTROLLER'),
      this.contractService.getContract(this.rbContractTitle),
    ]).subscribe(([controllerContract, contract]) => {
      controllerContract.instance.borrow(contract.address, inWei)
        .then(resp => {
          return resp.wait(1);
        })
        .then((resp) => {
          this.balanceService.notifyInBalanceChange([this.rbContractTitle]);
          this.modalService.open('Success!', {
            width: '200px',
            height: '60px'
          }, {});
        })
        .catch(error => {
          this.modalService.open('Borrow error', {
            width: '250px',
            height: '60px'
          }, {});
        })
        .finally(() => {
          this.spinner.hide();
          this.modalRef.close();
        });
    })
  }

  private borrowBnb(inWei) {
    this.spinner.show();
    combineLatest([
      this.contractService.getContract('CONTROLLER'),
      this.eth.signer.getAddress(),
    ]).subscribe(([controllerContract, bnbAddress]) => {
      controllerContract.instance.borrow(bnbAddress, inWei)
        .then(resp => {
          return resp.wait(1);
        })
        .then((resp) => {
          this.balanceService.notifyInBalanceChange([this.rbContractTitle]);
          this.modalService.open('Success!', {
            width: '200px',
            height: '60px'
          }, {});
        })
        .catch(error => {
          this.modalService.open('Borrow error', {
            width: '250px',
            height: '60px'
          }, {});
        })
        .finally(() => {
          this.spinner.hide();
          this.modalRef.close();
        });
    })
  }

  repayBorrow() {
    if (this.rbUserAmountControl.value <= (this.creditLimitInfo.borrowLimit - this.creditLimitInfo.availableCredit)) {
      this.spinner.show();
      const inWei = parseUnits(this.rbUserAmountControl.value.toString());
      this.contractService.getContract('CONTROLLER').subscribe(controllerContract => {
        this.currentContract.instance.approve(controllerContract.address, inWei)
          .then((t: any) => {
            return t.wait(1);
          })
          .then(() => {
            return controllerContract.instance.repayBorrow(this.currentContract.address, inWei);
          })
          .then((t: any) => {
            return t.wait(1);
          })
          .then(response => {
            console.log('repayBorrow', response);
            this.balanceService.notifyInBalanceChange([this.rbContractTitle]);
            this.modalService.open('Success!', {
              width: '200px',
              height: '60px'
            }, {});
          })
          .catch(error => {
            console.log('repayBorrow_____ERROR', error);
          })
          .finally(() => {
            this.spinner.hide();
            this.modalRef.close();
          });
      })
    }
    else {
      this.modalService.open('Debt less repayment!', {
        width: '350px',
        height: '60px'
      }, {});
    }
  }

  getContractDetails(contractTitle): Observable<any> {
    return this.contractService.getContractDetailInfo(contractTitle);
  }

  safeMax() {
    if (this.rbSwitch === 0) {
      this.rbUserAmountControl.setValue(this.creditLimitInfo.borrowLimit);
    }
    else if (this.rbSwitch === 1) {

    }
  }
}
