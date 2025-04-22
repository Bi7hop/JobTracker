import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from 'angular-calendar'; 
import { format } from 'date-fns/format'; 
import { de } from 'date-fns/locale';

@Component({
  selector: 'app-event-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-detail-modal.component.html',
  styleUrls: ['./event-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class EventDetailModalComponent {
  @Input() event: CalendarEvent | null = null; 
  @Output() close = new EventEmitter<void>(); 

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return format(date, "EEEE, dd.MM.yyyy HH:mm", { locale: de }) + ' Uhr';
  }

  closeModal(): void {
    this.close.emit(); 
  }
}