import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../shared/services/notification.service'; 

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  showAuth = false;
  isLogin = true;
  email: string = '';
  password: string = '';
  name: string = '';
  passwordConfirm: string = '';
  showPassword: boolean = false;
  showPasswordConfirm: boolean = false;
  
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService 
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  toggleAuth(login: boolean = true): void {
    this.clearFormFields();
    
    this.isLogin = login;
    this.showAuth = true;
  }

  closeAuth(): void {
    this.showAuth = false;
    this.clearFormFields();
  }

  startTracking(): void {
    this.toggleAuth(false); 
  }
  
  clearFormFields(): void {
    this.email = '';
    this.password = '';
    this.name = '';
    this.passwordConfirm = '';
    this.showPassword = false;
    this.showPasswordConfirm = false;
  }
  
  async submitAuth(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }
    
    this.isLoading = true;
    
    try {
      if (this.isLogin) {
        const success = await this.authService.login(this.email, this.password);
        if (success) {
          this.clearFormFields();
          this.router.navigate(['/dashboard']);
        }
      } else {
        const success = await this.authService.signup(this.name, this.email, this.password);
        if (success) {
          this.notificationService.showSuccess('Account erfolgreich erstellt! Bitte melde dich jetzt an.');
          this.clearFormFields();
          this.isLogin = true; 
        }
      }
    } finally {
      this.isLoading = false;
    }
  }

  loginAsDemo(): void {
    this.isLoading = true;
    
    this.authService.loginAsDemo()
      .then(success => {
        if (success) {
          this.router.navigate(['/dashboard']);
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  togglePasswordConfirmVisibility(): void {
    this.showPasswordConfirm = !this.showPasswordConfirm;
  }
  
  private validateForm(): boolean {
    if (!this.email) {
      this.notificationService.showError('Bitte gib deine E-Mail-Adresse ein');
      return false;
    }
    
    if (!this.password) {
      this.notificationService.showError('Bitte gib dein Passwort ein');
      return false;
    }
    
    if (!this.isLogin) {
      if (!this.name) {
        this.notificationService.showError('Bitte gib deinen Namen ein');
        return false;
      }
      
      if (!this.passwordConfirm) {
        this.notificationService.showError('Bitte bestätige dein Passwort');
        return false;
      }
      
      if (this.password !== this.passwordConfirm) {
        this.notificationService.showError('Die Passwörter stimmen nicht überein');
        return false;
      }
    }
    
    return true;
  }
}