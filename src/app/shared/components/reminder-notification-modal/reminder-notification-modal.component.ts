import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FollowUpReminder, Application } from '../../../models/job-tracker.models';

@Component({
  selector: 'app-reminder-notification-modal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reminder-notification-modal.component.html',
  styleUrls: ['./reminder-notification-modal.component.scss']
})
export class ReminderNotificationModalComponent {
  @Input() reminder!: FollowUpReminder & { application?: Application };
  @Output() close = new EventEmitter<void>();
  @Output() markComplete = new EventEmitter<string>();
  @Output() snooze = new EventEmitter<{ id: string, minutes: number }>();

  onClose(): void {
    this.close.emit();
  }

  onMarkComplete(): void {
    this.markComplete.emit(this.reminder.id);
  }

  onSnooze(minutes: number): void {
    this.snooze.emit({ id: this.reminder.id, minutes });
  }
}