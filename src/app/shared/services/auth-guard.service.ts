import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {EthereumService, MetamaskState} from './ethereum.service';
import {filter, map, take} from "rxjs/operators";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class AuthGuardService implements CanActivate {

  constructor(public ethereumService: EthereumService, public router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
  {
    if (this.ethereumService.currentState === MetamaskState.NOT_CHECKED) {
      return this.ethereumService.metamaskStateObservable.pipe(
        filter(s => s != MetamaskState.NOT_CHECKED),
        take(1),
        map(
          state => {
            if (state !== MetamaskState.CONNECTED) {
              return this.router.parseUrl("/login")
            }
            return true;
          }
        )
      )
    } else {
      if (this.ethereumService.currentState !== MetamaskState.CONNECTED) {
        return this.router.parseUrl("/login")
      }
      return true;
    }
  }
}
