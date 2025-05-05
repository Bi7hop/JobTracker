// dashboard.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core'; 
import { CommonModule, DatePipe } from '@angular/common'; 
import { Router, RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations'; 
import { JobApplicationService } from '../../services/job-application.service';
import { Application, Stat } from '../../models/job-tracker.models'; 
import { NotificationService } from '../../shared/services/notification.service';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { RemindersWidgetComponent } from '../../shared/components/reminders-widget/reminders-widget.component';
import Chart from 'chart.js/auto';
import { Subscription, Observable } from 'rxjs'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    RouterLink,
    ConfirmationDialogComponent,
    RemindersWidgetComponent,
    DatePipe 
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [
   trigger('listAnimation', [
     transition('* => *', [
       query(':enter', [
         style({ opacity: 0, transform: 'translateY(-15px)' }),
         stagger('50ms', [ 
           animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
         ])
       ], { optional: true }),
       query(':leave', [ 
          animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' }))
       ], { optional: true })
     ])
   ]),
  ]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  stats: Stat[] = [];
  applications: Application[] = [];
  upcomingAppointments$: Observable<Application[]> | undefined; 

  isConfirmingDelete = false;
  applicationToDelete: Application | null = null;

  @ViewChild('statusChartCanvas') statusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('progressChartCanvas') progressChartCanvas!: ElementRef<HTMLCanvasElement>;

  statusChart: Chart | null = null;
  progressChart: Chart | null = null;

  private statsSubscription: Subscription | undefined;
  private applicationsSubscription: Subscription | undefined;
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
    }, 100);
  }

  ngOnDestroy(): void {
    this.statsSubscription?.unsubscribe();
    this.applicationsSubscription?.unsubscribe();
    this.statusChart?.destroy();
    this.progressChart?.destroy();
  }


  loadDashboardData(): void {
    this.statsSubscription = this.jobAppService.stats$.subscribe(data => {
      this.stats = data;
    });

    this.applicationsSubscription = this.jobAppService.getApplicationsWithActivity().subscribe(data => {
      const shouldCreateCharts = this.applications.length === 0 && data.length > 0; 
      this.applications = data;
      if (this.statusChartCanvas && this.progressChartCanvas && shouldCreateCharts) {
         this.createCharts();
      } else if (this.statusChart && this.progressChart) {
         this.updateCharts();
      }
    });
    this.upcomingAppointments$ = this.jobAppService.getUpcomingAppointments();
  }

  private createCharts(): void {
    this.statusChart?.destroy();
    this.progressChart?.destroy();

    if (!this.statusChartCanvas || !this.progressChartCanvas || this.applications.length === 0) {
      console.warn("Charts können nicht erstellt werden: Canvas nicht bereit oder keine Daten.");
      return; 
    }

    try {
      const statusCounts: {[key: string]: number} = {};
      const statusColors: {[key: string]: string} = {
        'Gesendet': 'rgba(59, 130, 246, 0.8)',
        'HR Screening': 'rgba(245, 158, 11, 0.8)',
        'Gespräch': 'rgba(168, 85, 247, 0.8)',
        'Angebot': 'rgba(132, 204, 22, 0.8)',
        'Absage': 'rgba(244, 63, 94, 0.8)',
        'Wartend': 'rgba(156, 163, 175, 0.8)'
      };

      this.applications.forEach(app => {
        statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      });

      const labels = Object.keys(statusCounts);
      const data = labels.map(label => statusCounts[label]);
      const colors = labels.map(label => statusColors[label] || 'rgba(107, 114, 128, 0.8)');

      this.statusChart = new Chart(this.statusChartCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            hoverOffset: 4,
            borderColor: '#18181b', 
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, 
          cutout: '70%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#e4e4e7',
                font: { family: "'Inter', sans-serif", size: 12 },
                boxWidth: 15,
                padding: 15
              }
            },
            tooltip: {
              backgroundColor: '#18181b',
              titleColor: '#ffffff',
              bodyColor: '#e4e4e7',
              borderColor: '#3f3f46', 
              borderWidth: 1,
              padding: 10,
              usePointStyle: true
            }
          }
        }
      });

      const statusOrder = ['Angebot', 'Gespräch', 'HR Screening', 'Gesendet', 'Wartend', 'Absage'];
      const progressData = statusOrder.map(status => statusCounts[status] || 0);
      const progressColors = statusOrder.map(status => statusColors[status] || 'rgba(107, 114, 128, 0.8)');

      this.progressChart = new Chart(this.progressChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: statusOrder,
          datasets: [{
            data: progressData,
            backgroundColor: progressColors,
            maxBarThickness: 35,
            borderRadius: 4 
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { color: '#374151' },
              ticks: { color: '#9ca3af' }
            },
            y: {
              beginAtZero: true,
              grid: { color: '#374151' },
              ticks: { color: '#9ca3af', precision: 0 }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#18181b',
              titleColor: '#ffffff',
              bodyColor: '#e4e4e7',
              borderColor: '#3f3f46',
              borderWidth: 1,
              padding: 10
            }
          }
        }
      });
    } catch (error) {
        console.error("Fehler beim Erstellen der Charts:", error);
    }
  }

  private updateCharts(): void {
      if (!this.statusChart || !this.progressChart || this.applications.length === 0) {
          return; 
      }

      try {
          const statusCounts: {[key: string]: number} = {};
          this.applications.forEach(app => {
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
          });
          const statusLabels = Object.keys(statusCounts);
          const statusData = statusLabels.map(label => statusCounts[label]);
          const statusColorsList = statusLabels.map(label => ({ 
                'Gesendet': 'rgba(59, 130, 246, 0.8)',
                'HR Screening': 'rgba(245, 158, 11, 0.8)',
                'Gespräch': 'rgba(168, 85, 247, 0.8)',
                'Angebot': 'rgba(132, 204, 22, 0.8)',
                'Absage': 'rgba(244, 63, 94, 0.8)',
                'Wartend': 'rgba(156, 163, 175, 0.8)'
           }[label] || 'rgba(107, 114, 128, 0.8)'));

          if (this.statusChart.data.labels && this.statusChart.data.datasets[0]) {
            this.statusChart.data.labels = statusLabels;
            this.statusChart.data.datasets[0].data = statusData;
            this.statusChart.data.datasets[0].backgroundColor = statusColorsList;
            this.statusChart.update();
          }

          const statusOrder = ['Angebot', 'Gespräch', 'HR Screening', 'Gesendet', 'Wartend', 'Absage'];
          const progressData = statusOrder.map(status => statusCounts[status] || 0);

          if (this.progressChart.data.datasets[0]) {
            this.progressChart.data.datasets[0].data = progressData;
            this.progressChart.update();
          }

      } catch (error) {
          console.error("Fehler beim Aktualisieren der Charts:", error);
      }
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
      this.jobAppService.deleteApplication(appToDelete.id!).subscribe({         next: () => {
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

}