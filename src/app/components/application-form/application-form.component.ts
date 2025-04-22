import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { JobApplicationService } from '../../services/job-application.service'; 
import { Application } from '../../models/job-tracker.models'; 
import { NotificationService } from '../../shared/services/notification.service'; 
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './application-form.component.html',
  styleUrls: ['./application-form.component.scss']
})
export class ApplicationFormComponent implements OnInit {
  applicationForm!: FormGroup;
  statuses: string[] = ['Gesendet', 'HR Screening', 'Gespräch', 'Angebot', 'Absage', 'Wartend'];
  isEditMode = false;
  currentApplicationId: string | number | null = null;
  pageTitle = 'Neue Bewerbung hinzufügen';

  constructor(
    private fb: FormBuilder,
    private jobAppService: JobApplicationService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService 
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.isEditMode = true;
          this.currentApplicationId = id;
          this.pageTitle = 'Bewerbung bearbeiten';
          return this.jobAppService.getApplicationById(id);
        } else {
          this.isEditMode = false;
          this.currentApplicationId = null;
          this.pageTitle = 'Neue Bewerbung hinzufügen';
          return of(undefined);
        }
      })
    ).subscribe({
        next: (application) => {
            if (this.isEditMode && application) {
                this.applicationForm.patchValue(application);
            } else if (this.isEditMode && !application) {
                this.notificationService.showError(`Bewerbung mit ID ${this.currentApplicationId} nicht gefunden.`);
                this.router.navigate(['/dashboard']);
            }
        },
        error: (err) => {
            console.error('Error loading application data:', err);
            this.notificationService.showError(`Fehler beim Laden der Bewerbungsdaten: ${err?.message || 'Unbekannter Fehler'}`);
        }
    });
  }

  initForm(): void {
     this.applicationForm = this.fb.group({
        company: ['', Validators.required],
        position: ['', Validators.required],
        location: [''],
        status: ['Gesendet', Validators.required],
        date: [this.getCurrentDateString(), Validators.required],
      });
  }

  getCurrentDateString(): string {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.applicationForm.valid) {
        if (this.isEditMode && this.currentApplicationId) {
            const formValue = this.applicationForm.value;
            const appDataToUpdate: Omit<Application, 'color'> & { id: string | number } = {
                id: this.currentApplicationId,
                company: formValue.company,
                position: formValue.position,
                location: formValue.location || '',
                status: formValue.status,
                date: formValue.date
            };
            this.jobAppService.updateApplication(appDataToUpdate).subscribe({
                next: (result) => {
                    if (result) {
                        this.notificationService.showSuccess(`Bewerbung bei ${result.company} erfolgreich aktualisiert!`);
                        this.router.navigate(['/dashboard']);
                    } else {
                        this.notificationService.showError(`Fehler beim Aktualisieren: Bewerbung nicht gefunden.`);
                    }
                },
                error: (err: any) => {
                    console.error('Error updating application', err);
                    this.notificationService.showError(`Fehler beim Aktualisieren: ${err?.message || 'Unbekannter Fehler'}`);
                }
            });
        } else {
            // --- ADD LOGIC ---
            const formValue = this.applicationForm.value;
             const newApp: Omit<Application, 'id' | 'color'> = {
                company: formValue.company,
                position: formValue.position,
                location: formValue.location || '',
                status: formValue.status,
                date: formValue.date
            };
            this.jobAppService.addApplication(newApp).subscribe({
                next: (addedApp) => {
                  this.notificationService.showSuccess(`Bewerbung bei ${addedApp.company} erfolgreich hinzugefügt!`);
                  this.router.navigate(['/dashboard']);
                },
                error: (err: any) => {
                  console.error('Error adding application', err);
                  this.notificationService.showError(`Fehler beim Hinzufügen: ${err?.message || 'Unbekannter Fehler'}`);
                }
            });
       }
    } else {
      console.log('Form is invalid');
      this.notificationService.showWarning('Bitte fülle alle Pflichtfelder aus.');
      this.applicationForm.markAllAsTouched();
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}