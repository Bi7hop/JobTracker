import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobApplicationService } from '../../services/job-application.service';
import { NotificationService } from '../../shared/services/notification.service';
import { FollowUpReminder, Application } from '../../models/job-tracker.models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './reminders.component.html',
  styleUrl: './reminders.component.scss'
})
export class RemindersComponent implements OnInit {
  reminders$!: Observable<(FollowUpReminder & { application?: Application })[]>;
  filterStatus: 'all' | 'pending' | 'completed' = 'all';

  constructor(
    private jobAppService: JobApplicationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadReminders();
  }

  loadReminders(): void {
    this.reminders$ = this.jobAppService.getAllReminders();
  }

  toggleReminderCompletion(id: string): void {
    this.jobAppService.toggleReminderCompletion(id).subscribe({
      next: () => this.notificationService.showSuccess('Erinnerungsstatus geändert'),
      error: (err) => {
        console.error(err);
        this.notificationService.showError('Fehler beim Ändern des Erinnerungsstatus');
      }
    });
  }

  setFilter(filter: 'all' | 'pending' | 'completed'): void {
    this.filterStatus = filter;
  }

  isOverdue(date: Date): boolean {
    return new Date(date) < new Date();
  }

  getRelativeTimeString(date: Date): string {
    const now = new Date();
    const reminderDate = new Date(date);
    const diffTime = reminderDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'Tag' : 'Tage'} überfällig`;
    } else if (diffDays === 0) {
      return 'Heute fällig';
    } else if (diffDays === 1) {
      return 'Morgen fällig';
    } else {
      return `In ${diffDays} Tagen fällig`;
    }
  }

  getPriorityClass(date: Date, isCompleted: boolean): string {
    if (isCompleted) return 'bg-green-900 text-green-400';
    
    const now = new Date();
    const reminderDate = new Date(date);
    const diffTime = reminderDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-900 text-red-400';
    if (diffDays === 0) return 'bg-orange-900 text-orange-400';
    if (diffDays <= 2) return 'bg-yellow-900 text-yellow-400';
    return 'bg-blue-900 text-blue-400';
  }
}