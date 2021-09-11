import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SbModalComponent } from './sb-modal.component';

describe('SbModalComponent', () => {
  let component: SbModalComponent;
  let fixture: ComponentFixture<SbModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SbModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SbModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
