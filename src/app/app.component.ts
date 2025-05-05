import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { ReminderCheckService } from './services/reminder-check.service';
import { ReminderNotificationModalComponent } from './shared/components/reminder-notification-modal/reminder-notification-modal.component';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

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
  currentRoute: string = '';
  
  constructor(
    public reminderCheckService: ReminderCheckService,
    private router: Router,
    public authService: AuthService
  ) {}
  
  ngOnInit() {
    this.reminderCheckService.startChecking();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
      this.checkRouteAccess();
    });
  }
  
  shouldShowHeader(): boolean {
    if (this.currentRoute === '/landing' || this.currentRoute === '/') {
      return false;
    }
    return this.authService.isAuthenticated();
  }
  
  private checkRouteAccess(): void {
    const publicRoutes = ['/landing', '/'];
    if (!publicRoutes.includes(this.currentRoute) && !this.authService.isAuthenticated()) {
      this.router.navigate(['/landing']);
    }
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