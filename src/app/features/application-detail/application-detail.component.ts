import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { JobApplicationService } from '../../services/job-application.service';
import { Application, Note, Communication, FollowUpReminder, Document } from '../../models/job-tracker.models';
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
  documents$!: Observable<Document[]>;
  
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
  
  selectedFile: File | null = null;
  selectedDocumentType: 'lebenslauf' | 'anschreiben' | 'zeugnis' | 'andere' = 'lebenslauf';
  applicationId: string | null = null;
  
  activeTab: 'notes' | 'communications' | 'reminders' | 'documents' = 'notes';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobAppService: JobApplicationService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.applicationId = id;
      this.application$ = this.jobAppService.getApplicationById(id);
      this.notes$ = this.jobAppService.getNotesForApplication(id);
      this.communications$ = this.jobAppService.getCommunicationsForApplication(id);
      this.reminders$ = this.jobAppService.getRemindersForApplication(id);
      this.documents$ = this.jobAppService.getDocumentsForApplication(id);
    } else {
      this.router.navigate(['/applications']);
    }
  }
  
  setActiveTab(tab: 'notes' | 'communications' | 'reminders' | 'documents'): void {
    this.activeTab = tab;
  }
  
  addNote(): void {
    if (this.newNoteContent.trim() && this.applicationId) {
      this.jobAppService.addNote(this.applicationId, this.newNoteContent).subscribe({
        next: () => {
          this.notificationService.showSuccess('Notiz hinzugefügt');
          this.newNoteContent = '';
        },
        error: () => this.notificationService.showError('Fehler beim Hinzufügen der Notiz')
      });
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
    if (this.newCommunication.subject.trim() && this.newCommunication.content.trim() && this.applicationId) {
      this.jobAppService.addCommunication(this.applicationId, {
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
  
  addReminder(): void {
    if (this.newReminder.reminderText.trim() && this.applicationId) {
      this.jobAppService.addReminder(
        this.applicationId,
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
  
  toggleReminderCompletion(id: string): void {
    this.jobAppService.toggleReminderCompletion(id).subscribe({
      next: () => this.notificationService.showSuccess('Erinnerung aktualisiert'),
      error: () => this.notificationService.showError('Fehler beim Aktualisieren der Erinnerung')
    });
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }
  
  uploadDocument(): void {
    if (this.selectedFile && this.applicationId) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const documentData = {
          applicationId: this.applicationId!,
          name: this.selectedFile!.name,
          type: this.selectedDocumentType,
          fileType: this.selectedFile!.name.split('.').pop()?.toLowerCase() || '',
          fileSize: this.selectedFile!.size,
          fileData: e.target.result
        };
        
        this.jobAppService.addDocument(documentData).subscribe({
          next: () => {
            this.notificationService.showSuccess('Dokument erfolgreich hochgeladen');
            this.selectedFile = null;
            const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          },
          error: () => this.notificationService.showError('Fehler beim Hochladen des Dokuments')
        });
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
  
  previewDocument(doc: Document): void {
    if (doc.fileType === 'pdf' && doc.fileData) {
      window.open(doc.fileData, '_blank');
    } else {
      this.notificationService.showInfo('Vorschau für diesen Dateityp nicht verfügbar');
    }
  }
  
  downloadDocument(doc: Document): void {
    if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.name;
      link.click();
    }
  }
  
  deleteDocument(doc: Document): void {
    if (confirm(`Möchtest du dieses Dokument wirklich löschen?\n${doc.name}`)) {
      this.jobAppService.deleteDocument(doc.id).subscribe({
        next: () => this.notificationService.showSuccess('Dokument gelöscht'),
        error: () => this.notificationService.showError('Fehler beim Löschen des Dokuments')
      });
    }
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  getDocumentTypeLabel(type: string): string {
    switch (type) {
      case 'lebenslauf': return 'Lebenslauf';
      case 'anschreiben': return 'Anschreiben';
      case 'zeugnis': return 'Arbeitszeugnis';
      default: return 'Sonstiges Dokument';
    }
  }
  
  getDocumentTypeColor(type: string): string {
    switch (type) {
      case 'lebenslauf': return 'bg-blue-900/50 text-blue-400';
      case 'anschreiben': return 'bg-purple-900/50 text-purple-400';
      case 'zeugnis': return 'bg-green-900/50 text-green-400';
      default: return 'bg-gray-800 text-gray-400';
    }
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