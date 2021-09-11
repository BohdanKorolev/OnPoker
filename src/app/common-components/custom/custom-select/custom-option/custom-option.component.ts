import {AfterContentInit, Component, ContentChild, ElementRef,EventEmitter, OnInit, Output} from '@angular/core';
import {CustomTextDirective} from "./text-directive/custom-text.directive";
import {CustomImageDirective} from "./image-directive/custom-image.directive";

@Component({
  selector: 'app-custom-option',
  templateUrl: './custom-option.component.html',
  styleUrls: ['./custom-option.component.scss']
})
export class CustomOptionComponent implements OnInit, AfterContentInit {
  @ContentChild(CustomTextDirective, {read: ElementRef}) text!: ElementRef<any>;
  @ContentChild(CustomImageDirective, {read: ElementRef}) image!: ElementRef<any>;

  @Output() onItemSelect = new EventEmitter();
  @Output() onLoad = new EventEmitter();
  constructor() { }

  ngOnInit(): void {
    setTimeout(() => {
      this.onLoad.emit({text: this.text, image: this.image});
    }, 150);
  }

  ngAfterContentInit() {


  }

  onClick() {
    this.onItemSelect.emit({text: this.text, image: this.image});
  }

}
