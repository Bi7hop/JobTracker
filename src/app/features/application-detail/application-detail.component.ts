import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, map, switchMap, firstValueFrom, take } from 'rxjs';

import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

import { JobApplicationService } from '../../services/job-application.service';
import { ChecklistService } from '../../services/checklist.service';
import { NotificationService } from '../../shared/services/notification.service';

import {
  Application, Note, Communication, FollowUpReminder, Document, TimelineItem,
  StatusChange, TimelineItemType, ChecklistItem, ChecklistTemplate
} from '../../models/job-tracker.models';

interface TabOption { key: string; label: string; }
interface TemplateCategory { value: ChecklistTemplate['category']; label: string; }

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, ReactiveFormsModule,
    ConfirmationDialogComponent
  ],
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
  checklist$!: Observable<ChecklistItem[]>;
  availableTemplates$!: Observable<ChecklistTemplate[]>;

  applicationId: string | null = null;
  activeTab: 'timeline' | 'notes' | 'communications' | 'reminders' | 'documents' | 'checklist' = 'timeline';
  tabOptions: TabOption[] = [
    { key: 'timeline', label: 'Timeline' }, { key: 'notes', label: 'Notizen' },
    { key: 'communications', label: 'Kommunikation' }, { key: 'reminders', label: 'Erinnerungen' },
    { key: 'documents', label: 'Dokumente' }, { key: 'checklist', label: 'Checkliste' }
  ];

  newNoteContent = '';
  newCommunication: Omit<Communication, 'id' | 'createdAt' | 'applicationId'> = { type: 'email', subject: '', content: '', date: new Date(), direction: 'outgoing', contactPerson: '' };
  newReminder: Omit<FollowUpReminder, 'id' | 'createdAt' | 'applicationId' | 'isCompleted'> = { date: new Date(), reminderText: '' };
  newCommunicationDateString = this.formatDateForInput(new Date());
  newReminderDateString = this.formatDateForInput(new Date());
  newReminderTimeString: string = this.getCurrentTimeString();
  newReminderNotifyBefore: number = 60;
  selectedFile: File | null = null;
  selectedDocumentType: 'lebenslauf' | 'anschreiben' | 'zeugnis' | 'andere' = 'lebenslauf';

  selectedTemplate: ChecklistTemplate | null = null;
  selectedTemplateCategory: ChecklistTemplate['category'] = 'standard';
  isCreatingChecklist = false;
  isEditingChecklistItem = false;
  editingExistingItem = false;
  isSavingAsTemplate = false;
  checklistItemForm!: FormGroup;
  templateForm!: FormGroup;
  overallProgress: number = 0;
  categoryProgress: { category: string, progress: number }[] = [];
  templateCategories: TemplateCategory[] = [
    { value: 'standard', label: 'Allgemein' }, { value: 'initiativ', label: 'Initiativ' },
    { value: 'praktikum', label: 'Praktikum' }, { value: 'international', label: 'International' }
  ];
  private currentItemId: string | null = null;

  showDeleteConfirmation = false;
  itemToDeleteId: string | null = null;
  confirmationMessage = '';

  constructor(
    private route: ActivatedRoute, private router: Router,
    private jobAppService: JobApplicationService, private notificationService: NotificationService,
    private checklistService: ChecklistService, private fb: FormBuilder
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
      this.checklist$ = this.checklistService.getChecklistForApplication(id);
      this.loadChecklistProgress(id);
      this.loadCategoryProgress(id);
      this.initChecklistForms();
      this.resetCommunicationForm();
      this.resetReminderForm();
    } else {
      this.notificationService.showError("Keine Bewerbungs-ID gefunden.");
      this.router.navigate(['/applications']);
    }
  }

  private initChecklistForms(): void {
    this.checklistItemForm = this.fb.group({
      task: ['', Validators.required], category: ['', Validators.required],
      priority: ['medium'], dueDate: [null], notes: ['']
    });
    this.templateForm = this.fb.group({
      name: ['', Validators.required], description: ['', Validators.required],
      category: ['standard', Validators.required], isDefault: [false]
    });
  }

  private loadChecklistProgress(appId: string): void {
    if (!appId) return;
    this.checklistService.getChecklistProgress(appId).subscribe(progress => { this.overallProgress = progress; });
  }

  private loadCategoryProgress(appId: string): void {
    if (!appId) return;
    this.checklistService.getCategoryProgress(appId).subscribe(progress => { this.categoryProgress = progress; });
  }

  showTemplateSelection(): void {
    this.isCreatingChecklist = true; this.selectedTemplateCategory = 'standard'; this.loadAvailableTemplates();
  }

  cancelTemplateSelection(): void {
    this.isCreatingChecklist = false; this.selectedTemplate = null;
  }

  selectTemplateCategory(category: ChecklistTemplate['category']): void {
    this.selectedTemplateCategory = category; this.loadAvailableTemplates();
  }

  loadAvailableTemplates(): void {
    this.availableTemplates$ = this.checklistService.getTemplatesByCategory(this.selectedTemplateCategory);
  }

  selectTemplate(template: ChecklistTemplate): void {
    this.selectedTemplate = template;
  }

  createChecklistFromTemplate(): void {
    if (!this.selectedTemplate || !this.applicationId) {
      this.notificationService.showError('Wähle zuerst eine Vorlage aus.'); return;
    }
    this.checklistService.createChecklistFromTemplate(this.applicationId, this.selectedTemplate.id)
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Checkliste erstellt');
          this.isCreatingChecklist = false; this.selectedTemplate = null;
          if (this.applicationId) { this.loadChecklistProgress(this.applicationId); this.loadCategoryProgress(this.applicationId); }
        },
        error: (err) => { console.error('Fehler:', err); this.notificationService.showError('Fehler beim Erstellen der Checkliste'); }
      });
  }

  addChecklistItem(): void {
    this.isEditingChecklistItem = true; this.editingExistingItem = false; this.currentItemId = null;
    this.checklistItemForm.reset({ task: '', category: '', priority: 'medium', dueDate: null, notes: '' });
  }

  editChecklistItem(item: ChecklistItem): void {
    this.isEditingChecklistItem = true; this.editingExistingItem = true; this.currentItemId = item.id;
    this.checklistItemForm.patchValue({
      task: item.task, category: item.category, priority: item.priority || 'medium',
      dueDate: item.dueDate ? this.formatDateForInput(item.dueDate) : null, notes: item.notes || ''
    });
  }

  cancelChecklistItemEdit(): void {
    this.isEditingChecklistItem = false; this.currentItemId = null;
  }

  saveChecklistItem(): void {
    if (this.checklistItemForm.invalid || !this.applicationId) { return; }
    const formValue = this.checklistItemForm.value;
    const appId = this.applicationId;
    const isUpdate = this.editingExistingItem && this.currentItemId;

    firstValueFrom(this.checklist$)
      .then(items => {
        const maxOrder = items.length > 0 ? Math.max(...items.map(item => item.order || 0)) : 0;
        const newOrder = maxOrder + 1;
        const itemData: Omit<ChecklistItem, 'id' | 'isCompleted'> & { isCompleted?: boolean } = {
            applicationId: appId, task: formValue.task, category: formValue.category,
            order: newOrder, priority: formValue.priority, notes: formValue.notes,
            dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined
        };
        let operation$: Observable<any>;
        if (isUpdate) {
            const currentItem = items.find(i => i.id === this.currentItemId);
            itemData.order = currentItem?.order ?? newOrder;
            operation$ = this.checklistService.updateChecklistItem({
              id: this.currentItemId!, ...itemData, isCompleted: currentItem?.isCompleted ?? false
            });
        } else {
            itemData.isCompleted = false;
            operation$ = this.checklistService.addChecklistItem(itemData as Omit<ChecklistItem, 'id'>);
        }
        operation$.pipe(take(1)).subscribe({
            next: (result) => {
                this.notificationService.showSuccess(isUpdate ? 'Aufgabe aktualisiert' : 'Aufgabe hinzugefügt');
                this.isEditingChecklistItem = false; this.currentItemId = null;
                this.loadChecklistProgress(appId); this.loadCategoryProgress(appId);
            },
            error: (err) => {
                console.error('Fehler beim Speichern der Aufgabe:', err);
                this.notificationService.showError('Fehler beim Speichern der Aufgabe');
            }
        });
      })
      .catch(err => {
          console.error('Fehler beim Abrufen der Checkliste für Order-Berechnung:', err);
          this.notificationService.showError('Fehler beim Vorbereiten des Speicherns der Aufgabe');
      });
  }

  toggleChecklistItem(id: string): void {
    this.checklistService.toggleChecklistItemCompletion(id).subscribe({
      next: () => { if (this.applicationId) { this.loadChecklistProgress(this.applicationId); this.loadCategoryProgress(this.applicationId); } },
      error: (err) => { console.error('Fehler:', err); this.notificationService.showError('Fehler beim Ändern des Status'); }
    });
  }

  deleteChecklistItem(id: string, taskName?: string): void {
    this.itemToDeleteId = id;
    this.confirmationMessage = `Möchtest du die Aufgabe "${taskName || 'diese Aufgabe'}" wirklich löschen?`;
    this.showDeleteConfirmation = true;
  }

  confirmItemDeletion(): void {
    if (this.itemToDeleteId) {
      this.checklistService.deleteChecklistItem(this.itemToDeleteId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Aufgabe gelöscht');
          if (this.applicationId) {
            this.loadChecklistProgress(this.applicationId);
            this.loadCategoryProgress(this.applicationId);
          }
        },
        error: (err) => {
          console.error('Fehler:', err);
          this.notificationService.showError('Fehler beim Löschen der Aufgabe');
        }
      });
    }
    this.closeConfirmationDialog();
  }

  cancelItemDeletion(): void {
    this.closeConfirmationDialog();
  }

  private closeConfirmationDialog(): void {
    this.showDeleteConfirmation = false;
    this.itemToDeleteId = null;
    this.confirmationMessage = '';
  }

  async saveAsTemplate(): Promise<void> {
     if (!this.applicationId) return;
     const application = await firstValueFrom(this.application$);
     if (!application) { this.notificationService.showError('Bewerbungsdaten nicht geladen.'); return; }
     this.templateForm.reset({
       name: `Vorlage für ${application.company}`, description: `Checkliste für ${application.position} bei ${application.company}`,
       category: 'standard', isDefault: false
     });
     this.isSavingAsTemplate = true;
   }

  cancelSaveAsTemplate(): void {
    this.isSavingAsTemplate = false;
  }

  confirmSaveAsTemplate(): void {
    if (this.templateForm.invalid || !this.applicationId) return;
    const formValue = this.templateForm.value; const appId = this.applicationId;
    this.checklistService.saveAsTemplate(appId, formValue.name, formValue.description, formValue.category)
      .subscribe({
        next: (template) => {
          this.notificationService.showSuccess(`Vorlage "${template.name}" erstellt`); this.isSavingAsTemplate = false;
          if (formValue.isDefault && template.id) {
            this.checklistService.setTemplateAsDefault(template.id).subscribe({
               next: () => this.notificationService.showInfo(`"${template.name}" ist jetzt Standard für ${formValue.category}.`),
               error: (err) => console.error("Fehler beim Setzen als Standard:", err)
             });
          }
        },
        error: (err) => { console.error('Fehler:', err); this.notificationService.showError('Fehler beim Speichern der Vorlage'); }
      });
  }

  getUniqueCategories(items: ChecklistItem[] | null): string[] {
    if (!items) return []; return [...new Set(items.map(item => item.category || 'Unkategorisiert'))].sort();
  }

  filterByCategory(items: ChecklistItem[] | null, category: string): ChecklistItem[] {
     if (!items) return []; return items.filter(item => (item.category || 'Unkategorisiert') === category)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
   }

  getPriorityBadgeClass(priority: string | undefined): string {
    switch (priority) { case 'high': return 'bg-red-900 text-red-400'; case 'medium': return 'bg-yellow-900 text-yellow-400'; case 'low': return 'bg-blue-900 text-blue-400'; default: return 'bg-gray-800 text-gray-400'; }
  }

  getPriorityLabel(priority: string | undefined): string {
    switch (priority) { case 'high': return 'Hoch'; case 'medium': return 'Mittel'; case 'low': return 'Niedrig'; default: return 'Keine'; }
  }

  setActiveTab(tabKey: string): void {
    if (['timeline', 'notes', 'communications', 'reminders', 'documents', 'checklist'].includes(tabKey)) { this.activeTab = tabKey as any; } else { this.activeTab = 'timeline'; }
   }

  addNote(): void {
    if (this.newNoteContent.trim() && this.applicationId) {
      this.jobAppService.addNote(this.applicationId, this.newNoteContent).subscribe({
        next: () => { this.notificationService.showSuccess('Notiz hinzugefügt'); this.newNoteContent = ''; },
        error: (err) => { console.error(err); this.notificationService.showError('Fehler: Notiz nicht hinzugefügt'); }
      });
    }
  }

  deleteNote(id: string): void {
    if (confirm('Möchtest du diese Notiz wirklich löschen?')) { 
      this.jobAppService.deleteNote(id).subscribe({
        next: () => this.notificationService.showSuccess('Notiz gelöscht'),
        error: (err) => { console.error(err); this.notificationService.showError('Fehler: Notiz nicht gelöscht'); }
      });
    }
  }

  addCommunication(): void {
    try { 
      if (this.newCommunicationDateString) {
        const now = new Date();
        const dateOnly = new Date(this.newCommunicationDateString);
        
        dateOnly.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        this.newCommunication.date = dateOnly;
      } else {
        this.newCommunication.date = new Date(); 
      }
      
      if (isNaN(this.newCommunication.date.getTime())) throw new Error("Invalid Date");
    }
    catch (e) { 
      this.notificationService.showError('Ungültiges Datum für Kommunikation.'); 
      return; 
    }
    
    if (this.newCommunication.subject.trim() && this.newCommunication.content.trim() && this.applicationId) {
      const communicationData = { ...this.newCommunication };
      this.jobAppService.addCommunication(this.applicationId, communicationData).subscribe({
        next: () => { this.notificationService.showSuccess('Kommunikation hinzugefügt'); this.resetCommunicationForm(); },
        error: (err) => { console.error(err); this.notificationService.showError('Fehler: Kommunikation nicht hinzugefügt'); }
      });
    }
  }

   addReminder(): void {
     if (!this.applicationId) return;
     try { const dtStr = `${this.newReminderDateString}T${this.newReminderTimeString || '00:00'}:00`; const rDate = new Date(dtStr); if (isNaN(rDate.getTime())) throw new Error('Ungültiges Format'); this.newReminder.date = rDate; }
     catch (e) { this.notificationService.showError('Ungültiges Datum oder Uhrzeit für Erinnerung.'); return; }
     if (this.newReminder.reminderText.trim()) {
       this.jobAppService.addReminder(this.applicationId, this.newReminder.date, this.newReminder.reminderText, this.newReminderNotifyBefore)
         .subscribe({
           next: () => { this.notificationService.showSuccess('Erinnerung hinzugefügt'); this.resetReminderForm(); },
           error: (err) => { console.error(err); this.notificationService.showError('Fehler: Erinnerung nicht hinzugefügt'); }
         });
     }
   }

  toggleReminderCompletion(id: string): void {
    this.jobAppService.toggleReminderCompletion(id).subscribe({
      next: () => this.notificationService.showSuccess('Erinnerung aktualisiert'),
      error: (err) => { console.error(err); this.notificationService.showError('Fehler: Erinnerung nicht aktualisiert'); }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement; this.selectedFile = (input.files && input.files.length > 0) ? input.files[0] : null;
  }

  uploadDocument(): void {
    if (this.selectedFile && this.applicationId) {
       if (this.selectedFile.size > 10 * 1024 * 1024) { this.notificationService.showError('Datei > 10MB.'); return; }
       const reader = new FileReader();
       reader.onload = (e: ProgressEvent<FileReader>) => {
         if (e.target?.result) {
           const docData = { applicationId: this.applicationId!, name: this.selectedFile!.name, type: this.selectedDocumentType, fileType: this.selectedFile!.type || 'app/octet-stream', fileSize: this.selectedFile!.size, fileData: e.target.result as string };
           this.jobAppService.addDocument(docData).subscribe({
             next: () => { this.notificationService.showSuccess('Dokument hochgeladen'); this.resetUploadForm(); },
             error: (err) => { console.error(err); this.notificationService.showError('Fehler: Dokument nicht hochgeladen'); }
           });
         } else { this.notificationService.showError('Fehler beim Lesen der Datei.'); }
       };
       reader.onerror = (error) => { console.error(error); this.notificationService.showError('Fehler beim Lesen der Datei.'); };
       reader.readAsDataURL(this.selectedFile);
     } else if (!this.selectedFile) { this.notificationService.showInfo('Keine Datei ausgewählt.'); }
  }

  previewDocument(doc: Document): void {
     if (doc.fileData && doc.fileData.startsWith('data:')) {
       try { const byteStr = atob(doc.fileData.split(',')[1]); const ab = new ArrayBuffer(byteStr.length); const ia = new Uint8Array(ab); for (let i = 0; i < byteStr.length; i++) { ia[i] = byteStr.charCodeAt(i); } const blob = new Blob([ab], { type: doc.fileType || 'app/octet-stream' }); const url = URL.createObjectURL(blob); window.open(url, '_blank'); }
       catch (e) { console.error("Blob-Fehler:", e); this.notificationService.showError("Vorschaufehler."); }
     } else { this.notificationService.showInfo('Keine Vorschaudaten.'); }
   }

  downloadDocument(doc: Document): void {
    if (doc.fileData && doc.fileData.startsWith('data:')) { const link = document.createElement('a'); link.href = doc.fileData; link.download = doc.name; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
    else { this.notificationService.showError('Download nicht möglich.'); }
  }

  deleteDocument(doc: Document): void {
    if (confirm(`Dokument "${doc.name}" löschen?`)) {
      this.jobAppService.deleteDocument(doc.id).subscribe({
        next: () => this.notificationService.showSuccess('Dokument gelöscht'),
        error: (err) => { console.error(err); this.notificationService.showError('Fehler: Dokument nicht gelöscht'); }
      });
    }
  }

  getTimelineItemIcon(item: TimelineItem): string {
    switch (item.type) { case 'StatusChange': return '📊'; case 'Note': return '📝'; case 'Reminder': return '⏰'; case 'Document': return '📄';
      case 'Communication': const cd = item.data as Communication; switch (cd.type) { case 'email': return '📧'; case 'phone': return '📞'; case 'meeting': return '👥'; default: return '💬'; }
      default: console.warn(`Unbekannter Typ: ${item.type}`); return '?';
    }
  }

  private getCurrentTimeString(): string {
    const now = new Date(); return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  private formatDateForInput(date: Date | string | null): string {
     try { if (!date) return ''; const d = new Date(date); if (isNaN(d.getTime())) { return ''; } const y = d.getFullYear(); const m = (d.getMonth() + 1).toString().padStart(2, '0'); const day = d.getDate().toString().padStart(2, '0'); return `${y}-${m}-${day}`; }
     catch (e) { console.error('Fehler formatDate:', e); return ''; }
   }

  private resetCommunicationForm(): void {
     const today = new Date(); this.newCommunication = { type: 'email', subject: '', content: '', date: today, direction: 'outgoing', contactPerson: '' }; this.newCommunicationDateString = this.formatDateForInput(today);
   }

   private resetReminderForm(): void {
     const today = new Date(); this.newReminder = { date: today, reminderText: '' }; this.newReminderDateString = this.formatDateForInput(today); this.newReminderTimeString = this.getCurrentTimeString(); this.newReminderNotifyBefore = 60;
   }

  private resetUploadForm(): void {
     this.selectedFile = null; this.selectedDocumentType = 'lebenslauf'; const fi = document.getElementById('dropzone-file') as HTMLInputElement; if (fi) fi.value = '';
   }

  formatFileSize(bytes: number | undefined): string {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes'; const k = 1024; const s = ['Bytes', 'KB', 'MB', 'GB']; if (bytes < 1) return `${bytes} Bytes`; const i = Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(k)), s.length - 1)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + s[i];
  }

  getDocumentTypeLabel(type: Document['type'] | string | undefined): string {
    switch (type) { case 'lebenslauf': return 'Lebenslauf'; case 'anschreiben': return 'Anschreiben'; case 'zeugnis': return 'Arbeitszeugnis'; case 'andere': return 'Sonstiges'; default: return 'Unbekannt'; }
  }

  getDocumentTypeColor(type: Document['type'] | string | undefined): string {
    switch (type) { case 'lebenslauf': return 'bg-blue-900/50 text-blue-400'; case 'anschreiben': return 'bg-purple-900/50 text-purple-400'; case 'zeugnis': return 'bg-green-900/50 text-green-400'; default: return 'bg-gray-800 text-gray-400'; }
  }

  getStatusColor(status: string | undefined): string {
    switch (status) { case 'Gespräch': return 'bg-green-900 text-green-400'; case 'Gesendet': return 'bg-blue-900 text-blue-400'; case 'Absage': return 'bg-pink-900 text-pink-400'; case 'HR Screening': return 'bg-yellow-900 text-yellow-400'; case 'Angebot': return 'bg-lime-900 text-lime-400'; case 'Wartend': return 'bg-gray-800 text-gray-400'; default: return 'bg-gray-800 text-gray-400'; }
  }

  isStatusChangeItem(item: TimelineItem): item is TimelineItem & { data: StatusChange } { return item.type === 'StatusChange'; }
  isNoteItem(item: TimelineItem): item is TimelineItem & { data: Note } { return item.type === 'Note'; }
  isCommunicationItem(item: TimelineItem): item is TimelineItem & { data: Communication } { return item.type === 'Communication'; }
  isReminderItem(item: TimelineItem): item is TimelineItem & { data: FollowUpReminder } { return item.type === 'Reminder'; }
  isDocumentItem(item: TimelineItem): item is TimelineItem & { data: Document } { return item.type === 'Document'; }

}