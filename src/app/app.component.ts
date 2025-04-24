import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { ReminderCheckService } from './services/reminder-check.service';
import { ReminderNotificationModalComponent } from './shared/components/reminder-notification-modal/reminder-notification-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    HeaderComponent,
    ReminderNotificationModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'JobTracker';
  
  constructor(public reminderCheckService: ReminderCheckService) {}
  
  ngOnInit() {
    this.reminderCheckService.startChecking();
  }
  
  closeReminderNotification() {
    this.reminderCheckService.dismissCurrentReminder();
  }
  
  markReminderComplete(id: string) {
    this.reminderCheckService.markReminderComplete(id);
  }
  
  snoozeReminder(data: { id: string, minutes: number }) {
    this.reminderCheckService.snoozeReminder(data.id, data.minutes);
  }
}