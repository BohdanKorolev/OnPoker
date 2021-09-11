import {Component, HostListener, NgZone, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import {SettingProjects} from "./common-components/interfase-setting";
import { EthereumService, MetamaskState } from './shared/services/ethereum.service';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'inPoker';

  public metamaskState = 0;

  constructor(
    private settingProjects: SettingProjects,
    ethereumService: EthereumService,
    router: Router,
    ngZone: NgZone
  ) {
    ethereumService.metamaskStateObservable.subscribe(r => {
      this.metamaskState = r;
      ngZone.run(() => {
        if (r === MetamaskState.NOT_CHECKED) router.navigate(['/login'])
        if (r === MetamaskState.NO_METAMASK) router.navigate(['/login'])
        if (r === MetamaskState.NOT_CONNECTED) router.navigate(['/login'])
        if (r === MetamaskState.INCORRECT_NETWORK) router.navigate(['/login'])
        if (r === MetamaskState.NO_ACCOUNT) router.navigate(['/login'])
        if (r === MetamaskState.CONNECTED) router.navigate(['/cashier'])
      })
    });
  }

  ngOnInit(): void {
    this.settingProjects.resizeIsDesktop.next(window.innerWidth > 1024);
    this.settingProjects.resizeIsTablet.next(window.innerWidth <= 1024 && window.innerWidth >= 768);
    this.settingProjects.resizeIsMobile.next(window.innerWidth < 768);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.settingProjects.resizeIsDesktop.next(window.innerWidth > 1024);
    this.settingProjects.resizeIsTablet.next(event.target.innerWidth <= 1024 && event.target.innerWidth >= 768);
    this.settingProjects.resizeIsMobile.next(event.target.innerWidth < 768);
  }
}
