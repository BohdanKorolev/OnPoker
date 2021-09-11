import {
  AfterViewInit,
  Component,
  ContentChildren, forwardRef,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {CustomOptionComponent} from "./custom-option/custom-option.component";
import {NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
  selector: 'app-custom-select',
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CustomSelectComponent),
    multi: true
  }]
})
export class CustomSelectComponent implements AfterViewInit {
  @Input() disabled = false;

  @HostBinding('style.opacity')
  get opacity() {
    return this.disabled ? 0.25 : 1;
  }

  // /Form control interface implementing

  @Input() styles: any;

  opened: boolean = false;
  text: any;
  @Input() image: any;

  @ContentChildren(CustomOptionComponent) options: any;

  @ViewChild('select') select: any;
  @ViewChild('img1') img1: any;
  @ViewChild('img2') img2: any;
  @ViewChild('p') p: any;

  optionsList: any[] = [];

  @HostListener('window:click', ['$event.target'])
  onClick(btn: any) {
    if(this.img1 && this.img2 && this.p) {
      if (btn !== this.select.nativeElement && btn !== this.img1.nativeElement && btn !== this.img2.nativeElement && btn !== this.p.nativeElement) {
        this.opened = false;
      } else {
        this.opened = true;
      }
    }
  }

  constructor() { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.options._results.forEach((el: any) => {
        el.onLoad.subscribe((value: any) => {
          this.optionsList.push(value);
          this.onTouched();
          const text = value.text.nativeElement.innerHTML;
          const image = value.image.nativeElement.currentSrc;
          if (this.text === text) {
            this.image = image;
            this.onChange(this.text);
          }
        })
        el.onItemSelect.subscribe((value: any) => {
          this.onTouched();
          if (!this.disabled) {
            this.text = value.text ? value.text.nativeElement.innerHTML : null;
            this.image = value.image ? value.image.nativeElement.currentSrc : null;
            this.opened = false;

            this.onChange(this.text);
          }
        });
      });
    }, 0);
  }
  onHeaderClick() {
    if (!this.disabled) {
      this.opened = !this.opened;
    }
  }

  //Form control interface implementing
  onChange = (value: string) => {
  }

  onTouched = () => {
  }
  writeValue(value: string): void {
    this.text = value;
    this.optionsList.forEach((el: any) => {
      if (el.text.nativeElement.innerHTML === value) {
        this.image = el.image.nativeElement.currentSrc;
      }
    });
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

}
