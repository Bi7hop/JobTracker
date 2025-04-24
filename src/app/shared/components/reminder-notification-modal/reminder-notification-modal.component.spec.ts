import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReminderNotificationModalComponent } from './reminder-notification-modal.component';

describe('ReminderNotificationModalComponent', () => {
  let component: ReminderNotificationModalComponent;
  let fixture: ComponentFixture<ReminderNotificationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReminderNotificationModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReminderNotificationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
