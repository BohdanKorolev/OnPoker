import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, Injector, TemplateRef, Type } from '@angular/core';
import {ModalOptions, ModalRef} from "./modal-ref";
import {ModalComponent} from "../../../common-components/modal/modal.component";

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  constructor(private overlay: Overlay, private injector: Injector) {}

  open<R = any, T = any>(
    content: string | TemplateRef<any> | Type<any>,
    options: ModalOptions,
    data: T
  ): ModalRef<R> {
    const configs = new OverlayConfig({
      hasBackdrop: true,
      panelClass: ['modal', 'is-active'],
      backdropClass: 'modal-background',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically()
    });

    const overlayRef = this.overlay.create(configs);

    const myOverlayRef = new ModalRef<R, T>(overlayRef, content, options, data);

    const injector = this.createInjector(myOverlayRef, this.injector);
    overlayRef.attach(new ComponentPortal(ModalComponent, null, injector));

    return myOverlayRef;
  }

  createInjector(ref: ModalRef, inj: Injector) {
    return Injector.create({
      providers: [
        {
          provide: ModalRef,
          useValue: ref
        }
      ]
    })
  }
}
