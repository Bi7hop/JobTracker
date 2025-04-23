import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PatternService } from '../../../services/pattern.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Pattern } from '../../../models/job-tracker.models';

@Component({
  selector: 'app-pattern-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './pattern-editor.component.html',
  styleUrls: ['./pattern-editor.component.scss']
})
export class PatternEditorComponent implements OnInit {
  patternForm!: FormGroup;
  isEditMode = false;
  patternId: string | null = null;
  submitted = false;
  previewMode = false;

  constructor(
    private fb: FormBuilder,
    private patternService: PatternService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    this.patternId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.patternId;
    
    if (this.isEditMode && this.patternId) {
      this.loadPattern(this.patternId);
    }
  }

  initForm(): void {
    this.patternForm = this.fb.group({
      name: ['', Validators.required],
      type: ['cover', Validators.required],
      content: ['', Validators.required],
      tags: [''],
      isDefault: [false]
    });
  }

  loadPattern(id: string): void {
    this.patternService.getPatternById(id).subscribe({
      next: (pattern) => {
        if (pattern) {
          this.patternForm.patchValue({
            name: pattern.name,
            type: pattern.type,
            content: pattern.content,
            tags: pattern.tags ? pattern.tags.join(', ') : '',
            isDefault: pattern.isDefault || false
          });
        } else {
          this.notificationService.showError('Pattern not found');
          this.router.navigate(['/patterns']);
        }
      },
      error: (err) => {
        console.error('Error loading pattern:', err);
        this.notificationService.showError('Error loading pattern');
        this.router.navigate(['/patterns']);
      }
    });
  }

  get f() { return this.patternForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    if (this.patternForm.invalid) {
      return;
    }

    const formValue = this.patternForm.value;
    const patternData = {
      name: formValue.name,
      type: formValue.type,
      content: formValue.content,
      tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
      isDefault: formValue.isDefault
    };

    if (this.isEditMode && this.patternId) {
      this.patternService.updatePattern({
        id: this.patternId,
        ...patternData
      }).subscribe({
        next: (result) => {
          if (result) {
            this.notificationService.showSuccess(`Pattern "${result.name}" has been updated`);
            this.router.navigate(['/patterns']);
          } else {
            this.notificationService.showError('Error updating pattern');
          }
        },
        error: (err) => {
          console.error('Error updating pattern:', err);
          this.notificationService.showError('Error updating pattern');
        }
      });
    } else {
      this.patternService.addPattern(patternData).subscribe({
        next: (result) => {
          this.notificationService.showSuccess(`Pattern "${result.name}" has been created`);
          this.router.navigate(['/patterns']);
        },
        error: (err) => {
          console.error('Error adding pattern:', err);
          this.notificationService.showError('Error creating pattern');
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/patterns']);
  }

  togglePreview(): void {
    this.previewMode = !this.previewMode;
  }
}