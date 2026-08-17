import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminShell } from './admin-shell';

describe('AdminShell', () => {
  let component: AdminShell;
  let fixture: ComponentFixture<AdminShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
