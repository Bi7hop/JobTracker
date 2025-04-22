import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { JobApplicationService } from '../../services/job-application.service';
import { Application, Note, Communication, FollowUpReminder } from '../../models/job-tracker.models';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss'
})
export class ApplicationDetailComponent implements OnInit {
  application$!: Observable<Application | undefined>;
  notes$!: Observable<Note[]>;
  communications$!: Observable<Communication[]>;
  reminders$!: Observable<FollowUpReminder[]>;
  
  newNoteContent = '';
  newCommunication = {
    type: 'email' as 'email' | 'phone' | 'meeting' | 'other',
    subject: '',
    content: '',
    date: this.getCurrentDate(),
    direction: 'outgoing' as 'incoming' | 'outgoing',
    contactPerson: ''
  };
  newReminder = {
    date: this.getCurrentDate(),
    reminderText: ''
  };
  
  activeTab: 'notes' | 'communications' | 'reminders' = 'notes';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobAppService: JobApplicationService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.application$ = this.jobAppService.getApplicationById(id);
      this.notes$ = this.jobAppService.getNotesForApplication(id);
      this.communications$ = this.jobAppService.getCommunicationsForApplication(id);
      this.reminders$ = this.jobAppService.getRemindersForApplication(id);
    } else {
      this.router.navigate(['/applications']);
    }
  }
  
  setActiveTab(tab: 'notes' | 'communications' | 'reminders'): void {
    this.activeTab = tab;
  }
  
  addNote(): void {
    if (this.newNoteContent.trim()) {
      const applicationId = this.route.snapshot.paramMap.get('id');
      if (applicationId) {
        this.jobAppService.addNote(applicationId, this.newNoteContent).subscribe({
          next: () => {
            this.notificationService.showSuccess('Notiz hinzugefügt');
            this.newNoteContent = '';
          },
          error: () => this.notificationService.showError('Fehler beim Hinzufügen der Notiz')
        });
      }
    }
  }
  
  deleteNote(id: string): void {
    if (confirm('Möchtest du diese Notiz wirklich löschen?')) {
      this.jobAppService.deleteNote(id).subscribe({
        next: () => this.notificationService.showSuccess('Notiz gelöscht'),
        error: () => this.notificationService.showError('Fehler beim Löschen der Notiz')
      });
    }
  }
  
  addCommunication(): void {
    if (this.newCommunication.subject.trim() && this.newCommunication.content.trim()) {
      const applicationId = this.route.snapshot.paramMap.get('id');
      if (applicationId) {
        this.jobAppService.addCommunication(applicationId, {
          type: this.newCommunication.type,
          subject: this.newCommunication.subject,
          content: this.newCommunication.content,
          date: new Date(this.newCommunication.date),
          direction: this.newCommunication.direction,
          contactPerson: this.newCommunication.contactPerson
        }).subscribe({
          next: () => {
            this.notificationService.showSuccess('Kommunikation hinzugefügt');
            this.resetCommunicationForm();
          },
          error: () => this.notificationService.showError('Fehler beim Hinzufügen der Kommunikation')
        });
      }
    }
  }
  
  addReminder(): void {
    if (this.newReminder.reminderText.trim()) {
      const applicationId = this.route.snapshot.paramMap.get('id');
      if (applicationId) {
        this.jobAppService.addReminder(
          applicationId,
          new Date(this.newReminder.date),
          this.newReminder.reminderText
        ).subscribe({
          next: () => {
            this.notificationService.showSuccess('Erinnerung hinzugefügt');
            this.resetReminderForm();
          },
          error: () => this.notificationService.showError('Fehler beim Hinzufügen der Erinnerung')
        });
      }
    }
  }
  
  toggleReminderCompletion(id: string): void {
    this.jobAppService.toggleReminderCompletion(id).subscribe({
      next: () => this.notificationService.showSuccess('Erinnerung aktualisiert'),
      error: () => this.notificationService.showError('Fehler beim Aktualisieren der Erinnerung')
    });
  }
  
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  private resetCommunicationForm(): void {
    this.newCommunication = {
      type: 'email',
      subject: '',
      content: '',
      date: this.getCurrentDate(),
      direction: 'outgoing',
      contactPerson: ''
    };
  }
  
  private resetReminderForm(): void {
    this.newReminder = {
      date: this.getCurrentDate(),
      reminderText: ''
    };
  }
  
  getStatusColor(status: string): string {
    switch(status) {
      case 'Gespräch': return 'bg-green-900 text-green-400';
      case 'Gesendet': return 'bg-blue-900 text-blue-400';
      case 'Absage': return 'bg-pink-900 text-pink-400';
      case 'HR Screening': return 'bg-yellow-900 text-yellow-400';
      case 'Angebot': return 'bg-lime-900 text-lime-400';
      case 'Wartend': return 'bg-gray-800 text-gray-400';
      default: return 'bg-gray-800 text-gray-400';
    }
  }
}