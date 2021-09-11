import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChipJarPageComponent } from './chip-jar-page.component';

describe('ChipJarPageComponent', () => {
  let component: ChipJarPageComponent;
  let fixture: ComponentFixture<ChipJarPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChipJarPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChipJarPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
