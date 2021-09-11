import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InpMarketPageComponent } from './inp-market-page.component';

describe('InpMarketPageComponent', () => {
  let component: InpMarketPageComponent;
  let fixture: ComponentFixture<InpMarketPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InpMarketPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InpMarketPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
