import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { JobApplicationService } from '../../services/job-application.service';
import { Application, Event, Stat } from '../../models/job-tracker.models';

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
export class DashboardComponent implements OnInit {
  stats: Stat[] = [];
  applications: Application[] = [];
  events: Event[] = [];

  constructor(
    private jobAppService: JobApplicationService,
    private router: Router
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
    const confirmation = confirm(`Möchtest du die Bewerbung wirklich löschen?\n\n${app.company} - ${app.position}`);

    if (confirmation) {
      if (app.id) {
        this.jobAppService.deleteApplication(app.id).subscribe({
          next: () => {
            console.log('Application deleted successfully:', app.company);
          },
          error: (err: any) => {
            console.error('Error deleting application:', err);
          }
        });
      } else {
        console.error('Cannot delete application without an ID:', app.company);
      }
    } else {
      console.log('Deletion cancelled by user for:', app.company);
    }
  }

  onEventClick(event: Event) {
    console.log('Event clicked:', event.title);
  }
}