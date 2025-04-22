import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { JobApplicationService } from '../../services/job-application.service';
import { Application, Event, Stat } from '../../models/job-tracker.models'; // Skill entfernt
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    RouterLink
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
export class DashboardComponent implements OnInit, OnDestroy {
  stats: Stat[] = [];
  applications: Application[] = [];
  events: Event[] = [];

  feedbackMessage: string | null = null;
  private feedbackTimerSubscription: Subscription | null = null;

  constructor(
    private jobAppService: JobApplicationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
      this.feedbackTimerSubscription?.unsubscribe();
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
    const confirmation = confirm(`Möchtest du die Bewerbung wirklich löschen?\n\n${app.company} - ${app.position}`);

    if (confirmation) {
      if (app.id) {
        this.jobAppService.deleteApplication(app.id).subscribe({
          next: () => {
            console.log('Application deleted successfully:', app.company);
            this.showFeedback(`Bewerbung für '${app.position}' bei ${app.company} gelöscht.`);
          },
          error: (err: any) => {
            console.error('Error deleting application:', err);
            this.showFeedback(`Fehler beim Löschen: ${err?.message || 'Unbekannter Fehler'}`, true);
          }
        });
      } else {
        console.error('Cannot delete application without an ID:', app.company);
        this.showFeedback('Fehler: Bewerbung konnte nicht gelöscht werden (fehlende ID).', true);
      }
    } else {
      console.log('Deletion cancelled by user for:', app.company);
    }
  }

  onEventClick(event: Event) {
    console.log('Event clicked:', event);
    if (event.id && event.date) {
      this.router.navigate(['/calendar'], {
        queryParams: {
          eventId: event.id,
          focusDate: event.date
        }
      });
    } else {
       console.warn('Cannot navigate to event without ID or Date:', event);
    }
  }

  private showFeedback(message: string, isError: boolean = false, duration: number = 3000): void {
      this.feedbackTimerSubscription?.unsubscribe();
      this.feedbackMessage = message;
      this.feedbackTimerSubscription = timer(duration).subscribe(() => {
          this.feedbackMessage = null;
          this.feedbackTimerSubscription = null;
      });
  }

  // Hilfsmethoden für Event-Datum-Anzeige
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