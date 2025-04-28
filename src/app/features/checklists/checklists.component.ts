import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, combineLatest, map, switchMap, of, tap } from 'rxjs';

import { JobApplicationService } from '../../services/job-application.service';
import { ChecklistService } from '../../services/checklist.service';
import { NotificationService } from '../../shared/services/notification.service';

import { 
  Application, 
  ChecklistItem, 
  ChecklistTemplate 
} from '../../models/job-tracker.models';

interface TemplateCategory {
  value: ChecklistTemplate['category'];
  label: string;
}

@Component({
  selector: 'app-checklists',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './checklists.component.html',
  styleUrls: ['./checklists.component.scss']
})
export class ChecklistsComponent implements OnInit {
  applications$!: Observable<Application[]>;
  checklist$!: Observable<ChecklistItem[]>;
  availableTemplates$!: Observable<ChecklistTemplate[]>;
  
  selectedApplication: Application | null = null;
  selectedTemplate: ChecklistTemplate | null = null;
  selectedTemplateCategory: ChecklistTemplate['category'] = 'standard';
  
  isCreatingChecklist = false;
  isEditingChecklistItem = false;
  editingExistingItem = false;
  isSavingAsTemplate = false;
  
  checklistItemForm!: FormGroup;
  templateForm!: FormGroup;
  
  checklistProgress: { [key: string]: number } = {};
  overallProgress: number = 0;
  categoryProgress: { category: string, progress: number }[] = [];
  
  templateCategories: TemplateCategory[] = [
    { value: 'standard', label: 'Allgemein' },
    { value: 'initiativ', label: 'Initiativ' },
    { value: 'praktikum', label: 'Praktikum' },
    { value: 'international', label: 'International' }
  ];
  
  private currentItemId: string | null = null;

  constructor(
    private jobAppService: JobApplicationService,
    private checklistService: ChecklistService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadApplications();
  }
  
  private initForms(): void {
    this.checklistItemForm = this.fb.group({
      task: ['', Validators.required],
      category: ['', Validators.required],
      priority: ['medium'],
      dueDate: [null],
      notes: ['']
    });
    
    this.templateForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      category: ['standard', Validators.required],
      isDefault: [false]
    });
  }
  
  private loadApplications(): void {
    this.applications$ = this.jobAppService.getApplications();
    
    this.applications$.subscribe(apps => {
      apps.forEach(app => {
        if (app.id) {
          this.loadChecklistProgress(app.id.toString());
        }
      });
    });
  }
  
  private loadChecklistProgress(applicationId: string): void {
    this.checklistService.getChecklistProgress(applicationId).subscribe(progress => {
      this.checklistProgress[applicationId] = progress;
    });
  }
  
  private loadCategoryProgress(applicationId: string): void {
    this.checklistService.getCategoryProgress(applicationId).subscribe(progress => {
      this.categoryProgress = progress;
    });
  }
  
  selectApplication(application: Application): void {
    this.selectedApplication = application;
    
    if (application.id) {
      this.checklist$ = this.checklistService.getChecklistForApplication(application.id.toString());
      
      this.checklistService.getChecklistProgress(application.id.toString()).subscribe(progress => {
        this.overallProgress = progress;
      });
      
      this.loadCategoryProgress(application.id.toString());
    }
  }
  
  showTemplateSelection(): void {
    this.isCreatingChecklist = true;
    this.loadAvailableTemplates();
  }
  
  cancelTemplateSelection(): void {
    this.isCreatingChecklist = false;
    this.selectedTemplate = null;
  }
  
  selectTemplateCategory(category: ChecklistTemplate['category']): void {
    this.selectedTemplateCategory = category;
    this.loadAvailableTemplates();
  }
  
  loadAvailableTemplates(): void {
    if (this.selectedTemplateCategory === 'standard') {
      this.availableTemplates$ = this.checklistService.getTemplatesByCategory('standard');
    } else if (this.selectedTemplateCategory === 'initiativ') {
      this.availableTemplates$ = this.checklistService.getTemplatesByCategory('initiativ');
    } else if (this.selectedTemplateCategory === 'praktikum') {
      this.availableTemplates$ = this.checklistService.getTemplatesByCategory('praktikum');
    } else if (this.selectedTemplateCategory === 'international') {
      this.availableTemplates$ = this.checklistService.getTemplatesByCategory('international');
    } 
  }
  
  selectTemplate(template: ChecklistTemplate): void {
    this.selectedTemplate = template;
  }
  
  createChecklistFromTemplate(): void {
    if (!this.selectedTemplate || !this.selectedApplication || !this.selectedApplication.id) {
      this.notificationService.showError('Wähle zuerst eine Vorlage und eine Bewerbung aus.');
      return;
    }
    
    this.checklistService.createChecklistFromTemplate(
      this.selectedApplication.id.toString(), 
      this.selectedTemplate.id
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Checkliste erstellt');
        this.isCreatingChecklist = false;
        this.selectedTemplate = null;
        
        if (this.selectedApplication && this.selectedApplication.id) {
          this.loadChecklistProgress(this.selectedApplication.id.toString());
          this.loadCategoryProgress(this.selectedApplication.id.toString());
        }
      },
      error: (err) => {
        console.error('Fehler beim Erstellen der Checkliste:', err);
        this.notificationService.showError('Fehler beim Erstellen der Checkliste');
      }
    });
  }
  
  addChecklistItem(): void {
    this.isEditingChecklistItem = true;
    this.editingExistingItem = false;
    this.checklistItemForm.reset({
      task: '',
      category: '',
      priority: 'medium'
    });
  }
  
  editChecklistItem(item: ChecklistItem): void {
    this.isEditingChecklistItem = true;
    this.editingExistingItem = true;
    this.currentItemId = item.id;
    
    this.checklistItemForm.patchValue({
      task: item.task,
      category: item.category,
      priority: item.priority || 'medium',
      dueDate: item.dueDate ? this.formatDateForInput(item.dueDate) : null,
      notes: item.notes || ''
    });
  }
  
  cancelChecklistItemEdit(): void {
    this.isEditingChecklistItem = false;
    this.currentItemId = null;
  }
  
  saveChecklistItem(): void {
    if (this.checklistItemForm.invalid || !this.selectedApplication || !this.selectedApplication.id) {
      return;
    }
    
    const formValue = this.checklistItemForm.value;
    const applicationId = this.selectedApplication.id.toString();
    
    this.checklist$.pipe(
      map(items => {
        const maxOrder = items.length > 0 
          ? Math.max(...items.map(item => item.order)) 
          : 0;
        return maxOrder + 1;
      }),
      switchMap(newOrder => {
        const itemData: Omit<ChecklistItem, 'id'> = {
          applicationId,
          task: formValue.task,
          isCompleted: false,
          category: formValue.category,
          order: newOrder,
          priority: formValue.priority,
          notes: formValue.notes,
          dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined
        };
        
        if (this.editingExistingItem && this.currentItemId) {
          return this.checklistService.updateChecklistItem({
            id: this.currentItemId,
            ...itemData
          });
        } else {
          return this.checklistService.addChecklistItem(itemData);
        }
      })
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess(
          this.editingExistingItem ? 'Aufgabe aktualisiert' : 'Aufgabe hinzugefügt'
        );
        this.isEditingChecklistItem = false;
        this.currentItemId = null;
        
        this.loadChecklistProgress(applicationId);
        this.loadCategoryProgress(applicationId);
        
        this.checklistService.getChecklistProgress(applicationId).subscribe(progress => {
          this.overallProgress = progress;
        });
      },
      error: (err) => {
        console.error('Fehler beim Speichern der Aufgabe:', err);
        this.notificationService.showError('Fehler beim Speichern der Aufgabe');
      }
    });
  }
  
  toggleChecklistItem(id: string): void {
    this.checklistService.toggleChecklistItemCompletion(id).subscribe({
      next: () => {
        if (this.selectedApplication && this.selectedApplication.id) {
          const applicationId = this.selectedApplication.id.toString();
          
          this.loadChecklistProgress(applicationId);
          this.loadCategoryProgress(applicationId);
          
          this.checklistService.getChecklistProgress(applicationId).subscribe(progress => {
            this.overallProgress = progress;
          });
        }
      },
      error: (err) => {
        console.error('Fehler beim Ändern des Status:', err);
        this.notificationService.showError('Fehler beim Ändern des Status');
      }
    });
  }
  
  deleteChecklistItem(id: string): void {
    if (confirm('Möchtest du diese Aufgabe wirklich löschen?')) {
      this.checklistService.deleteChecklistItem(id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Aufgabe gelöscht');
          
          if (this.selectedApplication && this.selectedApplication.id) {
            const applicationId = this.selectedApplication.id.toString();
            
            this.loadChecklistProgress(applicationId);
            this.loadCategoryProgress(applicationId);
            
            this.checklistService.getChecklistProgress(applicationId).subscribe(progress => {
              this.overallProgress = progress;
            });
          }
        },
        error: (err) => {
          console.error('Fehler beim Löschen der Aufgabe:', err);
          this.notificationService.showError('Fehler beim Löschen der Aufgabe');
        }
      });
    }
  }
  
  saveAsTemplate(): void {
    this.isSavingAsTemplate = true;
    
    if (this.selectedApplication) {
      this.templateForm.patchValue({
        name: `Vorlage für ${this.selectedApplication.company}`,
        description: `Checkliste für die Bewerbung als ${this.selectedApplication.position} bei ${this.selectedApplication.company}`,
        category: 'standard',
        isDefault: false
      });
    }
  }
  
  cancelSaveAsTemplate(): void {
    this.isSavingAsTemplate = false;
  }
  
  confirmSaveAsTemplate(): void {
    if (this.templateForm.invalid || !this.selectedApplication || !this.selectedApplication.id) {
      return;
    }
    
    const formValue = this.templateForm.value;
    const applicationId = this.selectedApplication.id.toString();
    
    this.checklistService.saveAsTemplate(
      applicationId,
      formValue.name,
      formValue.description,
      formValue.category
    ).subscribe({
      next: (template) => {
        this.notificationService.showSuccess(`Vorlage "${template.name}" erstellt`);
        this.isSavingAsTemplate = false;
        
        if (formValue.isDefault) {
          this.checklistService.setTemplateAsDefault(template.id).subscribe();
        }
      },
      error: (err) => {
        console.error('Fehler beim Speichern der Vorlage:', err);
        this.notificationService.showError('Fehler beim Speichern der Vorlage');
      }
    });
  }
  
  getUniqueCategories(items: ChecklistItem[]): string[] {
    return [...new Set(items.map(item => item.category))].sort();
  }
  
  filterByCategory(items: ChecklistItem[], category: string): ChecklistItem[] {
    return items
      .filter(item => item.category === category)
      .sort((a, b) => a.order - b.order);
  }
  
  getPriorityBadgeClass(priority: string | undefined): string {
    switch (priority) {
      case 'high': return 'bg-red-900 text-red-400';
      case 'medium': return 'bg-yellow-900 text-yellow-400';
      case 'low': return 'bg-blue-900 text-blue-400';
      default: return 'bg-gray-800 text-gray-400';
    }
  }
  
  getPriorityLabel(priority: string | undefined): string {
    switch (priority) {
      case 'high': return 'Hohe Priorität';
      case 'medium': return 'Mittlere Priorität';
      case 'low': return 'Niedrige Priorität';
      default: return 'Keine Priorität';
    }
  }
  
  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
}