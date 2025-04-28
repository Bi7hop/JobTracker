import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

interface NavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss' 
})
export class HeaderComponent {

  isMobileMenuOpen = false;    
  isUserDropdownOpen = false;  

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Übersicht', route: '/applications' }, 
    { label: 'Vorlagen', route: '/patterns' },     
    { label: 'Kalender', route: '/calendar' },
    { label: 'Checklisten', route: '/checklists' },
    { label: 'Erinnerungen', route: '/reminders' }       
  ];

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isUserDropdownOpen = false;
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    if (this.isUserDropdownOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  closeUserDropdown(): void {
     this.isUserDropdownOpen = false;
  }

  navigateToProfile(): void {
    this.closeUserDropdown();
    this.notificationService.showInfo('Das Benutzerprofil wird in einer zukünftigen Version verfügbar sein.');
  }

  navigateToApplications(): void {
    this.closeUserDropdown();
    this.router.navigate(['/applications']);
  }

  navigateToSettings(): void {
    this.closeUserDropdown();
    this.notificationService.showInfo('Die Einstellungen werden in einer zukünftigen Version verfügbar sein.');
  }

  navigateToReminders(): void {
    this.closeUserDropdown();
    this.router.navigate(['/reminders']);
  }

  logout(): void {
    this.closeUserDropdown();
    this.notificationService.showSuccess('Du wurdest erfolgreich abgemeldet.', 'Abmeldung');
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 1500);
  }
}