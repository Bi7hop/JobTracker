import { Component, OnInit, ChangeDetectionStrategy, LOCALE_ID, Inject } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { ActivatedRoute, Router } from '@angular/router';
import { JobApplicationService } from '../../services/job-application.service';
import { Event as JobEvent } from '../../models/job-tracker.models';
import { CalendarEvent, CalendarView, CalendarModule, DAYS_OF_WEEK } from 'angular-calendar'; 
import { addMonths, subMonths } from 'date-fns';
import { format } from 'date-fns/format';
import { de } from 'date-fns/locale';
import { switchMap, of } from 'rxjs';
import { EventDetailModalComponent } from '../../components/event-detail-modal/event-detail-modal.component';

registerLocaleData(localeDe);

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    CalendarModule,
    EventDetailModalComponent 
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' }
  ]
})
export class CalendarComponent implements OnInit {
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  events: CalendarEvent[] = [];
  locale: string = 'de-DE';
  weekStartsOn: number = DAYS_OF_WEEK.MONDAY;
  selectedEvent: CalendarEvent | null = null;

  constructor(
    private jobAppService: JobApplicationService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(LOCALE_ID) locale: string
  ) {
    this.locale = locale;
  }

  ngOnInit(): void {
    this.loadEvents();
    this.handleQueryParams();
  }

  loadEvents(): void {
    this.jobAppService.getEvents().subscribe(jobEvents => {
      this.events = jobEvents.map(event => this.mapToCalendarEvent(event));
    });
  }

  private mapToCalendarEvent(event: JobEvent): CalendarEvent {
    let eventStart = new Date(event.date + 'T00:00:00');
    try {
        const timeParts = event.time.match(/(\d{1,2}):(\d{2})/);
        if (timeParts) {
            const hours = parseInt(timeParts[1], 10);
            const minutes = parseInt(timeParts[2], 10);
             if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
                 eventStart.setHours(hours, minutes, 0, 0);
            } else {
                 console.warn("Invalid time parts parsed:", event.time);
            }
        }
    } catch(e) { console.error("Could not parse time:", event.time, e); }

    return {
      id: event.id,
      start: eventStart,
      title: `${event.title} - ${event.company} (${event.time})`,
      color: this.getEventColor(event.color),
    };
  }

   private getEventColor(borderColorClass: string): { primary: string; secondary: string } {
    if (borderColorClass.includes('pink')) return { primary: '#ec4899', secondary: '#fbcfe8' };
    if (borderColorClass.includes('blue')) return { primary: '#3b82f6', secondary: '#dbeafe' };
    return { primary: '#6b7280', secondary: '#e5e7eb' };
  }

  handleQueryParams(): void {
     this.route.queryParamMap.subscribe(params => {
        const focusDateStr = params.get('focusDate');
        const eventId = params.get('eventId');

        if (focusDateStr) {
            try {
              const focusDate = new Date(focusDateStr + 'T00:00:00');
               if (!isNaN(focusDate.getTime())) {
                 this.viewDate = focusDate;
              } else {
                 console.warn("Invalid focusDate received:", focusDateStr);
              }
            } catch(e) { console.error("Error parsing focusDate:", focusDateStr, e); }
        }

        if (eventId) {
           setTimeout(() => { 
              const clickedEvent = this.events.find(ev => ev.id == eventId); 
              if (clickedEvent) {
                 this.handleEvent('PARAM_CLICK', clickedEvent);
              } else {
                  console.log("Event specified in query param not found.");
              }
           }, 100);
        }
     });
  }

  handleEvent(action: string, event: CalendarEvent): void {
    console.log(`Event ${action}:`, event);
    this.selectedEvent = event; 
  }

  closeEventModal(): void {
      this.selectedEvent = null; 
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  changeDate(direction: number): void {
     if (this.view === CalendarView.Month) {
       this.viewDate = addMonths(this.viewDate, direction);
     } else {
        const newDate = new Date(this.viewDate);
        newDate.setDate(newDate.getDate() + (this.view === CalendarView.Week ? direction * 7 : direction));
        this.viewDate = newDate;
     }
  }

  goToToday(): void {
    this.viewDate = new Date();
  }
}