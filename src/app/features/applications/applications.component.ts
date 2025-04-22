import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Observable, map } from 'rxjs';
import { JobApplicationService } from '../../services/job-application.service';
import { Application } from '../../models/job-tracker.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {

  applications$!: Observable<Application[]>;
  feedbackMessage: string | null = null;
  private feedbackTimer: any = null;
  
  selectedStatus: string = 'all';
  searchTerm: string = '';
  statusOptions = [
    { value: 'all', label: 'Alle Status' },
    { value: 'active', label: 'Aktive Bewerbungen' },
    { value: 'interview', label: 'Vorstellungsgespräche' },
    { value: 'positive', label: 'Positive Antworten' },
    { value: 'Gespräch', label: 'Gespräch' },
    { value: 'Gesendet', label: 'Gesendet' },
    { value: 'HR Screening', label: 'HR Screening' },
    { value: 'Angebot', label: 'Angebot' },
    { value: 'Absage', label: 'Absage' },
    { value: 'Wartend', label: 'Wartend' }
  ];

  constructor(
    private jobAppService: JobApplicationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.selectedStatus = params['status'];
      }
      if (params['search']) {
        this.searchTerm = params['search'];
      }
      this.loadApplications();
    });
  }

  loadApplications(): void {
    this.applications$ = this.jobAppService.getApplications().pipe(
      map(apps => this.filterApplications(apps))
    );
  }

  filterApplications(applications: Application[]): Application[] {
    return applications.filter(app => {
      switch(this.selectedStatus) {
        case 'active':
          return app.status !== 'Absage' && this.matchesSearch(app);
        case 'interview':
          return (app.status === 'Gespräch' || app.status === 'HR Screening') && this.matchesSearch(app);
        case 'positive':
          return (app.status === 'Gespräch' || app.status === 'Angebot') && this.matchesSearch(app);
        case 'all':
          return this.matchesSearch(app);
        default:
          return app.status === this.selectedStatus && this.matchesSearch(app);
      }
    });
  }

  private matchesSearch(app: Application): boolean {
    if (!this.searchTerm) return true;
    
    const searchLower = this.searchTerm.toLowerCase();
    return (
      app.company.toLowerCase().includes(searchLower) ||
      app.position.toLowerCase().includes(searchLower) ||
      app.location.toLowerCase().includes(searchLower)
    );
  }

  onStatusChange(): void {
    this.updateFilters();
  }

  onSearchChange(): void {
    this.updateFilters();
  }

  updateFilters(): void {
    const queryParams: any = {};
    if (this.selectedStatus !== 'all') {
      queryParams.status = this.selectedStatus;
    }
    if (this.searchTerm) {
      queryParams.search = this.searchTerm;
    }
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });
    
    this.loadApplications();
  }

  clearFilters(): void {
    this.selectedStatus = 'all';
    this.searchTerm = '';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
    this.loadApplications();
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'Gespräch': return 'bg-green-900 text-green-400';
      case 'Gesendet': return 'bg-blue-900 text-blue-400';
      case 'Absage': return 'bg-pink-900 text-pink-400';
      case 'HR Screening': return 'bg-yellow-900 text-yellow-400';
      case 'Angebot': return 'bg-lime-900 text-lime-400';
      case 'Wartend': return 'bg-gray-800 text-gray-400';
      default: return 'bg-gray-800 text-gray-400';
    }
  }

  goToDetail(app: Application): void {
    if (app.id) {
      this.router.navigate(['/applications', app.id]);
    } else {
      console.warn('Cannot open application details without an ID:', app.company);
    }
  }
  
  goToEdit(app: Application): void {
    if (app.id) {
      this.router.navigate(['/applications', app.id, 'edit']);
    } else {
      console.warn('Cannot edit application without an ID:', app.company);
    }
  }

  deleteApplication(app: Application, event: MouseEvent): void {
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

  private showFeedback(message: string, isError: boolean = false, duration: number = 3000): void {
    clearTimeout(this.feedbackTimer);
    this.feedbackMessage = message;
    this.feedbackTimer = setTimeout(() => {
      this.feedbackMessage = null;
    }, duration);
  }
}