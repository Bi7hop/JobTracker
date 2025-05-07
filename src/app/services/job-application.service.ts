import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, from, map, switchMap, tap, catchError, combineLatest, forkJoin, throwError } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
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

@Injectable({
  providedIn: 'root'
})
export class JobApplicationService {

  private applicationsSubject = new BehaviorSubject<Application[]>([]);
  private notesSubject = new BehaviorSubject<Note[]>([]);
  private communicationsSubject = new BehaviorSubject<Communication[]>([]);
  private remindersSubject = new BehaviorSubject<FollowUpReminder[]>([]);
  private documentsSubject = new BehaviorSubject<Document[]>([]);
  private statusChangesSubject = new BehaviorSubject<StatusChange[]>([]);
  private eventsSubject = new BehaviorSubject<Event[]>([]);

  public applications$ = this.applicationsSubject.asObservable();
  public notes$ = this.notesSubject.asObservable();
  public communications$ = this.communicationsSubject.asObservable();
  public reminders$ = this.remindersSubject.asObservable();
  public documents$ = this.documentsSubject.asObservable();
  public statusChanges$ = this.statusChangesSubject.asObservable();
  public events$ = this.eventsSubject.asObservable();

  private static readonly statColors = {
    active: 'from-purple-600 to-pink-500',
    interview: 'from-blue-600 to-cyan-500',
    positive: 'from-pink-600 to-purple-500',
    declined: 'from-red-600 to-orange-500'
  };

  public stats$: Observable<Stat[]> = this.applicationsSubject.asObservable().pipe(
    map(apps => this.calculateStats(apps))
  );

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    combineLatest([
      this.authService.isAuth$,
      this.authService.profileLoaded$
    ]).subscribe(([isAuthenticated, profileLoaded]) => {
      if (isAuthenticated && profileLoaded) {
        this.initializeData();
      } else {
        this.clearData();
      }
    });
  }

  private initializeData(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return;
    }
    
    this.loadApplications();
    this.loadNotes();
    this.loadCommunications();
    this.loadReminders();
    this.loadDocuments();
    this.loadStatusChanges();
    this.loadEvents();
  }

  private clearData(): void {
    this.applicationsSubject.next([]);
    this.notesSubject.next([]);
    this.communicationsSubject.next([]);
    this.remindersSubject.next([]);
    this.documentsSubject.next([]);
    this.statusChangesSubject.next([]);
    this.eventsSubject.next([]);
  }

  private loadApplications(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.applicationsSubject.next([]);
      return;
    }
    
    from(this.supabaseService.client
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        return (response.data || []).map(app => ({
          id: app.id,
          company: app.company,
          location: app.location || '',
          position: app.position,
          status: app.status,
          date: app.date,
          color: app.color || this.getColorForStatus(app.status),
          appointmentDate: app.appointment_date
        }));
      }),
      catchError(error => {
        return of([]);
      })
    ).subscribe(applications => {
      this.applicationsSubject.next(applications);
    });
  }

  getApplications(): Observable<Application[]> {
    return this.applications$;
  }

  getApplicationById(id: string | number): Observable<Application | undefined> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return of(undefined);
    }
    
    return from(this.supabaseService.client
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    ).pipe(
      map(response => {
        if (response.error) {
          if (response.error.code === 'PGRST116') {
            return undefined;
          }
          throw response.error;
        };
        if (!response.data) return undefined;

        return {
          id: response.data.id,
          company: response.data.company,
          location: response.data.location || '',
          position: response.data.position,
          status: response.data.status,
          date: response.data.date,
          color: response.data.color || this.getColorForStatus(response.data.status),
          appointmentDate: response.data.appointment_date
        };
      }),
      catchError(error => {
        return of(undefined);
      })
    );
  }

  addApplication(newApplicationData: Omit<Application, 'id' | 'color'>): Observable<Application> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    const color = this.getColorForStatus(newApplicationData.status);
    const appointmentDateValue = newApplicationData.status === 'Gespräch' ? newApplicationData.appointmentDate : null;

    return from(this.supabaseService.client
      .from('applications')
      .insert([{
        company: newApplicationData.company,
        location: newApplicationData.location || '',
        position: newApplicationData.position,
        status: newApplicationData.status,
        date: newApplicationData.date,
        color,
        appointment_date: appointmentDateValue,
        user_id: userId
      }])
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        if (!response.data || response.data.length === 0) throw new Error('No data returned after insert');

        const newAppDb = response.data[0];

        const appToAdd: Application = {
          id: newAppDb.id,
          company: newAppDb.company,
          location: newAppDb.location || '',
          position: newAppDb.position,
          status: newAppDb.status,
          date: newAppDb.date,
          color: newAppDb.color,
          appointmentDate: newAppDb.appointment_date
        };

        const currentApps = this.applicationsSubject.getValue();
        this.applicationsSubject.next([...currentApps, appToAdd]);

        this.addStatusChangeInternal(appToAdd.id!, null, appToAdd.status);

        return appToAdd;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  updateApplication(applicationDataToUpdate: Omit<Application, 'color'> & { id: string | number }): Observable<Application | undefined> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    const color = this.getColorForStatus(applicationDataToUpdate.status);
    const appointmentDateValue = applicationDataToUpdate.status === 'Gespräch' ? applicationDataToUpdate.appointmentDate : null;

    return this.getApplicationById(applicationDataToUpdate.id).pipe(
      switchMap(currentApp => {
        if (!currentApp) {
          return of(undefined);
        }
        
        return from(this.supabaseService.client
          .from('applications')
          .update({
            company: applicationDataToUpdate.company,
            location: applicationDataToUpdate.location || '',
            position: applicationDataToUpdate.position,
            status: applicationDataToUpdate.status,
            date: applicationDataToUpdate.date,
            color,
            appointment_date: appointmentDateValue
          })
          .eq('id', applicationDataToUpdate.id)
          .eq('user_id', userId)
          .select()
        ).pipe(
          map(response => {
            if (response.error) throw response.error;
            if (!response.data || response.data.length === 0) return undefined;

            const updatedAppDb = response.data[0];

            const updatedApp: Application = {
              id: updatedAppDb.id,
              company: updatedAppDb.company,
              location: updatedAppDb.location || '',
              position: updatedAppDb.position,
              status: updatedAppDb.status,
              date: updatedAppDb.date,
              color: updatedAppDb.color,
              appointmentDate: updatedAppDb.appointment_date
            };

            const currentApps = this.applicationsSubject.getValue();
            const updatedApps = currentApps.map(app =>
              app.id === updatedApp.id ? updatedApp : app
            );
            this.applicationsSubject.next(updatedApps);

            if (currentApp && currentApp.status !== updatedApp.status) {
              this.addStatusChangeInternal(updatedApp.id!, currentApp.status, updatedApp.status);
            }

            return updatedApp;
          })
        );
      }),
      catchError(error => {
        return of(undefined);
      })
    );
  }

  deleteApplication(id: string | number): Observable<void> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    const idString = String(id);
    this.notesSubject.next(this.notesSubject.getValue().filter(n => n.applicationId !== idString));
    this.communicationsSubject.next(this.communicationsSubject.getValue().filter(c => c.applicationId !== idString));
    this.remindersSubject.next(this.remindersSubject.getValue().filter(r => r.applicationId !== idString));
    this.documentsSubject.next(this.documentsSubject.getValue().filter(d => d.applicationId !== idString));
    this.statusChangesSubject.next(this.statusChangesSubject.getValue().filter(s => s.applicationId !== idString));

    return from(this.supabaseService.client
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        const currentApps = this.applicationsSubject.getValue();
        this.applicationsSubject.next(currentApps.filter(app => app.id !== id));

        return undefined;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  private loadNotes(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.notesSubject.next([]);
      return;
    }
    
    from(this.supabaseService.client
      .from('notes')
      .select('*, applications!inner(*)')
      .eq('applications.user_id', userId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        return (response.data || []).map(note => ({
          id: note.id,
          applicationId: note.application_id,
          content: note.content,
          createdAt: new Date(note.created_at),
          updatedAt: note.updated_at ? new Date(note.updated_at) : undefined
        }));
      }),
      catchError(error => {
        return of([]);
      })
    ).subscribe(notes => {
      this.notesSubject.next(notes);
    });
  }

  getNotesForApplication(applicationId: string): Observable<Note[]> {
    return this.notes$.pipe(
      map(notes => notes.filter(note => note.applicationId === applicationId))
    );
  }

  addNote(applicationId: string, content: string): Observable<Note> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    return this.getApplicationById(applicationId).pipe(
      switchMap(application => {
        if (!application) {
          return throwError(() => new Error('Application not found or access denied'));
        }
        
        return from(this.supabaseService.client
          .from('notes')
          .insert([{
            application_id: applicationId,
            content
          }])
          .select()
        ).pipe(
          map(response => {
            if (response.error) throw response.error;
            if (!response.data || response.data.length === 0) throw new Error('No data returned after insert');

            const newNote = response.data[0];

            const noteObj: Note = {
              id: newNote.id,
              applicationId: newNote.application_id,
              content: newNote.content,
              createdAt: new Date(newNote.created_at)
            };

            const currentNotes = this.notesSubject.getValue();
            this.notesSubject.next([...currentNotes, noteObj]);

            return noteObj;
          })
        );
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  updateNote(id: string, content: string): Observable<Note | undefined> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    return from(this.supabaseService.client
      .from('notes')
      .select('*, applications!inner(*)')
      .eq('id', id)
      .eq('applications.user_id', userId)
      .single()
    ).pipe(
      switchMap(noteResponse => {
        if (noteResponse.error || !noteResponse.data) {
          return of(undefined);
        }
        
        return from(this.supabaseService.client
          .from('notes')
          .update({
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
        ).pipe(
          map(response => {
            if (response.error) throw response.error;
            if (!response.data || response.data.length === 0) return undefined;

            const updatedNote = response.data[0];

            const noteObj: Note = {
              id: updatedNote.id,
              applicationId: updatedNote.application_id,
              content: updatedNote.content,
              createdAt: new Date(updatedNote.created_at),
              updatedAt: new Date(updatedNote.updated_at)
            };

            const currentNotes = this.notesSubject.getValue();
            this.notesSubject.next(currentNotes.map(note => note.id === id ? noteObj : note));

            return noteObj;
          })
        );
      }),
      catchError(error => {
        return of(undefined);
      })
    );
  }

  deleteNote(id: string): Observable<void> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    return from(this.supabaseService.client
      .from('notes')
      .select('*, applications!inner(*)')
      .eq('id', id)
      .eq('applications.user_id', userId)
      .single()
    ).pipe(
      switchMap(noteResponse => {
        if (noteResponse.error || !noteResponse.data) {
          return throwError(() => new Error('Note not found or access denied'));
        }
        
        return from(this.supabaseService.client
          .from('notes')
          .delete()
          .eq('id', id)
        ).pipe(
          map(response => {
            if (response.error) throw response.error;

            const currentNotes = this.notesSubject.getValue();
            this.notesSubject.next(currentNotes.filter(note => note.id !== id));

            return undefined;
          })
        );
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  private loadCommunications(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.communicationsSubject.next([]);
      return;
    }
    
    from(this.supabaseService.client
      .from('communications')
      .select('*, applications!inner(*)')
      .eq('applications.user_id', userId)
      .order('date', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        return (response.data || []).map(comm => ({
          id: comm.id,
          applicationId: comm.application_id,
          type: comm.type,
          subject: comm.subject,
          content: comm.content,
          date: new Date(comm.date),
          direction: comm.direction,
          contactPerson: comm.contact_person,
          createdAt: new Date(comm.created_at)
        }));
      }),
      catchError(error => {
        return of([]);
      })
    ).subscribe(communications => {
      this.communicationsSubject.next(communications);
    });
  }

  getCommunicationsForApplication(applicationId: string): Observable<Communication[]> {
    return this.communications$.pipe(
      map(comms => comms.filter(comm => comm.applicationId === applicationId))
    );
  }

  addCommunication(applicationId: string, communication: Omit<Communication, 'id' | 'createdAt' | 'applicationId'>): Observable<Communication> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    return this.getApplicationById(applicationId).pipe(
      switchMap(application => {
        if (!application) {
          return throwError(() => new Error('Application not found or access denied'));
        }
        
        return from(this.supabaseService.client
          .from('communications')
          .insert([{
            application_id: applicationId,
            type: communication.type,
            subject: communication.subject,
            content: communication.content,
            date: communication.date.toISOString(),
            direction: communication.direction,
            contact_person: communication.contactPerson
          }])
          .select()
        ).pipe(
          map(response => {
            if (response.error) throw response.error;
            if (!response.data || response.data.length === 0) throw new Error('No data returned after insert');

            const newComm = response.data[0];

            const commObj: Communication = {
              id: newComm.id,
              applicationId: newComm.application_id,
              type: newComm.type,
              subject: newComm.subject,
              content: newComm.content,
              date: new Date(newComm.date),
              direction: newComm.direction,
              contactPerson: newComm.contact_person,
              createdAt: new Date(newComm.created_at)
            };

            const currentComms = this.communicationsSubject.getValue();
            this.communicationsSubject.next([...currentComms, commObj]);

            return commObj;
          })
        );
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  private loadReminders(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.remindersSubject.next([]);
      return;
    }
    
    from(this.supabaseService.client
      .from('reminders')
      .select('*, applications!inner(*)')
      .eq('applications.user_id', userId)
      .order('date', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        return (response.data || []).map(reminder => ({
          id: reminder.id,
          applicationId: reminder.application_id,
          date: new Date(reminder.date),
          reminderText: reminder.reminder_text,
          isCompleted: reminder.is_completed,
          createdAt: new Date(reminder.created_at),
          notificationShown: reminder.notification_shown,
          notifyBefore: reminder.notify_before
        }));
      }),
      catchError(error => {
        return of([]);
      })
    ).subscribe(reminders => {
      this.remindersSubject.next(reminders);
    });
  }

  getRemindersForApplication(applicationId: string): Observable<FollowUpReminder[]> {
    return this.reminders$.pipe(
      map(reminders => reminders.filter(reminder => reminder.applicationId === applicationId))
    );
  }

  addReminder(applicationId: string, date: Date, reminderText: string, notifyBefore: number = 60): Observable<FollowUpReminder> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    return this.getApplicationById(applicationId).pipe(
      switchMap(application => {
        if (!application) {
          return throwError(() => new Error('Application not found or access denied'));
        }
        
        return from(this.supabaseService.client
          .from('reminders')
          .insert([{
            application_id: applicationId,
            date: date.toISOString(),
            reminder_text: reminderText,
            is_completed: false,
            notification_shown: false,
            notify_before: notifyBefore
          }])
          .select()
        ).pipe(
          map(response => {
            if (response.error) throw response.error;
            if (!response.data || response.data.length === 0) throw new Error('No data returned after insert');

            const newReminder = response.data[0];

            const reminderObj: FollowUpReminder = {
              id: newReminder.id,
              applicationId: newReminder.application_id,
              date: new Date(newReminder.date),
              reminderText: newReminder.reminder_text,
              isCompleted: newReminder.is_completed,
              createdAt: new Date(newReminder.created_at),
              notificationShown: newReminder.notification_shown,
              notifyBefore: newReminder.notify_before
            };

            const currentReminders = this.remindersSubject.getValue();
            this.remindersSubject.next([...currentReminders, reminderObj]);

            return reminderObj;
          })
        );
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  toggleReminderCompletion(id: string): Observable<FollowUpReminder | undefined> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    return from(this.supabaseService.client
      .from('reminders')
      .select('*, applications!inner(*)')
      .eq('id', id)
      .eq('applications.user_id', userId)
      .single()
    ).pipe(
      switchMap(response => {
        if (response.error) throw response.error;
        if (!response.data) return of(undefined);

        const currentReminder = response.data;
        const newState = !currentReminder.is_completed;

        return from(this.supabaseService.client
          .from('reminders')
          .update({ is_completed: newState })
          .eq('id', id)
          .select()
        ).pipe(
          map(updateResponse => {
            if (updateResponse.error) throw updateResponse.error;
            if (!updateResponse.data || updateResponse.data.length === 0) return undefined;

            const updatedReminder = updateResponse.data[0];

            const reminderObj: FollowUpReminder = {
              id: updatedReminder.id,
              applicationId: updatedReminder.application_id,
              date: new Date(updatedReminder.date),
              reminderText: updatedReminder.reminder_text,
              isCompleted: updatedReminder.is_completed,
              createdAt: new Date(updatedReminder.created_at),
              notificationShown: updatedReminder.notification_shown,
              notifyBefore: updatedReminder.notify_before
            };

            const currentReminders = this.remindersSubject.getValue();
            this.remindersSubject.next(currentReminders.map(rem => rem.id === id ? reminderObj : rem));

            return reminderObj;
          })
        );
      }),
      catchError(error => {
        return of(undefined);
      })
    );
  }

  updateReminderDate(id: string, minutesToAdd: number): Observable<FollowUpReminder | undefined> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    return from(this.supabaseService.client
      .from('reminders')
      .select('*, applications!inner(*)')
      .eq('id', id)
      .eq('applications.user_id', userId)
      .single()
    ).pipe(
      switchMap(response => {
        if (response.error) throw response.error;
        if (!response.data) return of(undefined);

        const currentReminder = response.data;
        const currentDate = new Date(currentReminder.date);
        const newDate = new Date(currentDate.getTime() + minutesToAdd * 60000);

        return from(this.supabaseService.client
          .from('reminders')
          .update({
            date: newDate.toISOString(),
            notification_shown: false
          })
          .eq('id', id)
          .select()
        ).pipe(
          map(updateResponse => {
            if (updateResponse.error) throw updateResponse.error;
            if (!updateResponse.data || updateResponse.data.length === 0) return undefined;

            const updatedReminder = updateResponse.data[0];

            const reminderObj: FollowUpReminder = {
              id: updatedReminder.id,
              applicationId: updatedReminder.application_id,
              date: new Date(updatedReminder.date),
              reminderText: updatedReminder.reminder_text,
              isCompleted: updatedReminder.is_completed,
              createdAt: new Date(updatedReminder.created_at),
              notificationShown: updatedReminder.notification_shown,
              notifyBefore: updatedReminder.notify_before
            };

            const currentReminders = this.remindersSubject.getValue();
            this.remindersSubject.next(currentReminders.map(rem => rem.id === id ? reminderObj : rem));

            return reminderObj;
          })
        );
      }),
      catchError(error => {
        return of(undefined);
      })
    );
  }

  markReminderNotificationShown(id: string): Observable<void> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    return from(this.supabaseService.client
      .from('reminders')
      .select('*, applications!inner(*)')
      .eq('id', id)
      .eq('applications.user_id', userId)
      .single()
    ).pipe(
      switchMap(response => {
        if (response.error) throw response.error;
        if (!response.data) return throwError(() => new Error('Reminder not found or access denied'));
        
        return from(this.supabaseService.client
          .from('reminders')
          .update({ notification_shown: true })
          .eq('id', id)
        ).pipe(
          map(updateResponse => {
            if (updateResponse.error) throw updateResponse.error;

            const currentReminders = this.remindersSubject.getValue();
            this.remindersSubject.next(currentReminders.map(rem => {
              if (rem.id === id) {
                return { ...rem, notificationShown: true };
              }
              return rem;
            }));

            return undefined;
          })
        );
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  private loadDocuments(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.documentsSubject.next([]);
      return;
    }
    
    from(this.supabaseService.client
      .from('documents')
      .select('*, applications!inner(*)')
      .eq('applications.user_id', userId)
      .order('upload_date', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        return (response.data || []).map(doc => ({
          id: doc.id,
          applicationId: doc.application_id,
          name: doc.name,
          type: doc.type,
          fileType: doc.file_type,
          fileSize: doc.file_size,
          uploadDate: new Date(doc.upload_date),
          tags: doc.tags,
          version: doc.version,
          fileData: doc.file_data
        }));
      }),
      catchError(error => {
        return of([]);
      })
    ).subscribe(documents => {
      this.documentsSubject.next(documents);
    });
  }

  getDocumentsForApplication(applicationId: string): Observable<Document[]> {
    return this.documents$.pipe(
      map(docs => docs.filter(doc => doc.applicationId === applicationId))
    );
  }

  addDocument(documentData: Omit<Document, 'id' | 'uploadDate'>): Observable<Document> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    return this.getApplicationById(documentData.applicationId).pipe(
      switchMap(application => {
        if (!application) {
          return throwError(() => new Error('Application not found or access denied'));
        }
        
        return from(this.supabaseService.client
          .from('documents')
          .insert([{
            application_id: documentData.applicationId,
            name: documentData.name,
            type: documentData.type,
            file_type: documentData.fileType,
            file_size: documentData.fileSize,
            tags: documentData.tags || [],
            version: documentData.version || 1,
            file_data: documentData.fileData
          }])
          .select()
        ).pipe(
          map(response => {
            if (response.error) throw response.error;
            if (!response.data || response.data.length === 0) throw new Error('No data returned after insert');

            const newDoc = response.data[0];

            const docObj: Document = {
              id: newDoc.id,
              applicationId: newDoc.application_id,
              name: newDoc.name,
              type: newDoc.type,
              fileType: newDoc.file_type,
              fileSize: newDoc.file_size,
              uploadDate: new Date(newDoc.upload_date),
              tags: newDoc.tags,
              version: newDoc.version,
              fileData: newDoc.file_data
            };

            const currentDocs = this.documentsSubject.getValue();
            this.documentsSubject.next([...currentDocs, docObj]);

            return docObj;
          })
        );
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  deleteDocument(id: string): Observable<void> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    return from(this.supabaseService.client
      .from('documents')
      .select('*, applications!inner(*)')
      .eq('id', id)
      .eq('applications.user_id', userId)
      .single()
    ).pipe(
      switchMap(docResponse => {
        if (docResponse.error || !docResponse.data) {
          return throwError(() => new Error('Document not found or access denied'));
        }
        
        return from(this.supabaseService.client
          .from('documents')
          .delete()
          .eq('id', id)
        ).pipe(
          map(response => {
            if (response.error) throw response.error;

            const currentDocs = this.documentsSubject.getValue();
            this.documentsSubject.next(currentDocs.filter(doc => doc.id !== id));

            return undefined;
          })
        );
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  private loadStatusChanges(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.statusChangesSubject.next([]);
      return;
    }
    
    from(this.supabaseService.client
      .from('status_changes')
      .select('*, applications!inner(*)')
      .eq('applications.user_id', userId)
      .order('timestamp', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        return (response.data || []).map(change => ({
          id: change.id,
          applicationId: change.application_id,
          oldStatus: change.old_status,
          newStatus: change.new_status,
          timestamp: new Date(change.timestamp)
        }));
      }),
      catchError(error => {
        return of([]);
      })
    ).subscribe(statusChanges => {
      this.statusChangesSubject.next(statusChanges);
    });
  }

  getStatusChangesForApplication(applicationId: string): Observable<StatusChange[]> {
    return this.statusChanges$.pipe(
      map(changes => changes.filter(change => change.applicationId === applicationId))
    );
  }

  private addStatusChangeInternal(applicationId: string | number, oldStatus: string | null, newStatus: string): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return;
    }
    
    this.getApplicationById(applicationId).subscribe(application => {
      if (!application) {
        return;
      }
      
      from(this.supabaseService.client
        .from('status_changes')
        .insert([{
          application_id: applicationId,
          old_status: oldStatus,
          new_status: newStatus
        }])
        .select()
      ).pipe(
        map(response => {
          if (response.error) throw response.error;
          if (!response.data || response.data.length === 0) throw new Error('No data returned after insert');

          const newChange = response.data[0];

          const changeObj: StatusChange = {
            id: newChange.id,
            applicationId: newChange.application_id,
            oldStatus: newChange.old_status,
            newStatus: newChange.new_status,
            timestamp: new Date(newChange.timestamp)
          };

          const currentChanges = this.statusChangesSubject.getValue();
          this.statusChangesSubject.next([...currentChanges, changeObj]);

          return changeObj;
        }),
        catchError(error => {
          return of(undefined);
        })
      ).subscribe();
    });
  }

  private loadEvents(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.eventsSubject.next([]);
      return;
    }
    
    from(this.supabaseService.client
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        return (response.data || []).map(event => ({
          id: event.id,
          title: event.title,
          company: event.company,
          time: event.time,
          date: event.date,
          color: event.color
        }));
      }),
      catchError(error => {
        return of([]);
      })
    ).subscribe(events => {
      this.eventsSubject.next(events);
    });
  }

  getEvents(): Observable<Event[]> {
    return this.events$;
  }

  addEvent(eventData: Omit<Event, 'id'>): Observable<Event> {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('No user ID available'));
    }
    
    return from(this.supabaseService.client
      .from('events')
      .insert([{
        ...eventData,
        user_id: userId 
      }])
      .select()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        if (!response.data || response.data.length === 0) throw new Error('No data returned after insert');

        const newEvent = response.data[0];
        const eventObj: Event = {
          id: newEvent.id,
          title: newEvent.title,
          company: newEvent.company,
          time: newEvent.time,
          date: newEvent.date,
          color: newEvent.color
        };

        const currentEvents = this.eventsSubject.getValue();
        this.eventsSubject.next([...currentEvents, eventObj]);

        return eventObj;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  getUpcomingAppointments(): Observable<Application[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.applications$.pipe(
      map(apps => apps
        .filter(app =>
          app.status === 'Gespräch' &&
          app.appointmentDate &&
          new Date(app.appointmentDate) >= today
        )
        .sort((a, b) => {
          const dateA = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
          const dateB = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA - dateB;
        })
      )
    );
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

        statusChanges.forEach(change => {
          timelineItems.push({
            id: `timeline-${change.id}`,
            timestamp: change.timestamp,
            type: 'StatusChange',
            data: change,
            title: `Status: ${change.newStatus}`,
            icon: 'status'
          });
        });

        notes.forEach(note => {
          timelineItems.push({
            id: `timeline-${note.id}`,
            timestamp: note.updatedAt || note.createdAt,
            type: 'Note',
            data: note,
            title: note.updatedAt ? 'Notiz bearbeitet' : 'Notiz hinzugefügt',
            icon: 'note'
          });
        });

        communications.forEach(comm => {
          let commTitle = 'Kommunikation';
          if (comm.type === 'email') commTitle = 'E-Mail';
          if (comm.type === 'phone') commTitle = 'Telefonat';
          if (comm.type === 'meeting') commTitle = 'Meeting';
          commTitle += comm.direction === 'outgoing' ? ' (Ausgehend)' : ' (Eingehend)';

          timelineItems.push({
            id: `timeline-${comm.id}`,
            timestamp: comm.date,
            type: 'Communication',
            data: comm,
            title: `${commTitle}: ${comm.subject || '(Kein Betreff)'}`,
            icon: comm.type
          });
        });

        reminders.forEach(reminder => {
          timelineItems.push({
            id: `timeline-${reminder.id}`,
            timestamp: reminder.createdAt,
            type: 'Reminder',
            data: reminder,
            title: `Erinnerung erstellt: ${reminder.reminderText}`,
            icon: 'reminder'
          });
        });

        documents.forEach(doc => {
          timelineItems.push({
            id: `timeline-${doc.id}`,
            timestamp: doc.uploadDate,
            type: 'Document',
            data: doc,
            title: `Dokument hochgeladen: ${doc.name}`,
            icon: 'document'
          });
        });

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

  getAllReminders(): Observable<(FollowUpReminder & { application?: Application })[]> {
    return combineLatest([
      this.reminders$,
      this.applications$
    ]).pipe(
      map(([reminders, applications]) => {
        return reminders.map(reminder => {
          const application = applications.find(app => String(app.id) === reminder.applicationId);
          return { ...reminder, application };
        }).sort((a, b) => {
          if (a.isCompleted !== b.isCompleted) {
            return a.isCompleted ? 1 : -1;
          }
          return a.date.getTime() - b.date.getTime();
        });
      })
    );
  }

  getDueReminders(): Observable<(FollowUpReminder & { application?: Application })[]> {
    return combineLatest([
      this.reminders$,
      this.applications$
    ]).pipe(
      map(([reminders, applications]) => {
        const now = new Date();

        return reminders
          .filter(reminder => {
            if (reminder.isCompleted || reminder.notificationShown) {
              return false;
            }

            const reminderDate = new Date(reminder.date);
            const notifyBefore = reminder.notifyBefore || 0;

            const notificationTime = new Date(reminderDate.getTime() - notifyBefore * 60000);

            return notificationTime <= now;
          })
          .map(reminder => {
            const application = applications.find(app => String(app.id) === reminder.applicationId);
            return { ...reminder, application };
          });
      })
    );
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
      {
        title: 'Aktive Bewerbungen',
        value: activeApps,
        total: totalApps,
        color: '',
        borderColor: JobApplicationService.statColors.active
      },
      {
        title: 'Vorstellungsgespräche',
        value: interviews,
        color: '',
        borderColor: JobApplicationService.statColors.interview
      },
      {
        title: 'Positive Antworten',
        value: positiveResponses,
        total: totalApps,
        color: '',
        borderColor: JobApplicationService.statColors.positive
      },
      {
        title: 'Absagen',
        value: declined,
        total: totalApps,
        color: '',
        borderColor: JobApplicationService.statColors.declined
      }
    ];
  }
}