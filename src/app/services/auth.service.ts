import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';
import { NotificationService } from '../shared/services/notification.service';

export interface UserProfile {
  fullName: string;
  email: string;
  initials: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  private _userProfile = new BehaviorSubject<UserProfile | null>(null);
  private _profileLoaded = new BehaviorSubject<boolean>(false);
  private _isDemoUser = new BehaviorSubject<boolean>(false);
  
  public isAuth$ = this._isAuthenticated.asObservable();
  public userProfile$ = this._userProfile.asObservable();
  public profileLoaded$ = this._profileLoaded.asObservable();
  public isDemoUser$ = this._isDemoUser.asObservable();
  
  private readonly DEMO_EMAIL = 'demo@jobtracker.com';
  private readonly DEMO_PASSWORD = 'demoaccount';
  
  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.checkInitialAuthState();
  }
  
  private async checkInitialAuthState(): Promise<void> {
    try {
      const { data } = await this.supabaseService.client.auth.getSession();
      const isAuthenticated = !!data.session;
      
      this._isAuthenticated.next(isAuthenticated);
      
      if (isAuthenticated) {
        await this.loadUserProfile();
        const currentProfile = this._userProfile.getValue();
        if (currentProfile && currentProfile.email === this.DEMO_EMAIL) {
          this._isDemoUser.next(true);
        }
      } else {
        this._profileLoaded.next(false);
      }
    } catch (error) {
      this._isAuthenticated.next(false);
      this._profileLoaded.next(false);
    }
  }
  
  private async loadUserProfile(): Promise<void> {
    try {
      const { data: userData } = await this.supabaseService.client.auth.getUser();
      
      if (userData && userData.user) {
        const { user } = userData;
        const fullName = user.user_metadata?.['full_name'] || 'User';
        const email = user.email || '';
        const userId = user.id;
        const initials = this.generateInitials(fullName);
        
        const profile: UserProfile = {
          fullName,
          email,
          initials,
          userId
        };
        
        this._userProfile.next(profile);
        this._profileLoaded.next(true);
      } else {
        this._userProfile.next(null);
        this._profileLoaded.next(false);
      }
    } catch (error) {
      this._userProfile.next(null);
      this._profileLoaded.next(false);
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
  
  getCurrentUserId(): string | null {
    const profile = this.getUserProfile();
    if (!profile) {
      return null;
    }
    if (!profile.userId) {
      return null;
    }
    return profile.userId;
  }
  
  isDemoUser(): boolean {
    return this._isDemoUser.value;
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
      
      if (email === this.DEMO_EMAIL) {
        this._isDemoUser.next(true);
        this.notificationService.showInfo('Sie sind im Demo-Modus. Sie können alle Funktionen testen, aber Ihre Änderungen werden zurückgesetzt, wenn Sie sich abmelden.');
      } else {
        this._isDemoUser.next(false);
      }
      
      this.notificationService.showSuccess('Erfolgreich eingeloggt');
      return true;
    } catch (error: any) {
      this.notificationService.showError(`Login fehlgeschlagen: ${error.message}`);
      return false;
    }
  }
  
  async loginAsDemo(): Promise<boolean> {
    return this.login(this.DEMO_EMAIL, this.DEMO_PASSWORD);
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
      
      this.notificationService.showSuccess('Konto erfolgreich erstellt! Bitte melden Sie sich jetzt an.');
      return true;
    } catch (error: any) {
      this.notificationService.showError(`Registrierung fehlgeschlagen: ${error.message}`);
      return false;
    }
  }
  
  async logout(): Promise<void> {
    try {
      const { error } = await this.supabaseService.client.auth.signOut();
      
      if (error) throw error;
      
      this._isAuthenticated.next(false);
      this._userProfile.next(null);
      this._profileLoaded.next(false);
      this._isDemoUser.next(false);
      
      this.router.navigate(['/landing']);
      this.notificationService.showSuccess('Sie wurden abgemeldet');
    } catch (error: any) {
      this.notificationService.showError(`Abmeldung fehlgeschlagen: ${error.message}`);
    }
  }
}