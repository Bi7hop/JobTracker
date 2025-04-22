import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { JobApplicationService } from '../../services/job-application.service';
import { Application, Event, Stat } from '../../models/job-tracker.models';
import { NotificationService } from '../../shared/services/notification.service';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    RouterLink,
    ConfirmationDialogComponent 
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-15px)' }),
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ], { optional: true })
      ])
    ]),
   ]
})
export class DashboardComponent implements OnInit {
  stats: Stat[] = [];
  applications: Application[] = [];
  events: Event[] = [];

  isConfirmingDelete = false;
  applicationToDelete: Application | null = null;

  constructor(
    private jobAppService: JobApplicationService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
     this.jobAppService.stats$.subscribe(data => {
       this.stats = data;
     });
     this.jobAppService.getApplications().subscribe(data => {
       this.applications = data;
     });
     this.jobAppService.getEvents().subscribe(data => {
       this.events = data;
     });
   }
  getStatusColor(status: string): string {
     switch(status) {
       case 'Gespräch': return 'bg-green-900 text-green-400';
       case 'Gesendet': return 'bg-blue-900 text-blue-400';
       case 'Absage': return 'bg-pink-900 text-pink-400';
       case 'HR Screening': return 'bg-yellow-900 text-yellow-400';
       default: return 'bg-gray-800 text-gray-400';
     }
   }

  onStatClick(stat: Stat) {
    console.log('Stat Card clicked:', stat.title);
  }

  onApplicationClick(app: Application) {
     if (app.id) {
       this.router.navigate(['/applications', app.id, 'edit']);
     } else {
       console.warn('Cannot edit application without an ID:', app.company);
     }
   }

  onDeleteClick(app: Application, event: MouseEvent): void {
    event.stopPropagation();
    this.applicationToDelete = app; 
    this.isConfirmingDelete = true; 
  }

  confirmDelete(): void {
    if (this.applicationToDelete && this.applicationToDelete.id) {
      const appToDelete = this.applicationToDelete; 
      this.jobAppService.deleteApplication(appToDelete.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess(`Bewerbung bei ${appToDelete.company} gelöscht.`);
        },
        error: (err: any) => {
          this.notificationService.showError(`Fehler beim Löschen: ${err?.message || 'Unbekannter Fehler'}`);
        }
      });
    } else {
        this.notificationService.showError('Fehler: Bewerbung zum Löschen ungültig.');
    }
    this.resetDeleteState(); 
  }


  cancelDelete(): void {
    this.resetDeleteState();
  }

  private resetDeleteState(): void {
    this.isConfirmingDelete = false;
    this.applicationToDelete = null;
  }

  onEventClick(event: Event) {
     console.log('Event clicked:', event);
     if (event.id && event.date) {
       this.router.navigate(['/calendar'], {
         queryParams: { eventId: event.id, focusDate: event.date }
       });
     } else {
        console.warn('Cannot navigate to event without ID or Date:', event);
     }
   }

  getEventDayLabel(dateString: string): string {
     const today = new Date();
     const tomorrow = new Date(today);
     tomorrow.setDate(tomorrow.getDate() + 1);
     const eventDate = new Date(dateString + 'T00:00:00');

     const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
     const tomorrowStr = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;

     if (dateString === todayStr) {
       return 'HEUTE';
     } else if (dateString === tomorrowStr) {
       return 'MORGEN';
     } else {
       return dateString;
     }
   }

  getEventDayLabelClass(dateString: string): string {
     const today = new Date();
     const tomorrow = new Date(today);
     tomorrow.setDate(tomorrow.getDate() + 1);

     const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
     const tomorrowStr = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;

     if (dateString === todayStr) {
       return 'text-pink-500';
     } else if (dateString === tomorrowStr) {
       return 'text-blue-500';
     } else {
       return 'text-gray-400';
     }
   }
}