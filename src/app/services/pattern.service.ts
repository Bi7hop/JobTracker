import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, from, map, catchError, switchMap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Pattern } from '../models/job-tracker.models';

@Injectable({
  providedIn: 'root'
})
export class PatternService {
  private patternsSubject = new BehaviorSubject<Pattern[]>([]);
  public patterns$ = this.patternsSubject.asObservable();
  private patternToDelete: Pattern | null = null;

  constructor(private supabaseService: SupabaseService) {
    this.loadPatterns();
  }

  private async loadPatternsAsync(): Promise<Pattern[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('patterns')
        .select('*');

      if (error) throw error;
      
      return (data || []).map((pattern: any) => ({
        id: pattern.id,
        name: pattern.name,
        type: pattern.type,
        content: pattern.content,
        createdAt: new Date(pattern.created_at),
        updatedAt: pattern.updated_at ? new Date(pattern.updated_at) : undefined,
        tags: pattern.tags || [],
        isDefault: pattern.is_default || false
      }));
    } catch (error) {
      console.error('Error loading patterns:', error);
      return [];
    }
  }

  private loadPatterns(): void {
    from(this.loadPatternsAsync()).subscribe(patterns => {
      this.patternsSubject.next(patterns);
    });
  }

  getPatterns(): Observable<Pattern[]> {
    return this.patterns$;
  }

  getPatternsByType(type: Pattern['type']): Observable<Pattern[]> {
    return this.patterns$.pipe(
      map(patterns => patterns.filter(pat => pat.type === type))
    );
  }

  async getPatternByIdAsync(id: string): Promise<Pattern | undefined> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('patterns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return undefined;
      
      return {
        id: data.id,
        name: data.name,
        type: data.type,
        content: data.content,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
        tags: data.tags || [],
        isDefault: data.is_default || false
      };
    } catch (error) {
      console.error(`Error getting pattern with id ${id}:`, error);
      return undefined;
    }
  }

  getPatternById(id: string): Observable<Pattern | undefined> {
    return from(this.getPatternByIdAsync(id));
  }

  async addPatternAsync(pattern: Omit<Pattern, 'id' | 'createdAt'>): Promise<Pattern> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('patterns')
        .insert([{
          name: pattern.name,
          type: pattern.type,
          content: pattern.content,
          tags: pattern.tags,
          is_default: pattern.isDefault || false
        }])
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No data returned after insert');
      
      const newPattern = data[0];
      
      const patternObj: Pattern = {
        id: newPattern.id,
        name: newPattern.name,
        type: newPattern.type,
        content: newPattern.content,
        createdAt: new Date(newPattern.created_at),
        updatedAt: newPattern.updated_at ? new Date(newPattern.updated_at) : undefined,
        tags: newPattern.tags || [],
        isDefault: newPattern.is_default || false
      };
      
      const currentPatterns = this.patternsSubject.getValue();
      this.patternsSubject.next([...currentPatterns, patternObj]);
      
      return patternObj;
    } catch (error) {
      console.error('Error adding pattern:', error);
      throw error;
    }
  }

  addPattern(pattern: Omit<Pattern, 'id' | 'createdAt'>): Observable<Pattern> {
    return from(this.addPatternAsync(pattern));
  }

  async updatePatternAsync(patternToUpdate: Partial<Pattern> & { id: string }): Promise<Pattern | undefined> {
    try {
      const updateData: any = {};
      
      if (patternToUpdate.name !== undefined) updateData.name = patternToUpdate.name;
      if (patternToUpdate.type !== undefined) updateData.type = patternToUpdate.type;
      if (patternToUpdate.content !== undefined) updateData.content = patternToUpdate.content;
      if (patternToUpdate.tags !== undefined) updateData.tags = patternToUpdate.tags;
      if (patternToUpdate.isDefault !== undefined) updateData.is_default = patternToUpdate.isDefault;
      
      updateData.updated_at = new Date().toISOString();
      
      const { data, error } = await this.supabaseService.client
        .from('patterns')
        .update(updateData)
        .eq('id', patternToUpdate.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) return undefined;
      
      const updatedPattern = data[0];
      
      const patternObj: Pattern = {
        id: updatedPattern.id,
        name: updatedPattern.name,
        type: updatedPattern.type,
        content: updatedPattern.content,
        createdAt: new Date(updatedPattern.created_at),
        updatedAt: new Date(updatedPattern.updated_at),
        tags: updatedPattern.tags || [],
        isDefault: updatedPattern.is_default || false
      };
      
      const currentPatterns = this.patternsSubject.getValue();
      this.patternsSubject.next(currentPatterns.map(pattern => 
        pattern.id === patternObj.id ? patternObj : pattern
      ));
      
      return patternObj;
    } catch (error) {
      console.error(`Error updating pattern with id ${patternToUpdate.id}:`, error);
      return undefined;
    }
  }

  updatePattern(patternToUpdate: Partial<Pattern> & { id: string }): Observable<Pattern | undefined> {
    return from(this.updatePatternAsync(patternToUpdate));
  }

  async deletePatternAsync(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.client
        .from('patterns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const currentPatterns = this.patternsSubject.getValue();
      this.patternsSubject.next(currentPatterns.filter(pattern => pattern.id !== id));
      
      return true;
    } catch (error) {
      console.error(`Error deleting pattern with id ${id}:`, error);
      return false;
    }
  }

  deletePattern(id: string): Observable<boolean> {
    return from(this.deletePatternAsync(id));
  }

  async setDefaultPatternAsync(pattern: Pattern): Promise<Pattern | undefined> {
    try {
      const { error: unsettingError } = await this.supabaseService.client
        .from('patterns')
        .update({ is_default: false })
        .eq('type', pattern.type);

      if (unsettingError) throw unsettingError;
      
      const { data, error } = await this.supabaseService.client
        .from('patterns')
        .update({ is_default: true })
        .eq('id', pattern.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) return undefined;
      
      const updatedPattern = data[0];
      
      const patternObj: Pattern = {
        id: updatedPattern.id,
        name: updatedPattern.name,
        type: updatedPattern.type,
        content: updatedPattern.content,
        createdAt: new Date(updatedPattern.created_at),
        updatedAt: updatedPattern.updated_at ? new Date(updatedPattern.updated_at) : undefined,
        tags: updatedPattern.tags || [],
        isDefault: true
      };
      
      const currentPatterns = this.patternsSubject.getValue();
      const updatedPatterns = currentPatterns.map(p => {
        if (p.type === pattern.type) {
          return { ...p, isDefault: p.id === pattern.id };
        }
        return p;
      });
      
      this.patternsSubject.next(updatedPatterns);
      
      return patternObj;
    } catch (error) {
      console.error(`Error setting pattern as default with id ${pattern.id}:`, error);
      return undefined;
    }
  }

  setDefaultPattern(pattern: Pattern): Observable<Pattern | undefined> {
    return from(this.setDefaultPatternAsync(pattern));
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