import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, map } from 'rxjs';
import { ChecklistItem, ChecklistTemplate } from '../models/job-tracker.models';

// Default templates as described in paste.txt
const DEFAULT_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'template-standard',
    name: 'Allgemeine Bewerbung',
    description: 'Standardcheckliste für allgemeine Bewerbungen',
    category: 'standard',
    isDefault: true,
    items: [
      // Vorbereitungsphase
      { task: 'Stellenanzeige analysieren und Keywords markieren', isCompleted: false, category: 'Vorbereitung', order: 1, priority: 'high' },
      { task: 'Unternehmen recherchieren (Produkte, Kultur, aktuelle News)', isCompleted: false, category: 'Vorbereitung', order: 2, priority: 'high' },
      { task: 'Eigene Qualifikationen mit Anforderungen abgleichen', isCompleted: false, category: 'Vorbereitung', order: 3, priority: 'medium' },
      { task: 'Gehaltsvorstellungen recherchieren', isCompleted: false, category: 'Vorbereitung', order: 4, priority: 'medium' },
      { task: 'Ansprechpartner identifizieren', isCompleted: false, category: 'Vorbereitung', order: 5, priority: 'medium' },
      
      // Dokumentenerstellung
      { task: 'Lebenslauf aktualisieren und anpassen', isCompleted: false, category: 'Dokumente', order: 6, priority: 'high' },
      { task: 'Anschreiben erstellen und auf Stelle maßschneidern', isCompleted: false, category: 'Dokumente', order: 7, priority: 'high' },
      { task: 'Referenzen organisieren', isCompleted: false, category: 'Dokumente', order: 8, priority: 'medium' },
      { task: 'Zeugnisse und Zertifikate zusammenstellen', isCompleted: false, category: 'Dokumente', order: 9, priority: 'medium' },
      { task: 'Arbeitsproben vorbereiten (falls relevant)', isCompleted: false, category: 'Dokumente', order: 10, priority: 'medium' },
      { task: 'Korrekturlesen (durch Freund/Kollegen)', isCompleted: false, category: 'Dokumente', order: 11, priority: 'high' },
      { task: 'Dokumente in PDF konvertieren', isCompleted: false, category: 'Dokumente', order: 12, priority: 'high' },
      { task: 'Einheitliches Design prüfen', isCompleted: false, category: 'Dokumente', order: 13, priority: 'medium' },
      
      // Bewerbungsprozess
      { task: 'Bewerbung versenden', isCompleted: false, category: 'Prozess', order: 14, priority: 'high' },
      { task: 'Eingangsbestätigung erhalten', isCompleted: false, category: 'Prozess', order: 15, priority: 'low' },
      { task: 'In Kalender eintragen (Reminder für Nachfassen)', isCompleted: false, category: 'Prozess', order: 16, priority: 'medium' },
      { task: 'Kopie der Bewerbung für Interview speichern', isCompleted: false, category: 'Prozess', order: 17, priority: 'medium' },
      
      // Nachverfolgung
      { task: 'Nach einer Woche nachfassen (falls keine Rückmeldung)', isCompleted: false, category: 'Nachverfolgung', order: 18, priority: 'medium' },
      { task: 'Nach zwei Wochen erneut nachfassen (optional)', isCompleted: false, category: 'Nachverfolgung', order: 19, priority: 'low' },
      { task: 'Vorbereitung auf Telefoninterview', isCompleted: false, category: 'Nachverfolgung', order: 20, priority: 'high' },
      { task: 'Vorbereitung auf persönliches Interview', isCompleted: false, category: 'Nachverfolgung', order: 21, priority: 'high' },
      
      // Interviewphase
      { task: 'Interview-Outfit vorbereiten', isCompleted: false, category: 'Interview', order: 22, priority: 'medium' },
      { task: 'Anfahrt planen/Onlinemeeting-Tool testen', isCompleted: false, category: 'Interview', order: 23, priority: 'high' },
      { task: 'Liste mit eigenen Fragen vorbereiten', isCompleted: false, category: 'Interview', order: 24, priority: 'high' },
      { task: 'Übliche Interviewfragen üben', isCompleted: false, category: 'Interview', order: 25, priority: 'high' },
      { task: 'Gehaltsverhandlung vorbereiten', isCompleted: false, category: 'Interview', order: 26, priority: 'high' },
      { task: 'Dankesschreiben nach Interview versenden', isCompleted: false, category: 'Interview', order: 27, priority: 'medium' },
      
      // Angebots-/Abschlussphase
      { task: 'Angebot prüfen', isCompleted: false, category: 'Abschluss', order: 28, priority: 'high' },
      { task: 'Über Angebot verhandeln', isCompleted: false, category: 'Abschluss', order: 29, priority: 'high' },
      { task: 'Vertrag prüfen', isCompleted: false, category: 'Abschluss', order: 30, priority: 'high' },
      { task: 'Vertrag unterschreiben', isCompleted: false, category: 'Abschluss', order: 31, priority: 'high' },
      { task: 'Arbeitsantritt vorbereiten', isCompleted: false, category: 'Abschluss', order: 32, priority: 'medium' }
    ]
  },
  {
    id: 'template-initiativ',
    name: 'Initiativbewerbung',
    description: 'Checkliste für Initiativbewerbungen',
    category: 'initiativ',
    isDefault: true,
    items: [
      { task: 'Zielunternehmen identifizieren', isCompleted: false, category: 'Vorbereitung', order: 1, priority: 'high' },
      { task: 'Unternehmen intensiv recherchieren', isCompleted: false, category: 'Vorbereitung', order: 2, priority: 'high' },
      { task: 'Relevante Ansprechpartner recherchieren', isCompleted: false, category: 'Vorbereitung', order: 3, priority: 'high' },
      { task: 'Spezifische Stärken herausarbeiten', isCompleted: false, category: 'Vorbereitung', order: 4, priority: 'high' },
      { task: 'Lebenslauf auf Unternehmen zuschneiden', isCompleted: false, category: 'Dokumente', order: 5, priority: 'high' },
      { task: 'Überzeugendes Anschreiben formulieren', isCompleted: false, category: 'Dokumente', order: 6, priority: 'high' },
      { task: 'Nachfassen planen', isCompleted: false, category: 'Nachverfolgung', order: 7, priority: 'medium' }
    ]
  },
  {
    id: 'template-praktikum',
    name: 'Bewerbung für Praktika',
    description: 'Spezielle Checkliste für Praktikumsbewerbungen',
    category: 'praktikum',
    isDefault: true,
    items: [
      { task: 'Lernziele definieren', isCompleted: false, category: 'Vorbereitung', order: 1, priority: 'high' },
      { task: 'Universitätsanforderungen prüfen', isCompleted: false, category: 'Vorbereitung', order: 2, priority: 'high' },
      { task: 'Zeitleiste festlegen', isCompleted: false, category: 'Vorbereitung', order: 3, priority: 'medium' },
      { task: 'Studentenlebenslauf erstellen', isCompleted: false, category: 'Dokumente', order: 4, priority: 'high' },
      { task: 'Motivation hervorheben', isCompleted: false, category: 'Dokumente', order: 5, priority: 'high' },
      { task: 'Praktikumsbericht planen', isCompleted: false, category: 'Abschluss', order: 6, priority: 'low' }
    ]
  },
  {
    id: 'template-international',
    name: 'Internationale Bewerbungen',
    description: 'Checkliste für Bewerbungen im Ausland',
    category: 'international',
    isDefault: true,
    items: [
      { task: 'Länderspezifische Bewerbungsstandards recherchieren', isCompleted: false, category: 'Vorbereitung', order: 1, priority: 'high' },
      { task: 'Lebenslauf im entsprechenden Format (z.B. CV, Resume) anpassen', isCompleted: false, category: 'Dokumente', order: 2, priority: 'high' },
      { task: 'Dokumente übersetzen lassen', isCompleted: false, category: 'Dokumente', order: 3, priority: 'high' },
      { task: 'Sprachkenntnisse nachweisen (Zertifikate)', isCompleted: false, category: 'Dokumente', order: 4, priority: 'high' },
      { task: 'Auslandsversicherung klären', isCompleted: false, category: 'Vorbereitung', order: 5, priority: 'medium' },
      { task: 'Visumsanforderungen prüfen', isCompleted: false, category: 'Vorbereitung', order: 6, priority: 'high' },
      { task: 'Remote-Interview-Möglichkeiten vorbereiten', isCompleted: false, category: 'Interview', order: 7, priority: 'medium' }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private checklistItemsSubject = new BehaviorSubject<ChecklistItem[]>([]);
  private templatesSubject = new BehaviorSubject<ChecklistTemplate[]>(DEFAULT_TEMPLATES);

  public checklistItems$ = this.checklistItemsSubject.asObservable();
  public templates$ = this.templatesSubject.asObservable();

  constructor() { }

  getChecklistForApplication(applicationId: string): Observable<ChecklistItem[]> {
    return this.checklistItems$.pipe(
      map(items => items.filter(item => item.applicationId === applicationId))
    );
  }

  getAvailableTemplates(): Observable<ChecklistTemplate[]> {
    return this.templates$;
  }

  getTemplateById(templateId: string): Observable<ChecklistTemplate | undefined> {
    return this.templates$.pipe(
      map(templates => templates.find(template => template.id === templateId))
    );
  }

  getTemplatesByCategory(category: ChecklistTemplate['category']): Observable<ChecklistTemplate[]> {
    return this.templates$.pipe(
      map(templates => templates.filter(template => template.category === category))
    );
  }

  getDefaultTemplateForCategory(category: ChecklistTemplate['category']): Observable<ChecklistTemplate | undefined> {
    return this.templates$.pipe(
      map(templates => templates.find(template => template.category === category && template.isDefault))
    );
  }

  createChecklistFromTemplate(applicationId: string, templateId: string): Observable<ChecklistItem[]> {
    return this.getTemplateById(templateId).pipe(
      map(template => {
        if (!template) {
          throw new Error(`Template with ID ${templateId} not found`);
        }

        const newItems: ChecklistItem[] = template.items.map(item => ({
          ...item,
          id: `check-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          applicationId
        }));

        const currentItems = this.checklistItemsSubject.getValue();
        this.checklistItemsSubject.next([...currentItems, ...newItems]);

        return newItems;
      })
    );
  }

  addChecklistItem(item: Omit<ChecklistItem, 'id'>): Observable<ChecklistItem> {
    const newItem: ChecklistItem = {
      ...item,
      id: `check-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    const currentItems = this.checklistItemsSubject.getValue();
    this.checklistItemsSubject.next([...currentItems, newItem]);

    return of(newItem);
  }

  updateChecklistItem(item: ChecklistItem): Observable<ChecklistItem> {
    const currentItems = this.checklistItemsSubject.getValue();
    const index = currentItems.findIndex(i => i.id === item.id);

    if (index !== -1) {
      const updatedItems = [
        ...currentItems.slice(0, index),
        item,
        ...currentItems.slice(index + 1)
      ];
      
      this.checklistItemsSubject.next(updatedItems);
      return of(item);
    }

    return of(item);
  }

  toggleChecklistItemCompletion(id: string): Observable<ChecklistItem | undefined> {
    const currentItems = this.checklistItemsSubject.getValue();
    const index = currentItems.findIndex(item => item.id === id);

    if (index !== -1) {
      const item = currentItems[index];
      const updatedItem = { ...item, isCompleted: !item.isCompleted };
      
      const updatedItems = [
        ...currentItems.slice(0, index),
        updatedItem,
        ...currentItems.slice(index + 1)
      ];
      
      this.checklistItemsSubject.next(updatedItems);
      return of(updatedItem);
    }

    return of(undefined);
  }

  deleteChecklistItem(id: string): Observable<void> {
    const currentItems = this.checklistItemsSubject.getValue();
    const updatedItems = currentItems.filter(item => item.id !== id);
    this.checklistItemsSubject.next(updatedItems);
    return of(undefined);
  }

  deleteChecklistForApplication(applicationId: string): Observable<void> {
    const currentItems = this.checklistItemsSubject.getValue();
    const updatedItems = currentItems.filter(item => item.applicationId !== applicationId);
    this.checklistItemsSubject.next(updatedItems);
    return of(undefined);
  }

  addTemplate(template: Omit<ChecklistTemplate, 'id'>): Observable<ChecklistTemplate> {
    const newTemplate: ChecklistTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    const currentTemplates = this.templatesSubject.getValue();
    this.templatesSubject.next([...currentTemplates, newTemplate]);

    return of(newTemplate);
  }

  updateTemplate(template: ChecklistTemplate): Observable<ChecklistTemplate> {
    const currentTemplates = this.templatesSubject.getValue();
    const index = currentTemplates.findIndex(t => t.id === template.id);

    if (index !== -1) {
      const updatedTemplates = [
        ...currentTemplates.slice(0, index),
        template,
        ...currentTemplates.slice(index + 1)
      ];
      
      this.templatesSubject.next(updatedTemplates);
      return of(template);
    }

    return of(template);
  }

  deleteTemplate(id: string): Observable<void> {
    const currentTemplates = this.templatesSubject.getValue();
    const updatedTemplates = currentTemplates.filter(template => template.id !== id);
    this.templatesSubject.next(updatedTemplates);
    return of(undefined);
  }

  saveAsTemplate(applicationId: string, templateName: string, description: string, category: ChecklistTemplate['category']): Observable<ChecklistTemplate> {
    return this.getChecklistForApplication(applicationId).pipe(
      map(items => {
        const templateItems = items.map(({ id, applicationId, ...rest }) => rest);
        
        const newTemplate: ChecklistTemplate = {
          id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: templateName,
          description,
          category,
          items: templateItems,
          isDefault: false
        };

        const currentTemplates = this.templatesSubject.getValue();
        this.templatesSubject.next([...currentTemplates, newTemplate]);

        return newTemplate;
      })
    );
  }

  setTemplateAsDefault(templateId: string): Observable<ChecklistTemplate | undefined> {
    const currentTemplates = this.templatesSubject.getValue();
    const templateIndex = currentTemplates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      return of(undefined);
    }
    
    const template = currentTemplates[templateIndex];
    const category = template.category;
    const updatedTemplates = currentTemplates.map(t => {
      if (t.category === category) {
        return { ...t, isDefault: false };
      }
      return t;
    });
    
    updatedTemplates[templateIndex] = { ...template, isDefault: true };
    
    this.templatesSubject.next(updatedTemplates);
    return of(updatedTemplates[templateIndex]);
  }

  getChecklistProgress(applicationId: string): Observable<number> {
    return this.getChecklistForApplication(applicationId).pipe(
      map(items => {
        if (items.length === 0) return 0;
        
        const completedItems = items.filter(item => item.isCompleted).length;
        return Math.round((completedItems / items.length) * 100);
      })
    );
  }

  getCategoryProgress(applicationId: string): Observable<{category: string, progress: number}[]> {
    return this.getChecklistForApplication(applicationId).pipe(
      map(items => {
        if (items.length === 0) return [];
        
        const categories = [...new Set(items.map(item => item.category))];
        
        return categories.map(category => {
          const categoryItems = items.filter(item => item.category === category);
          const completedItems = categoryItems.filter(item => item.isCompleted).length;
          const progress = Math.round((completedItems / categoryItems.length) * 100);
          
          return { category, progress };
        });
      })
    );
  }
}