import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLoans } from './admin-loans';

describe('AdminLoans', () => {
  let component: AdminLoans;
  let fixture: ComponentFixture<AdminLoans>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLoans]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLoans);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
