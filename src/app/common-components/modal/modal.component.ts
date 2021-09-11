import {Component, OnInit, TemplateRef, Type} from '@angular/core';
import {ModalRef} from "../../shared/services/modal/modal-ref";

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {
  contentType?: 'template' | 'string' | 'component';
  content?: string | TemplateRef<any> | Type<any>;
  context?: any;
  componentStyles: {[key: string]: any} = {};
  constructor(public ref: ModalRef) {

    Object.entries(ref.options).forEach(([key, value]) => {
      if (value) {
        this.componentStyles[key] = value;
      }
    })

  }

  close() {
    this.ref.close(null);
  }

  ngOnInit() {
    this.content = this.ref.content;

    if (typeof this.content === 'string') {
      this.contentType = 'string';
    } else if (this.content instanceof TemplateRef) {
      this.contentType = 'template';
      this.context = {
        close: () => this.ref.close(),
        data: this.ref.data
      };
    } else {
      this.contentType = 'component';
    }
  }
}
