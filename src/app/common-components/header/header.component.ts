import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {SettingProjects} from "../interfase-setting";
import {ContractsService} from "../../shared/services/contracts.service";
import {EthereumService} from "../../shared/services/ethereum.service";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {combineLatest} from "rxjs";
import {BalanceService} from "../../shared/services/balance.service";
import {DepositModalComponent} from "./deposit-modal/deposit-modal.component";
import {UserService} from "../../shared/services/user.service";
import {ModalService} from "../../shared/services/modal/modal.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @ViewChild('depositModal') depositModal: DepositModalComponent;
  isMobile = false
  APYs: { [key: string]: number } = {}
  loggedIn = true;
  userData = {
    inpPriceCurrency: '0',
    chipPriceCurrency: '0',
    userAvatar: '',
    login: ''
  };

  constructor(
    private settingProjects: SettingProjects,
    private contractService: ContractsService,
    private eth: EthereumService,
    private balanceService: BalanceService,
    private userService: UserService,
    private modalService: ModalService
  ) {
  }

  ngOnInit(): void {
    this.settingProjects.resizeIsMobile.subscribe(a => this.isMobile = a);
    this.updateGameBalance();
  }

  updateGameBalance() {
    this.userService.getUserGameInfo()
      .subscribe(
        (userData) => {
          if (userData.inPoker) {
            this.userData.inpPriceCurrency = formatUnits(userData.inpAmount.toString());
            this.userData.chipPriceCurrency = formatUnits(userData.chipAmount.toString());
            this.userData.userAvatar = userData.avatarUrl;
            this.userData.login = userData.login
            this.loggedIn = true;
          } else {
            this.loggedIn = false;
          }
        }
      );
  }

  onAside() {
    this.settingProjects.isOpenAside.next(true)
  }

  onLogin(gameUrl) {
    if (gameUrl) {
      this.loggedIn = true;
      this.modalService.open('Login success!', {
        width: '200px',
        height: '60px'
      }, {});
    } else {
      this.modalService.open('Login failed!', {
        width: '200px',
        height: '60px'
      }, {});
    }
  }


}
