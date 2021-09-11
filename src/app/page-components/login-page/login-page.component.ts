import { Component, OnInit } from '@angular/core';
import { EthereumService } from '../../shared/services/ethereum.service';
import {NgxSpinnerService} from "ngx-spinner";
import {ModalService} from "../../shared/services/modal/modal.service";

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {

  constructor(
    private ethereumService: EthereumService,
    private spinner: NgxSpinnerService,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {
    this.checkMetamaskUserState();
  }

  loginToInpoker() {
    this.ethereumService.connectAccount()
  }

  private checkMetamaskUserState() {
    if(this.ethereumService.currentState !== 5) {
      this.ethereumService.connectAccount()
    }
    else {
      this.ethereumService.metamaskStateObservable
        .subscribe(() => {
          this.checkMetamaskUserState()
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

}
