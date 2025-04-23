import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Pattern } from '../../../models/job-tracker.models'; 
@Component({
  selector: 'app-pattern-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pattern-list.component.html',
  styleUrls: ['./pattern-list.component.scss']
})
export class PatternListComponent {
  @Input() patterns: Pattern[] = [];

  @Output() previewPatternRequest = new EventEmitter<Pattern>();
  @Output() duplicatePatternRequest = new EventEmitter<Pattern>();
  @Output() setDefaultPatternRequest = new EventEmitter<Pattern>();
  @Output() deletePatternRequest = new EventEmitter<Pattern>();

  onPreview(pattern: Pattern): void {
    this.previewPatternRequest.emit(pattern);
  }

  onDuplicate(pattern: Pattern): void {
    this.duplicatePatternRequest.emit(pattern);
  }

  onSetDefault(pattern: Pattern): void {
    this.setDefaultPatternRequest.emit(pattern);
  }

  onDelete(pattern: Pattern): void {
    this.deletePatternRequest.emit(pattern);
  }

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
}