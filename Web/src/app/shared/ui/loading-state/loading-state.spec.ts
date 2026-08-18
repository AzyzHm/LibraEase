import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingState } from './loading-state';

describe('LoadingState', () => {
  let component: LoadingState;
  let fixture: ComponentFixture<LoadingState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingState]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingState);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
