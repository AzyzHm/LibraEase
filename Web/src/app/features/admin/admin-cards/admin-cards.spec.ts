import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCards } from './admin-cards';

describe('AdminCards', () => {
  let component: AdminCards;
  let fixture: ComponentFixture<AdminCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
