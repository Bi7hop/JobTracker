import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
    title: 'JobTracker - Welcome'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'JobTracker - Dashboard',
    canActivate: [AuthGuard]
  },
  {
    path: 'applications/new',
    loadComponent: () => import('./components/application-form/application-form.component').then(m => m.ApplicationFormComponent),
    title: 'JobTracker - Neue Bewerbung',
    canActivate: [AuthGuard]
  },
  {
    path: 'applications/:id',
    loadComponent: () => import('./features/application-detail/application-detail.component').then(m => m.ApplicationDetailComponent),
    title: 'JobTracker - Bewerbungsdetails',
    canActivate: [AuthGuard]
  },
  {
    path: 'applications/:id/edit',
    loadComponent: () => import('./components/application-form/application-form.component').then(m => m.ApplicationFormComponent),
    title: 'JobTracker - Bewerbung bearbeiten',
    canActivate: [AuthGuard]
  },
  {
    path: 'applications',
    loadComponent: () => import('./features/applications/applications.component').then(m => m.ApplicationsComponent),
    title: 'JobTracker - Bewerbungen',
    canActivate: [AuthGuard]
  },
  {
    path: 'documents',
    loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent),
    title: 'JobTracker - Dokumente',
    canActivate: [AuthGuard]
  },
  {
    path: 'calendar',
    loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
    title: 'JobTracker - Kalender',
    canActivate: [AuthGuard]
  },
  {
    path: 'patterns',
    loadComponent: () => import('./features/patterns/patterns.component').then(m => m.PatternsComponent),
    title: 'JobTracker - Patterns',
    canActivate: [AuthGuard]
  },
  {
    path: 'patterns/edit/:id',
    loadComponent: () => import('./features/patterns/pattern-editor/pattern-editor.component').then(m => m.PatternEditorComponent),
    title: 'JobTracker - Edit Pattern',
    canActivate: [AuthGuard]
  },
  {
    path: 'patterns/new',
    loadComponent: () => import('./features/patterns/pattern-editor/pattern-editor.component').then(m => m.PatternEditorComponent),
    title: 'JobTracker - New Pattern',
    canActivate: [AuthGuard]
  },
  {
    path: 'reminders',
    loadComponent: () => import('./features/reminders/reminders.component').then(m => m.RemindersComponent),
    title: 'JobTracker - Erinnerungen',
    canActivate: [AuthGuard]
  },
  {
    path: 'checklists',
    loadComponent: () => import('./features/checklists/checklists.component').then(m => m.ChecklistsComponent),
    title: 'JobTracker - Checklisten',
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    title: 'JobTracker - Mein Profil',
    canActivate: [AuthGuard]
  },
  {
    path: 'impressum',
    loadComponent: () => import('./features/imprint/imprint.component').then(m => m.ImpressumComponent),
    title: 'JobTracker - Impressum'
  },
  {
    path: 'datenschutz',
    loadComponent: () => import('./features/privacy-policy/privacy-policy.component').then(m => m.DatenschutzComponent),
    title: 'JobTracker - Datenschutz'
  },
  {
    path: '**',
    redirectTo: 'landing'
  }
];