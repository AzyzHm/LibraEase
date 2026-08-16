import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComingSoon } from './coming-soon';

describe('ComingSoon', () => {
  let component: ComingSoon;
  let fixture: ComponentFixture<ComingSoon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComingSoon],
    }).compileComponents();

    fixture = TestBed.createComponent(ComingSoon);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
