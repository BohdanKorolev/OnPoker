import {HostListener, Injectable, TemplateRef} from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({ providedIn: 'root' })
export class SettingProjects {
  public resizeIsDesktop = new BehaviorSubject<boolean>(true);
  public resizeIsTablet = new BehaviorSubject<boolean>(false);
  public resizeIsMobile = new BehaviorSubject<boolean>(false);
  public isOpenAside = new BehaviorSubject<boolean>(false);

  constructor() {

  }


}
