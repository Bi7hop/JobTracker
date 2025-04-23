import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Pattern } from '../../../models/job-tracker.models';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-pattern-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pattern-preview.component.html',
  styleUrls: ['./pattern-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatternPreviewComponent {
  @Input() pattern!: Pattern;
  @Output() close = new EventEmitter<void>();

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {}

  getTypeColor(type: Pattern['type']): string {
    switch (type) {
      case 'cover': return 'bg-blue-900 text-blue-400';
      case 'resume': return 'bg-green-900 text-green-400';
      case 'email': return 'bg-yellow-900 text-yellow-400';
      case 'note': return 'bg-gray-800 text-gray-400';
      default: return 'bg-gray-800 text-gray-400';
    }
  }

  getTypeLabel(type: Pattern['type']): string {
    switch (type) {
      case 'cover': return 'Cover Letter';
      case 'resume': return 'Resume';
      case 'email': return 'Email';
      case 'note': return 'Note';
      default: return type;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  useInApplication(): void {
    // Future implementation will navigate to the application form
    // and use the pattern
    this.notificationService.showInfo('This feature will be available in a future version.');
    
    // Example:
    // this.router.navigate(['/applications/new'], { 
    //   queryParams: { patternId: this.pattern.id } 
    // });
    
    this.onClose();
  }
}