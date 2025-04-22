import { CalendarDateFormatter, DateFormatterParams } from 'angular-calendar';
import { formatDate } from '@angular/common';
import { Injectable, LOCALE_ID, Inject } from '@angular/core';
import { getISOWeek } from 'date-fns/getISOWeek'; // Korrekter Import

@Injectable()
export class CustomDateFormatter extends CalendarDateFormatter {
    constructor(@Inject(LOCALE_ID) private locale: string) {
        super(locale);
    }

    public override monthViewColumnHeader({ date, locale }: DateFormatterParams): string {
        return formatDate(date, 'EEE', locale || this.locale); // Mo, Di, Mi...
    }

    public override monthViewTitle({ date, locale }: DateFormatterParams): string {
        return formatDate(date, 'LLLL yyyy', locale || this.locale); // April 2025
    }

    public override weekViewColumnHeader({ date, locale }: DateFormatterParams): string {
        return formatDate(date, 'EEE', locale || this.locale); // Mo, Di...
    }

     public override weekViewColumnSubHeader({ date, locale }: DateFormatterParams): string {
         return formatDate(date, 'd', locale || this.locale); // Nur Tag (17)
     }

    public override weekViewTitle({ date, locale }: DateFormatterParams): string {
         const year = formatDate(date, 'y', locale || this.locale);
         const weekNumber = getISOWeek(date);
         return `Woche ${weekNumber} ${year}`; // Woche 16 2025
     }

    public override dayViewHour({ date, locale }: DateFormatterParams): string {
        return formatDate(date, 'HH:mm', locale || this.locale); // 14:00
    }

     public override dayViewTitle({ date, locale }: DateFormatterParams): string {
        return formatDate(date, 'EEEE, d. MMMM y', locale || this.locale); // Donnerstag, 17. April 2025
     }
}