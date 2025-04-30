import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private memoryStorage: Record<string, string> = {};

  constructor() {
    const customStorage = {
      getItem: (key: string): string | null => {
        return this.memoryStorage[key] || null;
      },
      setItem: (key: string, value: string) => {
        this.memoryStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete this.memoryStorage[key];
      }
    };

    this.supabase = createClient(
      environment.supabase.url, 
      environment.supabase.key,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          storage: customStorage
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js/2.x angular'
          }
        }
      }
    );
  }

  get client() {
    return this.supabase;
  }
}