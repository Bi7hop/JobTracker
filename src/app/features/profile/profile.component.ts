import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  profileForm: FormGroup;
  isEditing = false;
  private userSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.userSubscription = this.authService.userProfile$.subscribe(profile => {
      this.userProfile = profile;
      
      if (profile) {
        this.profileForm.patchValue({
          fullName: profile.fullName,
          email: profile.email
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    
    if (!this.isEditing && this.userProfile) {
      this.profileForm.patchValue({
        fullName: this.userProfile.fullName,
        email: this.userProfile.email
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.notificationService.showSuccess('Profil aktualisiert');
      this.isEditing = false;
      this.notificationService.showInfo('Die Profilaktualisierung wird in einer zukünftigen Version verfügbar sein.');
    } else {
      this.notificationService.showError('Bitte fülle alle erforderlichen Felder aus');
    }
  }

  changePassword(): void {
    this.notificationService.showInfo('Die Passwortänderung wird in einer zukünftigen Version verfügbar sein.');
  }
}

