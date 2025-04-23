import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { PatternService } from '../../services/pattern.service'; 
import { Pattern } from '../../models/job-tracker.models';
import { NotificationService } from '../../shared/services/notification.service'; 
import { PatternPreviewComponent } from './pattern-preview/pattern-preview.component'; 
import { PatternListComponent } from './pattern-list/pattern-list.component'; 

@Component({
  selector: 'app-patterns',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PatternPreviewComponent,
    PatternListComponent
  ],
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.scss'] 
})
export class PatternsComponent implements OnInit {
  activeType: 'all' | 'cover' | 'resume' | 'email' | 'note' = 'all';
  filteredPatterns$: Observable<Pattern[]> = of([]);
  previewedPattern: Pattern | null = null;

  constructor(
    private patternService: PatternService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadPatterns();
  }

  loadPatterns(): void {
    if (this.activeType === 'all') {
      this.filteredPatterns$ = this.patternService.getPatterns();
    } else {
      this.filteredPatterns$ = this.patternService.getPatternsByType(this.activeType);
    }
  }

  setActiveType(type: 'all' | 'cover' | 'resume' | 'email' | 'note'): void {
    this.activeType = type;
    this.loadPatterns();
  }

  previewPattern(pattern: Pattern): void {
    this.previewedPattern = pattern;
  }

  closePreview(): void {
    this.previewedPattern = null;
  }

  duplicatePattern(pattern: Pattern): void {
    const duplicatedPatternData: Omit<Pattern, 'id' | 'createdAt' | 'updatedAt'> = {
      name: `${pattern.name} (Copy)`,
      type: pattern.type,
      content: pattern.content,
      tags: pattern.tags ? [...pattern.tags] : [],
      isDefault: false
    };
    this.patternService.addPattern(duplicatedPatternData).subscribe({
      next: (newPattern) => {
        if(newPattern){
             this.notificationService.showSuccess('Pattern has been duplicated.');
             this.loadPatterns();
        } else {
             this.notificationService.showError('Error while duplicating the pattern (no pattern returned).');
        }
      },
      error: (err) => {
        console.error('Error duplicating pattern:', err);
        this.notificationService.showError('Error while duplicating the pattern.');
      }
    });
  }

  setDefaultPattern(pattern: Pattern): void {
    this.patternService.setDefaultPattern(pattern).subscribe({
      next: (success) => {
        if (success) {
          this.notificationService.showSuccess(`"${pattern.name}" has been set as the default pattern.`);
          this.loadPatterns();
        } else {
          this.notificationService.showError('Error setting default pattern.');
        }
      },
      error: (err) => {
        console.error('Error setting default pattern:', err);
        this.notificationService.showError('Error setting default pattern.');
      }
    });
  }

  deletePattern(pattern: Pattern): void {
    if (confirm(`Do you really want to delete the pattern "${pattern.name}"?`)) {
      if (!pattern.id) {
          this.notificationService.showError('Cannot delete pattern without ID.');
          return;
      }
      this.patternService.deletePattern(pattern.id).subscribe({
        next: (success) => {
          if (success) {
            this.notificationService.showSuccess(`Pattern "${pattern.name}" has been deleted.`);
            this.loadPatterns();
          } else {
            this.notificationService.showError('Pattern could not be deleted (service reported failure).');
          }
        },
        error: (err) => {
          console.error('Error deleting pattern:', err);
          this.notificationService.showError('Error deleting pattern.');
        }
      });
    }
  }
}