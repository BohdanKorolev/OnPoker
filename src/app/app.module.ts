import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {CommonComponentsModule} from "./common-components/common-components.module";
import { PlayPageComponent } from './page-components/play-page/play-page.component';
import { CashierPageComponent } from './page-components/cashier-page/cashier-page.component';
import { MintRepayPageComponent } from './page-components/mint-repay-page/mint-repay-page.component';
import { ChipJarPageComponent } from './page-components/chip-jar-page/chip-jar-page.component';
import { InpMarketPageComponent } from './page-components/inp-market-page/inp-market-page.component';
import {OverlayModule} from "@angular/cdk/overlay";
import { SbModalComponent } from './page-components/cashier-page/sb-modal/sb-modal.component';
import { RbModalComponent } from './page-components/cashier-page/rb-modal/rb-modal.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { LoginPageComponent } from './page-components/login-page/login-page.component';
import {HttpClientModule} from "@angular/common/http";
import {NgxSpinnerModule} from "ngx-spinner";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

@NgModule({
  declarations: [
    AppComponent,
    PlayPageComponent,
    CashierPageComponent,
    MintRepayPageComponent,
    ChipJarPageComponent,
    InpMarketPageComponent,
    SbModalComponent,
    RbModalComponent,
    LoginPageComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    CommonComponentsModule,
    OverlayModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
