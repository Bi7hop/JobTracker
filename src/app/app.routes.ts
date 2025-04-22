import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'JobTracker - Dashboard'
  },
  {
    path: 'applications/new', 
    loadComponent: () => import('./components/application-form/application-form.component').then(m => m.ApplicationFormComponent),
    title: 'JobTracker - Neue Bewerbung'
  },
  {
    path: 'applications/:id',
    loadComponent: () => import('./features/application-detail/application-detail.component').then(m => m.ApplicationDetailComponent),
    title: 'JobTracker - Bewerbungsdetails'
  },
  {
    path: 'applications/:id/edit', 
    loadComponent: () => import('./components/application-form/application-form.component').then(m => m.ApplicationFormComponent),
    title: 'JobTracker - Bewerbung bearbeiten'
  },
  {
    path: 'applications',
    loadComponent: () => import('./features/applications/applications.component').then(m => m.ApplicationsComponent),
    title: 'JobTracker - Bewerbungen'
  },
  {
    path: 'documents',
    loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent),
    title: 'JobTracker - Dokumente'
  },
  {
    path: 'calendar',
    loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
    title: 'JobTracker - Kalender'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];