import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashierPageComponent } from './cashier-page.component';

describe('CashierPageComponent', () => {
  let component: CashierPageComponent;
  let fixture: ComponentFixture<CashierPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CashierPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CashierPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
