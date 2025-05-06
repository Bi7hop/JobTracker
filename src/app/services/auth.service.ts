import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';
import { NotificationService } from '../shared/services/notification.service';

export interface UserProfile {
  fullName: string;
  email: string;
  initials: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  private _userProfile = new BehaviorSubject<UserProfile | null>(null);
  
  public isAuth$ = this._isAuthenticated.asObservable();
  public userProfile$ = this._userProfile.asObservable();
  
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
    
    if (isAuthenticated) {
      await this.loadUserProfile();
    }
  }
  
  private async loadUserProfile(): Promise<void> {
    try {
      const { data: userData } = await this.supabaseService.client.auth.getUser();
      
      if (userData && userData.user) {
        const { user } = userData;
        const fullName = user.user_metadata?.['full_name'] || 'User';
        const email = user.email || '';
        const initials = this.generateInitials(fullName);
        
        this._userProfile.next({
          fullName,
          email,
          initials
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }
  
  private generateInitials(name: string): string {
    if (!name) return 'U';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    } else {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
  }
  
  isAuthenticated(): boolean {
    return this._isAuthenticated.value;
  }
  
  getUserProfile(): UserProfile | null {
    return this._userProfile.value;
  }
  
  async login(email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      this._isAuthenticated.next(true);
      await this.loadUserProfile();
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
      await this.loadUserProfile();
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
      this._userProfile.next(null);
      this.router.navigate(['/landing']);
      this.notificationService.showSuccess('You have been logged out');
    } catch (error: any) {
      this.notificationService.showError(`Logout failed: ${error.message}`);
    }
  }
}