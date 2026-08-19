import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookDetailModal } from './book-detail-modal';

describe('BookDetailModal', () => {
  let component: BookDetailModal;
  let fixture: ComponentFixture<BookDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookDetailModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
