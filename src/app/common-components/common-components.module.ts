import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { AsideComponent } from './aside/aside.component';
import {RouterModule} from "@angular/router";
import { ModalComponent } from './modal/modal.component';
import { CustomSelectComponent } from './custom/custom-select/custom-select.component';
import { CustomOptionComponent } from './custom/custom-select/custom-option/custom-option.component';
import {CustomImageDirective} from "./custom/custom-select/custom-option/image-directive/custom-image.directive";
import {CustomTextDirective} from "./custom/custom-select/custom-option/text-directive/custom-text.directive";
import { DepositModalComponent } from './header/deposit-modal/deposit-modal.component';
import {ReactiveFormsModule} from "@angular/forms";
import { LoginModalComponent } from './header/login-modal/login-modal.component';



@NgModule({
  declarations: [
    HeaderComponent,
    AsideComponent,
    ModalComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CustomImageDirective,
    CustomTextDirective,
    DepositModalComponent,
    LoginModalComponent
  ],
  exports: [
    HeaderComponent,
    AsideComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CustomImageDirective,
    CustomTextDirective
  ],
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule
    ]
})
export class CommonComponentsModule { }
