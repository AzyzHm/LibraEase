import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelfCheckoutModal } from './self-checkout-modal';

describe('SelfCheckoutModal', () => {
  let component: SelfCheckoutModal;
  let fixture: ComponentFixture<SelfCheckoutModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelfCheckoutModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelfCheckoutModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
