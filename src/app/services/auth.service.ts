import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';
import { NotificationService } from '../shared/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  public isAuth$ = this._isAuthenticated.asObservable();
  
  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.checkInitialAuthState();
  }
  
  private async checkInitialAuthState(): Promise<void> {
    const { data } = await this.supabaseService.client.auth.getSession();
    const isAuthenticated = !!data.session;
    this._isAuthenticated.next(isAuthenticated);
  }
  
  isAuthenticated(): boolean {
    return this._isAuthenticated.value;
  }
  
  async login(email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      this._isAuthenticated.next(true);
      this.notificationService.showSuccess('Successfully logged in');
      return true;
    } catch (error: any) {
      this.notificationService.showError(`Login failed: ${error.message}`);
      return false;
    }
  }
  
  async signup(name: string, email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });
      
      if (error) throw error;
      
      this._isAuthenticated.next(true);
      this.notificationService.showSuccess('Account created successfully');
      return true;
    } catch (error: any) {
      this.notificationService.showError(`Signup failed: ${error.message}`);
      return false;
    }
  }
  
  async logout(): Promise<void> {
    try {
      const { error } = await this.supabaseService.client.auth.signOut();
      
      if (error) throw error;
      
      this._isAuthenticated.next(false);
      this.router.navigate(['/landing']);
      this.notificationService.showSuccess('You have been logged out');
    } catch (error: any) {
      this.notificationService.showError(`Logout failed: ${error.message}`);
    }
  }
}