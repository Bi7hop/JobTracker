import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { JobApplicationService } from '../../services/job-application.service';
import { Application, Event, Stat } from '../../models/job-tracker.models';
import { NotificationService } from '../../shared/services/notification.service';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import Chart from 'chart.js/auto';

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
export class DashboardComponent implements OnInit, AfterViewInit {
  stats: Stat[] = [];
  applications: Application[] = [];
  events: Event[] = [];

  isConfirmingDelete = false;
  applicationToDelete: Application | null = null;

  @ViewChild('statusChartCanvas') statusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('progressChartCanvas') progressChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  statusChart: Chart | null = null;
  progressChart: Chart | null = null;

  constructor(
    private jobAppService: JobApplicationService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.applications.length > 0) {
        this.createCharts();
      }
    }, 500);
  }

  loadDashboardData(): void {
    this.jobAppService.stats$.subscribe(data => {
      this.stats = data;
    });
    
    this.jobAppService.getApplicationsWithActivity().subscribe(data => {
      this.applications = data;
      if (this.statusChartCanvas && this.progressChartCanvas) {
        this.createCharts();
      }
    });
    
    this.jobAppService.getEvents().subscribe(data => {
      this.events = data;
    });
  }
  
  private createCharts(): void {
    if (this.statusChart) {
      this.statusChart.destroy();
    }
    if (this.progressChart) {
      this.progressChart.destroy();
    }

    const statusCounts: {[key: string]: number} = {};
    const statusColors: {[key: string]: string} = {
      'Gesendet': 'rgba(59, 130, 246, 0.7)', 
      'HR Screening': 'rgba(245, 158, 11, 0.7)', 
      'Gespräch': 'rgba(168, 85, 247, 0.7)', 
      'Angebot': 'rgba(132, 204, 22, 0.7)', 
      'Absage': 'rgba(244, 63, 94, 0.7)', 
      'Wartend': 'rgba(156, 163, 175, 0.7)' 
    };
    
    this.applications.forEach(app => {
      if (statusCounts[app.status]) {
        statusCounts[app.status]++;
      } else {
        statusCounts[app.status] = 1;
      }
    });
    
    const labels = Object.keys(statusCounts);
    const data = labels.map(label => statusCounts[label]);
    const colors = labels.map(label => statusColors[label] || 'rgba(107, 114, 128, 0.7)');
    
    this.statusChart = new Chart(this.statusChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#e4e4e7', 
              font: {
                family: "'Inter', 'Helvetica', 'Arial', sans-serif",
                size: 12
              },
              boxWidth: 15,
              padding: 15
            }
          },
          tooltip: {
            backgroundColor: '#18181b', 
            titleColor: '#ffffff',
            bodyColor: '#e4e4e7',
            borderWidth: 1,
            padding: 10,
            usePointStyle: true
          }
        }
      }
    });
    
    const statusOrder = ['Angebot', 'Gespräch', 'HR Screening', 'Gesendet', 'Wartend', 'Absage'];
    const progressData = statusOrder.map(status => statusCounts[status] || 0);
    
    this.progressChart = new Chart(this.progressChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: statusOrder,
        datasets: [{
          data: progressData,
          backgroundColor: [
            'rgba(132, 204, 22, 0.7)', 
            'rgba(168, 85, 247, 0.7)', 
            'rgba(245, 158, 11, 0.7)', 
            'rgba(59, 130, 246, 0.7)', 
            'rgba(156, 163, 175, 0.7)', 
            'rgba(244, 63, 94, 0.7)' 
          ],
          maxBarThickness: 35
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            grid: {
              color: '#374151' 
            },
            ticks: {
              color: '#9ca3af' 
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#374151'
            },
            ticks: {
              color: '#9ca3af',
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#18181b',
            titleColor: '#ffffff',
            bodyColor: '#e4e4e7',
            borderWidth: 1,
            padding: 10
          }
        }
      }
    });
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

  onStatClick(stat: Stat) {
    const queryParams: any = {};
    
    switch(stat.title) {
      case 'Aktive Bewerbungen':
        queryParams.status = 'active';
        break;
      case 'Vorstellungsgespräche':
        queryParams.status = 'interview';
        break;
      case 'Positive Antworten':
        queryParams.status = 'positive';
        break;
      case 'Absagen':
        queryParams.status = 'Absage';
        break;
    }
    
    this.router.navigate(['/applications'], { queryParams });
  }

  onApplicationClick(app: Application) {
     if (app.id) {
       this.router.navigate(['/applications', app.id]);
     } else {
       console.warn('Cannot open application details without an ID:', app.company);
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