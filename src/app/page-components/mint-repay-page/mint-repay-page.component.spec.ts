import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MintRepayPageComponent } from './mint-repay-page.component';

describe('MintRepayPageComponent', () => {
  let component: MintRepayPageComponent;
  let fixture: ComponentFixture<MintRepayPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MintRepayPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MintRepayPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
