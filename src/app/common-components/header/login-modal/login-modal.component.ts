import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {combineLatest} from "rxjs";
import {formatUnits} from "ethers/lib/utils";
import {ModalService} from "../../../shared/services/modal/modal.service";
import {ContractInfo, ContractsService} from "../../../shared/services/contracts.service";
import {EthereumService} from "../../../shared/services/ethereum.service";
import {NgxSpinnerService} from "ngx-spinner";
import {BalanceService, CreditLimitInfo} from "../../../shared/services/balance.service";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {ModalRef} from "../../../shared/services/modal/modal-ref";
import {UserService} from "../../../shared/services/user.service";

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss']
})
export class LoginModalComponent implements OnInit {
  @ViewChild('sbModalTemplate') template?: TemplateRef<any>;
  modalRef?: ModalRef;
  loginForm: FormGroup;

  @Output() onLogin: EventEmitter<any>;

  constructor(
    private modalService: ModalService,
    private contractService: ContractsService,
    private eth: EthereumService,
    private spinner: NgxSpinnerService,
    private formBuilder: FormBuilder,
    private userService: UserService
  ) {
    this._createForm();
    this.onLogin = new EventEmitter<any>();
  }

  ngOnInit(): void {
  }

  private _createForm() {
    this.loginForm = this.formBuilder.group({
      userLogin: ['', [Validators.required]],
      userPassword: [
        '',
        [
          Validators.required,
          Validators.pattern(/.{8,}/),
        ],
      ],
    })
  }

  show(): void {
    this.spinner.show();
    this.spinner.hide();
    this.modalRef = this.modalService.open(
      this.template as TemplateRef<any>,
      {
        dlgClass: 'full-width-modal'
      },
      {}
    )
  }

  login() {
    this.userService.getGameUrl(this._login.value, this._password.value)
      .subscribe(data => {
        this.onLogin.emit(data);
        this.modalRef.close();
      })
  }

  get _login() {
    return this.loginForm.get('userLogin')
  }

  get _password() {
    return this.loginForm.get('userPassword')
  }
}
