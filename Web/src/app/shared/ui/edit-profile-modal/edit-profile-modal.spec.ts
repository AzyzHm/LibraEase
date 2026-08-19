import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProfileModal } from './edit-profile-modal';

describe('EditProfileModal', () => {
  let component: EditProfileModal;
  let fixture: ComponentFixture<EditProfileModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProfileModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProfileModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
