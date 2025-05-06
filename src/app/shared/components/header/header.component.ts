import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss' 
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;    
  isUserDropdownOpen = false;  
  userProfile: UserProfile | null = null;
  private userSubscription: Subscription | null = null;

  navItems = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Übersicht', route: '/applications' }, 
    { label: 'Vorlagen', route: '/patterns' },     
    { label: 'Kalender', route: '/calendar' },
    { label: 'Checklisten', route: '/checklists' },
    { label: 'Erinnerungen', route: '/reminders' }       
  ];

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.userProfile$.subscribe(profile => {
      this.userProfile = profile;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

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
    this.router.navigate(['/profile']);
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
    this.authService.logout();
  }
}