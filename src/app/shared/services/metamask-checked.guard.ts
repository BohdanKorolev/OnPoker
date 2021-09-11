import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {EthereumService, MetamaskState} from "./ethereum.service";
import {filter, map, take} from "rxjs/operators";
import {isPlatformBrowser} from "@angular/common";

@Injectable({
  providedIn: 'root'
})
export class MetamaskCheckedGuard implements CanActivate {
  constructor(private eth: EthereumService, @Inject(PLATFORM_ID) private platform: Object) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!isPlatformBrowser(this.platform)) {
      return true;
    }
    if (this.eth.currentState !== MetamaskState.NOT_CHECKED) {
      return true;
    }

    return this.eth.metamaskStateObservable.pipe(
      filter(s => s != MetamaskState.NOT_CHECKED),
      take(1),
      map(() => true)
    );
  }

}
