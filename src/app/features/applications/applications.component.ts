import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs'; 
import { JobApplicationService } from '../../services/job-application.service'; 
import { Application } from '../../models/job-tracker.models'; 
// import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, RouterLink /*, CardComponent */ ],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'] 
})
export class ApplicationsComponent implements OnInit {

  applications$!: Observable<Application[]>;
  feedbackMessage: string | null = null;
  private feedbackTimer: any = null; 

  constructor(
    private jobAppService: JobApplicationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.applications$ = this.jobAppService.getApplications();
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