import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryCard } from './library-card';

describe('LibraryCard', () => {
  let component: LibraryCard;
  let fixture: ComponentFixture<LibraryCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibraryCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
