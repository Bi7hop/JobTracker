import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Pattern } from '../models/job-tracker.models';

const INITIAL_PATTERNS: Pattern[] = [
  {
    id: 'pat-1',
    name: 'Standard-Anschreiben für IT-Stellen',
    type: 'cover',
    content: `Sehr geehrte Damen und Herren,

ich möchte mich hiermit auf die Position [POSITION] bei [UNTERNEHMEN] bewerben.

Mit freundlichen Grüßen  
[NAME]`,
    createdAt: new Date('2025-04-01'),
    tags: ['IT', 'Standard'],
    isDefault: true
  },
  {
    id: 'pat-2',
    name: 'Follow-up E-Mail nach dem Vorstellungsgespräch',
    type: 'email',
    content: `Sehr geehrte/r [KONTAKT],

vielen Dank für das angenehme Gespräch am [DATUM]. Ich freue mich auf Ihre Rückmeldung.

Beste Grüße  
[NAME]`,
    createdAt: new Date('2025-04-05'),
    tags: ['Follow-up', 'Vorstellungsgespräch']
  }
];

@Injectable({
  providedIn: 'root'
})
export class PatternService {
  private patternsSubject = new BehaviorSubject<Pattern[]>(INITIAL_PATTERNS);
  public patterns$ = this.patternsSubject.asObservable();
  private patternToDelete: Pattern | null = null;

  constructor() { }

  getPatterns(): Observable<Pattern[]> {
    return this.patterns$;
  }

  getPatternsByType(type: Pattern['type']): Observable<Pattern[]> {
    return of(this.patternsSubject.getValue().filter(pat => pat.type === type));
  }

  getPatternById(id: string): Observable<Pattern | undefined> {
    return of(this.patternsSubject.getValue().find(pat => pat.id === id));
  }

  addPattern(pattern: Omit<Pattern, 'id' | 'createdAt'>): Observable<Pattern> {
    const newPattern: Pattern = {
      ...pattern,
      id: `pat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date()
    };

    const updatedPatterns = [...this.patternsSubject.getValue(), newPattern];
    this.patternsSubject.next(updatedPatterns);
    return of(newPattern);
  }

  updatePattern(patternToUpdate: Partial<Pattern> & { id: string }): Observable<Pattern | undefined> {
    const patterns = this.patternsSubject.getValue();
    const index = patterns.findIndex(p => p.id === patternToUpdate.id);

    if (index !== -1) {
      const updatedPattern: Pattern = {
        ...patterns[index],
        ...patternToUpdate,
        updatedAt: new Date()
      };

      const updatedPatterns = [
        ...patterns.slice(0, index),
        updatedPattern,
        ...patterns.slice(index + 1)
      ];

      this.patternsSubject.next(updatedPatterns);
      return of(updatedPattern);
    }

    return of(undefined);
  }

  deletePattern(id: string): Observable<boolean> {
    const patterns = this.patternsSubject.getValue();
    const updatedPatterns = patterns.filter(p => p.id !== id);

    if (updatedPatterns.length < patterns.length) {
      this.patternsSubject.next(updatedPatterns);
      return of(true);
    }

    return of(false);
  }

  setDefaultPattern(pattern: Pattern): Observable<Pattern | undefined> {
    const patterns = this.patternsSubject.getValue();
    let updatedPatterns = [...patterns];

    updatedPatterns = updatedPatterns.map(p => {
      if (p.type === pattern.type && p.isDefault && p.id !== pattern.id) {
        return { ...p, isDefault: false };
      }
      return p;
    });

    const index = updatedPatterns.findIndex(p => p.id === pattern.id);
    if (index !== -1) {
      updatedPatterns[index] = { ...updatedPatterns[index], isDefault: true };
      this.patternsSubject.next(updatedPatterns);
      return of(updatedPatterns[index]);
    }

    return of(undefined);
  }

  setPatternToDelete(pattern: Pattern): void {
    this.patternToDelete = pattern;
  }

  getPatternToDelete(): Pattern | null {
    return this.patternToDelete;
  }

  clearPatternToDelete(): void {
    this.patternToDelete = null;
  }
}
