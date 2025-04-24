import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobApplicationService } from '../../../services/job-application.service';
import { NotificationService } from '../../services/notification.service';
import { FollowUpReminder, Application } from '../../../models/job-tracker.models';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-reminders-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reminders-widget.component.html',
  styleUrl: './reminders-widget.component.scss'
})
export class RemindersWidgetComponent implements OnInit {
  upcomingReminders$!: Observable<(FollowUpReminder & { application?: Application })[]>;
  
  constructor(
    private jobAppService: JobApplicationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUpcomingReminders();
  }

  loadUpcomingReminders(): void {
    this.upcomingReminders$ = this.jobAppService.getAllReminders().pipe(
      map(reminders => {
        return reminders
          .filter(reminder => !reminder.isCompleted) 
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
          .slice(0, 5); 
      })
    );
  }

  toggleReminderCompletion(id: string): void {
    this.jobAppService.toggleReminderCompletion(id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Erinnerungsstatus geändert');
        this.loadUpcomingReminders(); 
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showError('Fehler beim Ändern des Erinnerungsstatus');
      }
    });
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

  getPriorityClass(date: Date): string {
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