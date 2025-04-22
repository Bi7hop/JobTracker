import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, map, combineLatest } from 'rxjs';
import { Application, Event, Stat, Note, Communication, FollowUpReminder } from '../models/job-tracker.models';

const INITIAL_APPLICATIONS: Application[] = [
  { id: '1', company: 'TechSolutions GmbH', location: 'München', position: 'Senior Angular Dev', status: 'Gespräch', date: 'Heute', color: 'bg-gradient-to-r from-purple-600 to-pink-500' },
  { id: '2', company: 'Innovative Systems AG', location: 'Berlin', position: 'Angular Entwickler', status: 'Gesendet', date: 'Gestern', color: 'bg-gradient-to-r from-blue-600 to-cyan-500' },
  { id: '3', company: 'DataVision GmbH', location: 'Remote', position: 'Frontend Architect', status: 'Absage', date: '28.03.25', color: 'bg-gradient-to-r from-green-600 to-emerald-500' },
  { id: '4', company: 'CodeMasters KG', location: 'Hamburg', position: 'JavaScript Developer', status: 'HR Screening', date: '25.03.25', color: 'bg-gradient-to-r from-yellow-600 to-amber-500' }
];

@Injectable({
  providedIn: 'root'
})
export class JobApplicationService {

  private static readonly statColors = {
    active: 'from-purple-600 to-pink-500',
    interview: 'from-blue-600 to-cyan-500',
    positive: 'from-pink-600 to-purple-500',
    declined: 'from-red-600 to-orange-500'
  };

  private applicationsSubject = new BehaviorSubject<Application[]>(INITIAL_APPLICATIONS);

  public stats$: Observable<Stat[]> = this.applicationsSubject.asObservable().pipe(
    map(apps => this.calculateStats(apps))
  );

  // Angepasste Events mit ID und Datum
  private eventsData: Event[] = [
    {
      id: 'evt-1',
      title: 'Vorstellungsgespräch',
      company: 'TechSolutions GmbH',
      time: '14:30 Uhr',
      date: this.getDateStringFor('today'),
      color: 'border-pink-500'
    },
    {
      id: 'evt-2',
      title: 'HR Call',
      company: 'CodeMasters KG',
      time: '10:00 Uhr',
      date: this.getDateStringFor('tomorrow'),
      color: 'border-blue-500'
    }
  ];

  constructor() { }

  // Hilfsmethode für Datums-Strings
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
      case 'Absage': return 'bg-gradient-to-r from-green-600 to-emerald-500';
      case 'HR Screening': return 'bg-gradient-to-r from-yellow-600 to-amber-500';
      case 'Angebot': return 'bg-gradient-to-r from-lime-500 to-green-500';
      case 'Wartend': return 'bg-gradient-to-r from-gray-400 to-gray-500';
      default: return 'bg-gradient-to-r from-gray-700 to-gray-800';
    }
  }

  getApplications(): Observable<Application[]> {
    return this.applicationsSubject.asObservable();
  }

  getApplicationById(id: string | number): Observable<Application | undefined> {
    return this.applicationsSubject.asObservable().pipe(
      map(apps => apps.find(app => app.id == id))
    );
  }

  addApplication(newApplicationData: Omit<Application, 'id' | 'color'>): Observable<Application> {
    const currentApplications = this.applicationsSubject.getValue();
    const color = this.getColorForStatus(newApplicationData.status);
    const appToAdd: Application = {
        ...newApplicationData,
        id: Date.now().toString(),
        color: color
      };
    const updatedApplications = [...currentApplications, appToAdd];
    this.applicationsSubject.next(updatedApplications);
    return of(appToAdd);
  }

  updateApplication(applicationDataToUpdate: Omit<Application, 'color'> & { id: string | number }): Observable<Application | undefined> {
    const currentApplications = this.applicationsSubject.getValue();
    const index = currentApplications.findIndex(app => app.id === applicationDataToUpdate.id);

    if (index !== -1) {
      const color = this.getColorForStatus(applicationDataToUpdate.status);
      const updatedApplication: Application = {
        ...applicationDataToUpdate,
        color: color
      };
      const updatedApplicationsList = [
        ...currentApplications.slice(0, index),
        updatedApplication,
        ...currentApplications.slice(index + 1)
      ];
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
      return of(undefined);
    } else {
      console.warn('Application not found for deletion:', id);
      return of(undefined);
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

  getEvents(): Observable<Event[]> {
    // 'isToday' wird hier nicht mehr explizit behandelt, da Datum vorhanden
    return of(this.eventsData);
  }

  // Notes Management
  private notesSubject = new BehaviorSubject<Note[]>([]);
  notes$ = this.notesSubject.asObservable();

  getNotesForApplication(applicationId: string): Observable<Note[]> {
    return this.notes$.pipe(
      map(notes => notes.filter(note => note.applicationId === applicationId))
    );
  }

  addNote(applicationId: string, content: string): Observable<Note> {
    const newNote: Note = {
      id: Date.now().toString(),
      applicationId,
      content,
      createdAt: new Date()
    };
    
    const currentNotes = this.notesSubject.getValue();
    this.notesSubject.next([...currentNotes, newNote]);
    return of(newNote);
  }

  updateNote(id: string, content: string): Observable<Note> {
    const currentNotes = this.notesSubject.getValue();
    const index = currentNotes.findIndex(note => note.id === id);
    
    if (index !== -1) {
      const updatedNote = {
        ...currentNotes[index],
        content,
        updatedAt: new Date()
      };
      
      const updatedNotes = [
        ...currentNotes.slice(0, index),
        updatedNote,
        ...currentNotes.slice(index + 1)
      ];
      
      this.notesSubject.next(updatedNotes);
      return of(updatedNote);
    }
    
    throw new Error('Note not found');
  }

  deleteNote(id: string): Observable<void> {
    const currentNotes = this.notesSubject.getValue();
    const updatedNotes = currentNotes.filter(note => note.id !== id);
    this.notesSubject.next(updatedNotes);
    return of(undefined);
  }

  // Communication Management
  private communicationsSubject = new BehaviorSubject<Communication[]>([]);
  communications$ = this.communicationsSubject.asObservable();

  getCommunicationsForApplication(applicationId: string): Observable<Communication[]> {
    return this.communications$.pipe(
      map(comms => comms.filter(comm => comm.applicationId === applicationId))
    );
  }

  addCommunication(applicationId: string, communication: Omit<Communication, 'id' | 'createdAt' | 'applicationId'>): Observable<Communication> {
    const newComm: Communication = {
      id: Date.now().toString(),
      applicationId,
      ...communication,
      createdAt: new Date()
    };
    
    const currentComms = this.communicationsSubject.getValue();
    this.communicationsSubject.next([...currentComms, newComm]);
    return of(newComm);
  }

  // Follow-up Reminders Management
  private remindersSubject = new BehaviorSubject<FollowUpReminder[]>([]);
  reminders$ = this.remindersSubject.asObservable();

  getRemindersForApplication(applicationId: string): Observable<FollowUpReminder[]> {
    return this.reminders$.pipe(
      map(reminders => reminders.filter(reminder => reminder.applicationId === applicationId))
    );
  }

  addReminder(applicationId: string, date: Date, reminderText: string): Observable<FollowUpReminder> {
    const newReminder: FollowUpReminder = {
      id: Date.now().toString(),
      applicationId,
      date,
      reminderText,
      isCompleted: false,
      createdAt: new Date()
    };
    
    const currentReminders = this.remindersSubject.getValue();
    this.remindersSubject.next([...currentReminders, newReminder]);
    return of(newReminder);
  }

  toggleReminderCompletion(id: string): Observable<FollowUpReminder> {
    const currentReminders = this.remindersSubject.getValue();
    const index = currentReminders.findIndex(reminder => reminder.id === id);
    
    if (index !== -1) {
      const updatedReminder = {
        ...currentReminders[index],
        isCompleted: !currentReminders[index].isCompleted
      };
      
      const updatedReminders = [
        ...currentReminders.slice(0, index),
        updatedReminder,
        ...currentReminders.slice(index + 1)
      ];
      
      this.remindersSubject.next(updatedReminders);
      return of(updatedReminder);
    }
    
    throw new Error('Reminder not found');
  }

  // Neue Methode für Applications mit Activity
  getApplicationsWithActivity(): Observable<Application[]> {
    return combineLatest([
      this.applicationsSubject.asObservable(),
      this.notes$,
      this.communications$,
      this.reminders$
    ]).pipe(
      map(([applications, notes, communications, reminders]) => {
        return applications.map(app => {
          const hasNotes = notes.some(note => note.applicationId === app.id);
          const hasCommunications = communications.some(comm => comm.applicationId === app.id);
          const hasReminders = reminders.some(reminder => reminder.applicationId === app.id);
          
          return {
            ...app,
            hasNotes,
            hasCommunications,
            hasReminders
          };
        });
      })
    );
  }

}