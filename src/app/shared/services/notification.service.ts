import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private toastr: ToastrService) { }
  showSuccess(message: string, title?: string): void { this.toastr.success(message, title || 'Erfolg'); }
  showError(message: string, title?: string): void { this.toastr.error(message, title || 'Fehler'); }
  showInfo(message: string, title?: string): void { this.toastr.info(message, title || 'Info'); }
  showWarning(message: string, title?: string): void { this.toastr.warning(message, title || 'Warnung'); }
}