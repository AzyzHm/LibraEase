import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBooks } from './admin-books';

describe('AdminBooks', () => {
  let component: AdminBooks;
  let fixture: ComponentFixture<AdminBooks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBooks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminBooks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
