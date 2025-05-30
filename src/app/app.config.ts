import { ApplicationConfig, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations'; 
import { routes } from './app.routes';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { provideToastr } from 'ngx-toastr';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
registerLocaleData(localeDe);


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideToastr({
      timeOut: 3000, 
      positionClass: 'toast-bottom-center', 
      preventDuplicates: true, 
      progressBar: true, 
    }),
    importProvidersFrom(
       CalendarModule.forRoot({ provide: DateAdapter, useFactory: adapterFactory })
    ),
    
    { provide: LOCALE_ID, useValue: 'de-DE' }
  
  ]
};