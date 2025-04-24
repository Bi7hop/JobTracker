import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { JobApplicationService } from './job-application.service';
import { FollowUpReminder, Application } from '../models/job-tracker.models';

@Injectable({
  providedIn: 'root'
})
export class ReminderCheckService {
  private checkIntervalInSeconds = 60; 
  
  private dueReminderSubject = new BehaviorSubject<(FollowUpReminder & { application?: Application }) | null>(null);
  public dueReminder$ = this.dueReminderSubject.asObservable();
  
  private checkSubscription: Subscription | null = null;

  constructor(private jobAppService: JobApplicationService) { }

  startChecking(): void {
    if (this.checkSubscription) {
      this.checkSubscription.unsubscribe();
    }
    
    this.checkSubscription = interval(this.checkIntervalInSeconds * 1000).pipe(
      switchMap(() => this.checkForDueReminders())
    ).subscribe();
    
    this.checkForDueReminders().subscribe();
  }

  stopChecking(): void {
    if (this.checkSubscription) {
      this.checkSubscription.unsubscribe();
      this.checkSubscription = null;
    }
  }

  private checkForDueReminders(): Observable<(FollowUpReminder & { application?: Application })[]> {
    return this.jobAppService.getDueReminders().pipe(
      tap(dueReminders => {
        if (dueReminders.length > 0) {
          const nextDueReminder = dueReminders[0];
          this.dueReminderSubject.next(nextDueReminder);
          
          this.jobAppService.markReminderNotificationShown(nextDueReminder.id).subscribe();
        }
      })
    );
  }

  dismissCurrentReminder(): void {
    this.dueReminderSubject.next(null);
  }

  markReminderComplete(id: string): void {
    this.jobAppService.toggleReminderCompletion(id).subscribe(() => {
      this.dismissCurrentReminder();
    });
  }

  snoozeReminder(id: string, minutes: number): void {
    this.jobAppService.updateReminderDate(id, minutes).subscribe(() => {
      this.dismissCurrentReminder();
    });
  }

  setCheckInterval(seconds: number): void {
    this.checkIntervalInSeconds = seconds;
    if (this.checkSubscription) {
      this.startChecking();
    }
  }
}