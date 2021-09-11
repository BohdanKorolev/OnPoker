import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayPageComponent } from "./page-components/play-page/play-page.component";
import { CashierPageComponent } from "./page-components/cashier-page/cashier-page.component";
import { MintRepayPageComponent } from "./page-components/mint-repay-page/mint-repay-page.component";
import { ChipJarPageComponent } from "./page-components/chip-jar-page/chip-jar-page.component";
import { InpMarketPageComponent } from "./page-components/inp-market-page/inp-market-page.component";
import { LoginPageComponent } from './page-components/login-page/login-page.component';
import { AuthGuardService as AuthGuard } from './shared/services/auth-guard.service';
import { MetamaskCheckedGuard } from "./shared/services/metamask-checked.guard";

const routes: Routes = [
  {
    path: '',
    component: PlayPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'cashier',
    component: CashierPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'mint-repay',
    component: MintRepayPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'chip-jar',
    component: ChipJarPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'inp-market',
    component: InpMarketPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [MetamaskCheckedGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
