import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { JobApplicationService } from '../../services/job-application.service';
import { Application } from '../../models/job-tracker.models';
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
    private route: ActivatedRoute
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
                console.error('Application data not found for ID:', this.currentApplicationId);
                this.router.navigate(['/dashboard']);
            }
        },
        error: (err) => {
            console.error('Error loading application data:', err);
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
                        console.log('Application updated successfully', result);
                        this.router.navigate(['/dashboard']);
                    } else {
                        console.error('Failed to update application: Not found in service');
                    }
                },
                error: (err) => {
                    console.error('Error updating application', err);
                }
            });

        } else {
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
                  console.log('Application added successfully', addedApp);
                  this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                  console.error('Error adding application', err);
                }
            });
       }
    } else {
      console.log('Form is invalid');
      this.applicationForm.markAllAsTouched();
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}