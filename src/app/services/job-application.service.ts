import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, map, combineLatest } from 'rxjs';
import {
  Application,
  Event,
  Stat,
  Note,
  Communication,
  FollowUpReminder,
  Document,
  StatusChange,
  TimelineItem,
  TimelineItemType
} from '../models/job-tracker.models';

const INITIAL_APPLICATIONS: Application[] = [
  { id: '1', company: 'TechSolutions GmbH', location: 'München', position: 'Senior Angular Dev', status: 'Gespräch', date: '2025-04-20', color: 'bg-gradient-to-r from-purple-600 to-pink-500' },
  { id: '2', company: 'Innovative Systems AG', location: 'Berlin', position: 'Angular Entwickler', status: 'Gesendet', date: '2025-04-21', color: 'bg-gradient-to-r from-blue-600 to-cyan-500' },
  { id: '3', company: 'DataVision GmbH', location: 'Remote', position: 'Frontend Architect', status: 'Absage', date: '2025-03-28', color: 'bg-gradient-to-r from-red-600 to-orange-500' },
  { id: '4', company: 'CodeMasters KG', location: 'Hamburg', position: 'JavaScript Developer', status: 'HR Screening', date: '2025-03-25', color: 'bg-gradient-to-r from-yellow-600 to-amber-500' }
];

const INITIAL_NOTES: Note[] = [
    { id: 'note-1', applicationId: '1', content: 'Erstes Gespräch war positiv. Zweites Gespräch nächste Woche Dienstag.', createdAt: new Date('2025-04-21T10:00:00Z') },
    { id: 'note-2', applicationId: '2', content: 'Standardbewerbung gesendet.', createdAt: new Date('2025-04-21T14:05:00Z') }
];
const INITIAL_COMMUNICATIONS: Communication[] = [
    { id: 'comm-1', applicationId: '1', type: 'email', subject: 'Einladung zum Gespräch', content: 'Sehr geehrter Herr Mustermann,...', date: new Date('2025-04-15T09:30:00Z'), direction: 'incoming', contactPerson: 'Frau Müller', createdAt: new Date('2025-04-15T09:35:00Z') },
    { id: 'comm-2', applicationId: '1', type: 'phone', subject: 'Terminbestätigung Gespräch 2', content: 'Termin am Di um 11 Uhr bestätigt.', date: new Date('2025-04-22T11:15:00Z'), direction: 'outgoing', contactPerson: 'Frau Müller', createdAt: new Date('2025-04-22T11:18:00Z') }
];
const INITIAL_REMINDERS: FollowUpReminder[] = [
    { id: 'rem-1', applicationId: '2', date: new Date('2025-04-28'), reminderText: 'Nachfassen bzgl. Bewerbung bei Innovative Systems AG', isCompleted: false, createdAt: new Date('2025-04-22T11:00:00Z') }
];
const INITIAL_DOCUMENTS: Document[] = [
    { id: 'doc-1', applicationId: '1', name: 'Lebenslauf_Max_Mustermann_2025.pdf', type: 'lebenslauf', fileType: 'application/pdf', fileSize: 123456, uploadDate: new Date('2025-04-10T15:00:00Z'), version: 1, fileData: 'data:application/pdf;base64,JVBERi0xLjQKJ...' }, // Beispiel Base64
    { id: 'doc-2', applicationId: '1', name: 'Anschreiben_TechSolutions.pdf', type: 'anschreiben', fileType: 'application/pdf', fileSize: 98765, uploadDate: new Date('2025-04-10T15:01:00Z'), version: 1, fileData: 'data:application/pdf;base64,JVBERi0xLjQKJ...' }
];
const INITIAL_STATUS_CHANGES: StatusChange[] = [
    { id: 'sc-1', applicationId: '1', oldStatus: 'Gesendet', newStatus: 'Gespräch', timestamp: new Date('2025-04-20T08:00:00Z') },
    { id: 'sc-2', applicationId: '2', oldStatus: null, newStatus: 'Gesendet', timestamp: new Date('2025-04-21T14:00:00Z') },
    { id: 'sc-3', applicationId: '3', oldStatus: 'Gespräch', newStatus: 'Absage', timestamp: new Date('2025-03-28T10:00:00Z') },
    { id: 'sc-4', applicationId: '4', oldStatus: 'Gesendet', newStatus: 'HR Screening', timestamp: new Date('2025-03-25T16:00:00Z') },
];

@Injectable({
  providedIn: 'root'
})
export class JobApplicationService {

  private applicationsSubject = new BehaviorSubject<Application[]>(INITIAL_APPLICATIONS);
  private notesSubject = new BehaviorSubject<Note[]>(INITIAL_NOTES);
  private communicationsSubject = new BehaviorSubject<Communication[]>(INITIAL_COMMUNICATIONS);
  private remindersSubject = new BehaviorSubject<FollowUpReminder[]>(INITIAL_REMINDERS);
  private documentsSubject = new BehaviorSubject<Document[]>(INITIAL_DOCUMENTS);
  private statusChangesSubject = new BehaviorSubject<StatusChange[]>(INITIAL_STATUS_CHANGES);

  public applications$ = this.applicationsSubject.asObservable();
  public notes$ = this.notesSubject.asObservable();
  public communications$ = this.communicationsSubject.asObservable();
  public reminders$ = this.remindersSubject.asObservable();
  public documents$ = this.documentsSubject.asObservable();
  public statusChanges$ = this.statusChangesSubject.asObservable();

  private static readonly statColors = {
    active: 'from-purple-600 to-pink-500',
    interview: 'from-blue-600 to-cyan-500',
    positive: 'from-pink-600 to-purple-500',
    declined: 'from-red-600 to-orange-500'
  };
  public stats$: Observable<Stat[]> = this.applicationsSubject.asObservable().pipe(
    map(apps => this.calculateStats(apps))
  );

  private eventsData: Event[] = [
     {
       id: 'evt-1', title: 'Vorstellungsgespräch', company: 'TechSolutions GmbH',
       time: '14:30 Uhr', date: this.getDateStringFor('today'), color: 'border-pink-500'
     },
     {
       id: 'evt-2', title: 'Nachfassen Call', company: 'Innovative Systems AG',
       time: '10:00 Uhr', date: this.getDateStringFor('tomorrow'), color: 'border-blue-500'
     }
  ];

  constructor() {
  }

  private getDateStringFor(day: 'today' | 'tomorrow'): string {
      const dt = new Date();
      if (day === 'tomorrow') {
        dt.setDate(dt.getDate() + 1);
      }
      const month = (dt.getMonth() + 1).toString().padStart(2, '0');
      const date = dt.getDate().toString().padStart(2, '0');
      return `${dt.getFullYear()}-${month}-${date}`;
  }

  private getColorForStatus(status: string): string {
      switch (status) {
        case 'Gespräch': return 'bg-gradient-to-r from-purple-600 to-pink-500';
        case 'Gesendet': return 'bg-gradient-to-r from-blue-600 to-cyan-500';
        case 'Absage': return 'bg-gradient-to-r from-red-600 to-orange-500';
        case 'HR Screening': return 'bg-gradient-to-r from-yellow-600 to-amber-500';
        case 'Angebot': return 'bg-gradient-to-r from-lime-500 to-green-500';
        case 'Wartend': return 'bg-gradient-to-r from-gray-400 to-gray-500';
        default: return 'bg-gradient-to-r from-gray-700 to-gray-800';
      }
  }

  private calculateStats(apps: Application[]): Stat[] {
      const totalApps = apps.length;
      const activeApps = apps.filter(app => app.status !== 'Absage').length;
      const interviews = apps.filter(app => app.status === 'Gespräch' || app.status === 'HR Screening').length;
      const positiveResponses = apps.filter(app => app.status === 'Gespräch' || app.status === 'Angebot').length;
      const declined = apps.filter(app => app.status === 'Absage').length;

      return [
        { title: 'Aktive Bewerbungen', value: activeApps, total: totalApps, color: '', borderColor: JobApplicationService.statColors.active },
        { title: 'Vorstellungsgespräche', value: interviews, color: '', borderColor: JobApplicationService.statColors.interview },
        { title: 'Positive Antworten', value: positiveResponses, total: totalApps, color: '', borderColor: JobApplicationService.statColors.positive },
        { title: 'Absagen', value: declined, total: totalApps, color: '', borderColor: JobApplicationService.statColors.declined }
      ];
  }

  getEvents(): Observable<Event[]> { return of(this.eventsData); }

  getApplications(): Observable<Application[]> {
    return this.applicationsSubject.asObservable();
  }

  getApplicationById(id: string | number): Observable<Application | undefined> {
    return this.applications$.pipe(
      map(apps => apps.find(app => app.id == id))
    );
  }

  addApplication(newApplicationData: Omit<Application, 'id' | 'color'>): Observable<Application> {
    const currentApplications = this.applicationsSubject.getValue();
    const color = this.getColorForStatus(newApplicationData.status);
    const newId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const appToAdd: Application = {
      ...newApplicationData,
      id: newId,
      color: color
    };
    const updatedApplications = [...currentApplications, appToAdd];
    this.applicationsSubject.next(updatedApplications);
    this.addStatusChangeInternal(appToAdd.id!, null, appToAdd.status);
    return of(appToAdd);
  }

  updateApplication(applicationDataToUpdate: Omit<Application, 'color'> & { id: string | number }): Observable<Application | undefined> {
    const currentApplications = this.applicationsSubject.getValue();
    const index = currentApplications.findIndex(app => app.id === applicationDataToUpdate.id);

    if (index !== -1) {
      const oldApplication = currentApplications[index];
      const color = this.getColorForStatus(applicationDataToUpdate.status);
      const updatedApplication: Application = {
        ...applicationDataToUpdate,
        color: color
      };
      if (oldApplication.status !== updatedApplication.status) {
        this.addStatusChangeInternal(updatedApplication.id!, oldApplication.status, updatedApplication.status);
      }
      const updatedApplicationsList = [...currentApplications.slice(0, index), updatedApplication, ...currentApplications.slice(index + 1)];
      this.applicationsSubject.next(updatedApplicationsList);
      return of(updatedApplication);
    } else {
      console.warn('Application not found for update:', applicationDataToUpdate.id);
      return of(undefined);
    }
  }

  deleteApplication(id: string | number): Observable<void> {
    const currentApplications = this.applicationsSubject.getValue();
    const updatedApplications = currentApplications.filter(app => app.id !== id);
    if (updatedApplications.length < currentApplications.length) {
      this.applicationsSubject.next(updatedApplications);
      const appIdString = String(id);
      this.notesSubject.next(this.notesSubject.getValue().filter(n => n.applicationId !== appIdString));
      this.communicationsSubject.next(this.communicationsSubject.getValue().filter(c => c.applicationId !== appIdString));
      this.remindersSubject.next(this.remindersSubject.getValue().filter(r => r.applicationId !== appIdString));
      this.documentsSubject.next(this.documentsSubject.getValue().filter(d => d.applicationId !== appIdString));
      this.statusChangesSubject.next(this.statusChangesSubject.getValue().filter(s => s.applicationId !== appIdString));
      return of(undefined);
    } else {
      console.warn('Application not found for deletion:', id);
      return of(undefined);
    }
  }

  private addStatusChangeInternal(applicationId: string | number, oldStatus: string | null, newStatus: string): void {
    const newChange: StatusChange = {
      id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      applicationId: String(applicationId),
      oldStatus,
      newStatus,
      timestamp: new Date()
    };
    const currentChanges = this.statusChangesSubject.getValue();
    this.statusChangesSubject.next([...currentChanges, newChange]);
  }

  getStatusChangesForApplication(applicationId: string): Observable<StatusChange[]> {
    return this.statusChanges$.pipe(
      map(changes => changes.filter(change => change.applicationId === applicationId))
    );
  }

  getNotesForApplication(applicationId: string): Observable<Note[]> {
    return this.notes$.pipe(
      map(notes => notes.filter(note => note.applicationId === applicationId))
    );
  }

  addNote(applicationId: string, content: string): Observable<Note> {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      applicationId, content, createdAt: new Date()
    };
    const currentNotes = this.notesSubject.getValue();
    this.notesSubject.next([...currentNotes, newNote]);
    return of(newNote);
  }

  updateNote(id: string, content: string): Observable<Note | undefined > {
    const currentNotes = this.notesSubject.getValue();
    const index = currentNotes.findIndex(note => note.id === id);
    if (index !== -1) {
      const updatedNote = { ...currentNotes[index], content, updatedAt: new Date() };
      const updatedNotes = [...currentNotes.slice(0, index), updatedNote, ...currentNotes.slice(index + 1)];
      this.notesSubject.next(updatedNotes);
      return of(updatedNote);
    }
    console.error('Note not found for update:', id);
    return of(undefined);
  }

  deleteNote(id: string): Observable<void> {
    const currentNotes = this.notesSubject.getValue();
    const updatedNotes = currentNotes.filter(note => note.id !== id);
    this.notesSubject.next(updatedNotes);
    return of(undefined);
  }

  getCommunicationsForApplication(applicationId: string): Observable<Communication[]> {
    return this.communications$.pipe(
      map(comms => comms.filter(comm => comm.applicationId === applicationId))
    );
  }

  addCommunication(applicationId: string, communication: Omit<Communication, 'id' | 'createdAt' | 'applicationId'>): Observable<Communication> {
    const newComm: Communication = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      applicationId, ...communication, createdAt: new Date()
    };
    const currentComms = this.communicationsSubject.getValue();
    this.communicationsSubject.next([...currentComms, newComm]);
    return of(newComm);
  }

  getRemindersForApplication(applicationId: string): Observable<FollowUpReminder[]> {
    return this.reminders$.pipe(
      map(reminders => reminders.filter(reminder => reminder.applicationId === applicationId))
    );
  }

  addReminder(applicationId: string, date: Date, reminderText: string): Observable<FollowUpReminder> {
    const newReminder: FollowUpReminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      applicationId, date, reminderText, isCompleted: false, createdAt: new Date()
    };
    const currentReminders = this.remindersSubject.getValue();
    this.remindersSubject.next([...currentReminders, newReminder]);
    return of(newReminder);
  }

  toggleReminderCompletion(id: string): Observable<FollowUpReminder | undefined> {
    const currentReminders = this.remindersSubject.getValue();
    const index = currentReminders.findIndex(reminder => reminder.id === id);
    if (index !== -1) {
      const updatedReminder = { ...currentReminders[index], isCompleted: !currentReminders[index].isCompleted };
      const updatedReminders = [...currentReminders.slice(0, index), updatedReminder, ...currentReminders.slice(index + 1)];
      this.remindersSubject.next(updatedReminders);
      return of(updatedReminder);
    }
    console.error('Reminder not found for toggle:', id)
    return of(undefined);
  }

  getDocumentsForApplication(applicationId: string): Observable<Document[]> {
    return this.documents$.pipe(
      map(docs => docs.filter(doc => doc.applicationId === applicationId))
    );
  }

  addDocument(documentData: Omit<Document, 'id' | 'uploadDate'>): Observable<Document> {
    const newDocument: Document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      ...documentData, uploadDate: new Date(), version: 1
    };
    const currentDocs = this.documentsSubject.getValue();
    const existingDocsOfType = currentDocs.filter(doc => doc.applicationId === documentData.applicationId && doc.type === documentData.type);
    if (existingDocsOfType.length > 0) {
        newDocument.version = Math.max(...existingDocsOfType.map(d => d.version || 0)) + 1;
    }
    this.documentsSubject.next([...currentDocs, newDocument]);
    return of(newDocument);
  }

  deleteDocument(id: string): Observable<void> {
    const currentDocs = this.documentsSubject.getValue();
    const updatedDocs = currentDocs.filter(doc => doc.id !== id);
    this.documentsSubject.next(updatedDocs);
    return of(undefined);
  }

  getTimelineForApplication(applicationId: string): Observable<TimelineItem[]> {
    const appIdString = String(applicationId);
    return combineLatest([
        this.getStatusChangesForApplication(appIdString),
        this.getNotesForApplication(appIdString),
        this.getCommunicationsForApplication(appIdString),
        this.getRemindersForApplication(appIdString),
        this.getDocumentsForApplication(appIdString)
    ]).pipe(
        map(([statusChanges, notes, communications, reminders, documents]) => {
            const timelineItems: TimelineItem[] = [];
            statusChanges.forEach(change => timelineItems.push({
                id: `timeline-${change.id}`, timestamp: change.timestamp, type: 'StatusChange',
                data: change, title: `Status: ${change.newStatus}`, icon: 'status'
            }));
            notes.forEach(note => timelineItems.push({
                id: `timeline-${note.id}`, timestamp: note.updatedAt || note.createdAt, type: 'Note',
                data: note, title: note.updatedAt ? 'Notiz bearbeitet' : 'Notiz hinzugefügt', icon: 'note'
            }));
            communications.forEach(comm => {
                 let commTitle = 'Kommunikation';
                 if (comm.type === 'email') commTitle = 'E-Mail';
                 if (comm.type === 'phone') commTitle = 'Telefonat';
                 if (comm.type === 'meeting') commTitle = 'Meeting';
                 commTitle += comm.direction === 'outgoing' ? ' (Ausgehend)' : ' (Eingehend)';
                 timelineItems.push({
                    id: `timeline-${comm.id}`, timestamp: comm.date, type: 'Communication',
                    data: comm, title: `${commTitle}: ${comm.subject || '(Kein Betreff)'}`, icon: comm.type
                })
            });
            reminders.forEach(reminder => timelineItems.push({
                id: `timeline-${reminder.id}`, timestamp: reminder.createdAt, type: 'Reminder',
                data: reminder, title: `Erinnerung erstellt`, icon: 'reminder'
            }));
            documents.forEach(doc => timelineItems.push({
              id: `timeline-${doc.id}`, timestamp: doc.uploadDate, type: 'Document',
              data: doc, title: `Dokument hochgeladen: ${doc.name}`, icon: 'document'
            }));
            timelineItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            return timelineItems;
        })
    );
  }

  getApplicationsWithActivity(): Observable<Application[]> {
    return combineLatest([
      this.applications$,
      this.notes$,
      this.communications$,
      this.reminders$,
      this.documents$
    ]).pipe(
      map(([applications, notes, communications, reminders, documents]) => {
        return applications.map(app => {
          const currentAppId = String(app.id);
          const hasNotes = notes.some(note => note.applicationId === currentAppId);
          const hasCommunications = communications.some(comm => comm.applicationId === currentAppId);
          const hasReminders = reminders.some(reminder => reminder.applicationId === currentAppId);
          const hasDocuments = documents.some(doc => doc.applicationId === currentAppId);
          return { ...app, hasNotes, hasCommunications, hasReminders, hasDocuments };
        });
      })
    );
  }
}