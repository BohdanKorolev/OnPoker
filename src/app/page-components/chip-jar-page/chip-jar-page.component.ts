import {Component, OnInit} from '@angular/core';
import {ContractInfo, ContractsService} from "../../shared/services/contracts.service";
import {EthereumService} from "../../shared/services/ethereum.service";
import {FormControl, Validators} from "@angular/forms";
import {BalanceService, CreditLimitInfo, CreditPortfolioInfo} from "../../shared/services/balance.service";
import {NgxSpinnerService} from "ngx-spinner";
import {ModalService} from "../../shared/services/modal/modal.service";
import {combineLatest} from "rxjs";
import {map, switchMap} from "rxjs/operators";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {RewardService} from "../../shared/services/reward.service";
import {environment} from "../../../environments/environment";

interface ChipJarPanel {
  "totalEmission": string,
  "totalChipStaked": string,
  "chipStakingApy": string,
  "chipJarRewardPool": string
}

@Component({
  selector: 'app-chip-jar-page',
  templateUrl: './chip-jar-page.component.html',
  styleUrls: ['./chip-jar-page.component.scss']
})

export class ChipJarPageComponent implements OnInit {

  private _walletAddress: any;
  private _contractsArray = [];
  private _chipContract: ContractInfo;
  private _controllerContract: ContractInfo;

  stakeInput: FormControl;
  withdrawInput: FormControl;
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
  panel: ChipJarPanel = {
    totalEmission: '',
    totalChipStaked: '',
    chipStakingApy: '',
    chipJarRewardPool: '',
  }
  inpBalance;
  inpReward;
  chipStaked;
  chipBalance;
  mintedChip = '';

  constructor(
    private spinner: NgxSpinnerService,
    private modalService: ModalService,
    private contractsService: ContractsService,
    private eth: EthereumService,
    private balanceService: BalanceService,
    private rewardService: RewardService
  ) {
    this.stakeInput = new FormControl('', [
      Validators.pattern(/^\d+\,?\.?\d{0,6}$/gm)
    ]);
    this.withdrawInput = new FormControl('', [
      Validators.pattern(/^\d+\,?\.?\d{0,6}$/gm)
    ]);
  }

  ngOnInit(): void {
    this.spinner.show();
    combineLatest([
      this.eth.signer.getAddress(),
      this.contractsService.getContract('CONTROLLER'),
      this.contractsService.getContract('CHIP'),
      this.contractsService.getTokenNames(),
      this.rewardService.getRewardInfo()
    ])
      .pipe(
        switchMap(([walletAddress, controllerContract, chipContract, tokenNames, panelInfo]) => {
          this._walletAddress = walletAddress;
          this._chipContract = chipContract;
          this._controllerContract = controllerContract;
          this.panel = panelInfo;
          return combineLatest([
            this.contractsService.getCreditPortfolioInfo(this._walletAddress),
            this.balanceService.getBalances(['CHIP', 'INP']),
            this.rewardService.getInpRewardInfo(),
            this._chipContract.instance.userStake(this._walletAddress),
            this.contractsService.getContract('CHIP')
              .pipe(
                switchMap((chipContract) => {
                  return chipContract.instance.userBorrow(walletAddress);
                })
              ),
            this.getContractsArray(tokenNames.filter(t => t !== "CHIP")),
          ]);
        }),
      )
      .pipe(
        switchMap(([creditPortfolioInfo, balances, inpReward, staked, chipBorrow]) => {
          this.mintedChip = chipBorrow.toString();
          this.creditPortfolio = creditPortfolioInfo;
          this.inpReward = inpReward;
          this.chipBalance = formatUnits(balances[0]);
          this.inpBalance = formatUnits(balances[1]);
          this.chipStaked = formatUnits(staked.toString());
          return this.getCreditLimit();
        })
      )
      .subscribe((creditLimitInfo: any) => {
        this.creditLimit = creditLimitInfo;
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

  numberInputValidator(event) {
    if (/^\d*\.?\d{0,6}$/gm.test(event.target.value + event.key)) {
      return true;
    } else if (event.key === 'Backspace') {
      return true;
    } else {
      return false;
    }
  }

  collectReward() {
    this.spinner.show()
    this.rewardService.getInpRewardSign(this.inpReward)
      .pipe(
        switchMap((sign: any) => {
          console.log('sign', sign);
          return this._controllerContract.instance.collectClaim(
            sign.collectAmount,
            sign.nonce,
            sign.v,
            sign.r,
            sign.s);
        })
      )
      .pipe(
        switchMap(t => {
          return this.eth.transactionWait(t)
        })
      )
      .subscribe(() => {
        this.spinner.hide();
        this.updateRewardState();
        this.updateTokensState();
      })
  }

  stakeChip() {
    if (this.stakeInput.value && parseFloat(this.stakeInput.value) > 0) {
      if (parseFloat(this.stakeInput.value) <= parseFloat(this.chipBalance)) {
        this.spinner.show();
        const inWei = parseUnits(this.stakeInput.value.toString()).toString();
        this._chipContract.instance.approve(this._controllerContract.address, inWei)
          .then((t: any) => {
            return this.eth.transactionWait(t);
          })
          .then(resp => {
            console.log('resp', resp);
            return this._controllerContract.instance.stakeChip(inWei);
          })
          .then((t: any) => {
            return this.eth.transactionWait(t);
          })
          .then((resp) => {
            this.updateTokensState();
            this.stakeInput.setValue('');
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
      }
      else {
        this.modalService.open('Limit is exceeded', {
          width: '270px',
          height: '60px'
        }, {});
      }
    }
  }

  withdrawStakedChip() {
    if (this.withdrawInput.value && parseFloat(this.withdrawInput.value) > 0) {
      if (parseFloat(this.withdrawInput.value) <= parseFloat(this.chipStaked)) {
        this.spinner.show();
        const inWei = parseUnits(this.withdrawInput.value.toString()).toString();
        this._controllerContract.instance.withdrawChip(inWei)
          .then((t: any) => {
            return this.eth.transactionWait(t);
          })
          .then((resp) => {
            this.updateTokensState();
            this.withdrawInput.setValue('');
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
      }
      else {
        this.modalService.open('Limit is exceeded', {
          width: '270px',
          height: '60px'
        }, {});
      }
    }
  }

  private updateTokensState() {
    combineLatest([
      this.balanceService.getBalances(['CHIP', 'INP']),
      this.rewardService.getInpRewardInfo(),
      this._chipContract.instance.userStake(this._walletAddress)
    ]).subscribe(([balances, inpReward, staked]) => {
      this.chipBalance = formatUnits(balances[0]);
      this.inpBalance = formatUnits(balances[1]);
      this.inpReward = inpReward;
      this.chipStaked = formatUnits(staked.toString());
    })
  }

  private updateRewardState() {
    this.rewardService.getInpRewardInfo()
      .subscribe(staked => {
        this.chipStaked = staked;
      })
  }

  onStakeMax() {
    this.stakeInput.setValue(this.chipBalance)
  }

  onWithdrawMax() {
    this.withdrawInput.setValue(this.chipStaked);
  }
}
