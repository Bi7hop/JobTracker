import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { JobApplicationService } from '../../services/job-application.service';
import { NotificationService } from '../../shared/services/notification.service';
import {
  Application,
  Note,
  Communication,
  FollowUpReminder,
  Document,
  TimelineItem,
  StatusChange,
  TimelineItemType
} from '../../models/job-tracker.models';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.scss']
})
export class ApplicationDetailComponent implements OnInit {

  application$!: Observable<Application | undefined>;
  notes$!: Observable<Note[]>;
  communications$!: Observable<Communication[]>;
  reminders$!: Observable<FollowUpReminder[]>;
  documents$!: Observable<Document[]>;
  timeline$!: Observable<TimelineItem[]>;

  newNoteContent = '';
  newCommunication: Omit<Communication, 'id' | 'createdAt' | 'applicationId'> = {
    type: 'email',
    subject: '',
    content: '',
    date: new Date(),
    direction: 'outgoing',
    contactPerson: ''
  };
  newReminder: Omit<FollowUpReminder, 'id' | 'createdAt' | 'applicationId' | 'isCompleted'> = {
    date: new Date(),
    reminderText: ''
  };

  selectedFile: File | null = null;
  selectedDocumentType: 'lebenslauf' | 'anschreiben' | 'zeugnis' | 'andere' = 'lebenslauf';
  applicationId: string | null = null;
  activeTab: 'timeline' | 'notes' | 'communications' | 'reminders' | 'documents' = 'timeline';
  newCommunicationDateString = this.formatDateForInput(this.newCommunication.date);
  newReminderDateString = this.formatDateForInput(this.newReminder.date);

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
      this.timeline$ = this.jobAppService.getTimelineForApplication(id);
    } else {
      this.notificationService.showError("Keine Bewerbungs-ID gefunden.");
      this.router.navigate(['/applications']);
    }
  }

  setActiveTab(tab: 'timeline' | 'notes' | 'communications' | 'reminders' | 'documents'): void {
    this.activeTab = tab;
  }

  addNote(): void {
    if (this.newNoteContent.trim() && this.applicationId) {
      this.jobAppService.addNote(this.applicationId, this.newNoteContent).subscribe({
        next: () => {
          this.notificationService.showSuccess('Notiz hinzugefügt');
          this.newNoteContent = '';
        },
        error: (err) => {
          console.error(err);
          this.notificationService.showError('Fehler: Notiz nicht hinzugefügt');
        }
      });
    }
  }

  deleteNote(id: string): void {
    if (confirm('Möchtest du diese Notiz wirklich löschen?')) {
      this.jobAppService.deleteNote(id).subscribe({
        next: () => this.notificationService.showSuccess('Notiz gelöscht'),
        error: (err) => {
          console.error(err);
          this.notificationService.showError('Fehler: Notiz nicht gelöscht');
        }
      });
    }
  }

  addCommunication(): void {
    this.newCommunication.date = new Date(this.newCommunicationDateString);
    if (this.newCommunication.subject.trim() && this.newCommunication.content.trim() && this.applicationId) {
      const communicationData: Omit<Communication, 'id' | 'createdAt' | 'applicationId'> = { ...this.newCommunication };
      this.jobAppService.addCommunication(this.applicationId, communicationData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Kommunikation hinzugefügt');
          this.resetCommunicationForm();
        },
        error: (err) => {
          console.error(err);
          this.notificationService.showError('Fehler: Kommunikation nicht hinzugefügt');
        }
      });
    }
  }

  addReminder(): void {
    this.newReminder.date = new Date(this.newReminderDateString);
    if (this.newReminder.reminderText.trim() && this.applicationId) {
      this.jobAppService.addReminder(this.applicationId, this.newReminder.date, this.newReminder.reminderText).subscribe({
        next: () => {
          this.notificationService.showSuccess('Erinnerung hinzugefügt');
          this.resetReminderForm();
        },
        error: (err) => {
          console.error(err);
          this.notificationService.showError('Fehler: Erinnerung nicht hinzugefügt');
        }
      });
    }
  }

  toggleReminderCompletion(id: string): void {
    this.jobAppService.toggleReminderCompletion(id).subscribe({
      next: () => this.notificationService.showSuccess('Erinnerung aktualisiert'),
      error: (err) => {
        console.error(err);
        this.notificationService.showError('Fehler: Erinnerung nicht aktualisiert');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = (input.files && input.files.length > 0) ? input.files[0] : null;
  }

  uploadDocument(): void {
    if (this.selectedFile && this.applicationId) {
      if (this.selectedFile.size > 10 * 1024 * 1024) {
        this.notificationService.showError('Datei ist zu groß (max. 10MB).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          const documentData = {
            applicationId: this.applicationId!,
            name: this.selectedFile!.name,
            type: this.selectedDocumentType,
            fileType: this.selectedFile!.type,
            fileSize: this.selectedFile!.size,
            fileData: e.target.result as string
          };
          this.jobAppService.addDocument(documentData).subscribe({
            next: () => {
              this.notificationService.showSuccess('Dokument erfolgreich hochgeladen');
              this.resetUploadForm();
            },
            error: (err) => {
              console.error(err);
              this.notificationService.showError('Fehler: Dokument nicht hochgeladen');
            }
          });
        } else {
          this.notificationService.showError('Fehler beim Lesen der Datei.');
        }
      };
      reader.onerror = (error) => {
        console.error(error);
        this.notificationService.showError('Fehler beim Lesen der Datei.');
      };
      reader.readAsDataURL(this.selectedFile);
    } else if (!this.selectedFile) {
      this.notificationService.showInfo('Keine Datei ausgewählt.');
    }
  }

  previewDocument(doc: Document): void {
    if (doc.fileData && doc.fileData.startsWith('data:')) {
      try {
        const byteCharacters = atob(doc.fileData.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: doc.fileType || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (e) {
        console.error(e);
        this.notificationService.showError("Fehler beim Anzeigen der Vorschau.");
      }
    } else {
      this.notificationService.showInfo('Keine Vorschaudaten verfügbar.');
    }
  }

  downloadDocument(doc: Document): void {
    if (doc.fileData && doc.fileData.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      this.notificationService.showError('Download nicht möglich (keine Dateidaten).');
    }
  }

  deleteDocument(doc: Document): void {
    if (confirm(`Möchtest du das Dokument "${doc.name}" wirklich löschen?`)) {
      this.jobAppService.deleteDocument(doc.id).subscribe({
        next: () => this.notificationService.showSuccess('Dokument gelöscht'),
        error: (err) => {
          console.error(err);
          this.notificationService.showError('Fehler: Dokument nicht gelöscht');
        }
      });
    }
  }

  getTimelineItemIcon(item: TimelineItem): string {
    switch (item.type) {
      case 'StatusChange': return '📊';
      case 'Note': return '📝';
      case 'Reminder': return '⏰';
      case 'Document': return '📄';
      case 'Communication':
        const commData = item.data as Communication;
        switch (commData.type) {
          case 'email': return '📧';
          case 'phone': return '📞';
          case 'meeting': return '👥';
          default: return '💬';
        }
      default:
        const exhaustiveCheck: never = item.type;
        console.warn(`Unbekannter Timeline-Item-Typ: ${exhaustiveCheck}`);
        return '?';
    }
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resetCommunicationForm(): void {
    const today = new Date();
    this.newCommunication = {
      type: 'email',
      subject: '',
      content: '',
      date: today,
      direction: 'outgoing',
      contactPerson: ''
    };
    this.newCommunicationDateString = this.formatDateForInput(today);
  }

  private resetReminderForm(): void {
    const today = new Date();
    this.newReminder = {
      date: today,
      reminderText: ''
    };
    this.newReminderDateString = this.formatDateForInput(today);
  }

  private resetUploadForm(): void {
    this.selectedFile = null;
    this.selectedDocumentType = 'lebenslauf';
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getDocumentTypeLabel(type: Document['type'] | string): string {
    switch (type) {
      case 'lebenslauf': return 'Lebenslauf';
      case 'anschreiben': return 'Anschreiben';
      case 'zeugnis': return 'Arbeitszeugnis';
      case 'andere': return 'Sonstiges';
      default: return 'Unbekannt';
    }
  }

  getDocumentTypeColor(type: Document['type'] | string): string {
    switch (type) {
      case 'lebenslauf': return 'bg-blue-900/50 text-blue-400';
      case 'anschreiben': return 'bg-purple-900/50 text-purple-400';
      case 'zeugnis': return 'bg-green-900/50 text-green-400';
      default: return 'bg-gray-800 text-gray-400';
    }
  }

  getStatusColor(status: string | undefined): string {
    switch (status) {
      case 'Gespräch': return 'bg-green-900 text-green-400';
      case 'Gesendet': return 'bg-blue-900 text-blue-400';
      case 'Absage': return 'bg-pink-900 text-pink-400';
      case 'HR Screening': return 'bg-yellow-900 text-yellow-400';
      case 'Angebot': return 'bg-lime-900 text-lime-400';
      case 'Wartend': return 'bg-gray-800 text-gray-400';
      default: return 'bg-gray-800 text-gray-400';
    }
  }

  isStatusChangeItem(item: TimelineItem): item is TimelineItem & { data: StatusChange } {
    return item.type === 'StatusChange';
  }

  isNoteItem(item: TimelineItem): item is TimelineItem & { data: Note } {
    return item.type === 'Note';
  }

  isCommunicationItem(item: TimelineItem): item is TimelineItem & { data: Communication } {
    return item.type === 'Communication';
  }

  isReminderItem(item: TimelineItem): item is TimelineItem & { data: FollowUpReminder } {
    return item.type === 'Reminder';
  }

  isDocumentItem(item: TimelineItem): item is TimelineItem & { data: Document } {
    return item.type === 'Document';
  }
}
