import {Component, OnInit} from '@angular/core';
import {LiquidationService} from "../../shared/services/liquidation.service";
import {combineLatest} from "rxjs";
import {NgxSpinnerService} from "ngx-spinner";
import {ModalService} from "../../shared/services/modal/modal.service";
import {ContractInfo, ContractsService} from "../../shared/services/contracts.service";
import {EthereumService} from "../../shared/services/ethereum.service";
import {BalanceService} from "../../shared/services/balance.service";
import {RewardService} from "../../shared/services/reward.service";
import {environment} from "../../../environments/environment";
import {formatUnits} from "ethers/lib/utils";

interface MarketInfo {
  "totalInp": string,
  "totalBnb": string,
  "totalBusd": string,
  "totalSupply": string,
  "totalMinted": string,
  "totalLiquidity": string,
  totalInpWei: string,
  totalBnbWei: string,
  totalBusdWei: string,
  totalInpReward: string,
  totalBnbReward: string,
  totalBusdReward: string
}

@Component({
  selector: 'app-inp-market-page',
  templateUrl: './inp-market-page.component.html',
  styleUrls: ['./inp-market-page.component.scss']
})
export class InpMarketPageComponent implements OnInit {

  private _controllerContract: ContractInfo;

  liquidationsList;
  marketInfo: MarketInfo = {
    totalInp: '',
    totalBnb: '',
    totalBusd: '',
    totalSupply: '',
    totalMinted: '',
    totalLiquidity: '',
    totalInpWei: '',
    totalBnbWei: '',
    totalBusdWei: '',
    totalInpReward: '',
    totalBnbReward: '',
    totalBusdReward: ''
  }

  constructor(
    private liquidationService: LiquidationService,
    private spinner: NgxSpinnerService,
    private modalService: ModalService,
    private contractsService: ContractsService,
    private eth: EthereumService
  ) {
  }

  ngOnInit(): void {
    this.spinner.show();
    combineLatest([
      this.liquidationService.getLiquidationList(),
      this.contractsService.getContract('CONTROLLER'),
      this.contractsService.getMarketInfo()
    ])
      .subscribe(([liquidationsList, controllerContract, marketInfo]) => {
        this.liquidationsList = liquidationsList;
        this._controllerContract = controllerContract;
        this.marketInfo = marketInfo;
        this.spinner.hide();
      })
  }

  liquidate(liquidation) {
    this.spinner.show();
    this.liquidationService.getLiquidationSign(liquidation)
      .then((sign: any) => {
        return this._controllerContract.instance.liquidate(
          sign.inToken,
          sign.inAmount.toString(),
          sign.account,
          sign.chipAmount.toString(),
          sign.reward.toString(),
          sign.nonce,
          sign.v,
          sign.r,
          sign.s);
      })
      .then(t => {
        return this.eth.transactionWait(t);
      })
      .then((resp) => {
        console.log('Liquidation approved by blockchain', resp);
        this.spinner.hide();
        this.modalService.open('Success!', {
          width: '200px',
          height: '60px'
        }, {});
        this.updateLiquidationList();
      })
  }

  updateLiquidationList() {
    this.liquidationService.getLiquidationList()
      .subscribe(liquidationsList => {
        this.liquidationsList = liquidationsList;
      })
  }
}
