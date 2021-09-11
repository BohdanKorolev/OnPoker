import {Component, HostListener, OnInit} from '@angular/core';
import {SettingProjects} from "../interfase-setting";
import {UserService} from "../../shared/services/user.service";
import {NgxSpinnerService} from "ngx-spinner";
import {map} from "rxjs/operators";
import {ModalService} from "../../shared/services/modal/modal.service";
import {EthereumService} from "../../shared/services/ethereum.service";

@Component({
  selector: 'app-aside',
  templateUrl: './aside.component.html',
  styleUrls: ['./aside.component.scss']
})
export class AsideComponent implements OnInit {
  public isTable:boolean = false;
  public isDesktop:boolean = true;
  public isMobile:boolean = false;
  public isOpenAside:boolean = false;

  gameUrl = '';

  constructor(
    private settingProjects: SettingProjects,
    private userService: UserService,
    private spinner: NgxSpinnerService,
    private modalService: ModalService,
    private ethereumService: EthereumService
  ) {
  }

  ngOnInit(): void {
    this.onSettingProjects()
  }

  onSettingProjects() {
    this.settingProjects.isOpenAside.subscribe(a => this.isOpenAside = a)
    this.settingProjects.resizeIsTablet.subscribe(a => this.isTable = a)
    this.settingProjects.resizeIsDesktop.subscribe(a => this.isDesktop = a)
    this.settingProjects.resizeIsMobile.subscribe(a => this.isMobile = a)
  }

  onAside() {
    this.settingProjects.isOpenAside.next(!this.isOpenAside)
  }
  onMenuClose() {
    this.settingProjects.isOpenAside.next(false)
  }

  redirectToGame() {
    if (this.ethereumService.currentState === 5) {
      this.spinner.show();
      this.settingProjects.isOpenAside.next(false)
      this.userService.getGameUrl()
        .subscribe((resp) => {
          if (resp.data) {
            window.open(resp, '_blank');
            this.spinner.hide();
          }
          else if (resp.description) {
            this.spinner.hide();
            // this.showMessage(resp.description, '300px', '60px');
            window.open('https://play.inpoker.io/', '_blank');
          }
        })
    }
    }

  private showMessage(message, windowWidth = 'auto', windowHeight = 'auto') {
    this.spinner.hide();
    this.modalService.open(message, {
      width: windowWidth,
      height: windowHeight
    }, {});
  }

  @HostListener('document:click', ['$event.target'])
  onClickReport(targetElement: any) {
    if (targetElement.closest('aside') == null && targetElement.closest('.burger-menu') == null && this.settingProjects.isOpenAside.getValue()) {
      this.settingProjects.isOpenAside.next(false)
    }
  }
}
