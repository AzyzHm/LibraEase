import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Catalog } from './catalog';

describe('Catalog', () => {
  let component: Catalog;
  let fixture: ComponentFixture<Catalog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Catalog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Catalog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
