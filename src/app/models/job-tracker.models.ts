export interface Stat {
  title: string;
  value: number;
  total?: number;
  color: string;
  borderColor: string;
}

export interface Application {
  id?: string | number; 
  company: string;
  location: string;
  position: string;
  status: string;
  date: string;
  color: string;
  hasNotes?: boolean;
  hasCommunications?: boolean;
  hasReminders?: boolean;
}

export interface Event {
  id: string | number; 
  title: string;
  company: string;
  time: string;
  date: string; 
  color: string; 
}

export interface Event {
  id: string | number; 
  title: string;
  company: string;
  time: string;
  date: string; 
  color: string; 
}

export interface Note {
  id: string;
  applicationId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Communication {
  id: string;
  applicationId: string;
  type: 'email' | 'phone' | 'meeting' | 'other';
  subject: string;
  content: string;
  date: Date;
  direction: 'incoming' | 'outgoing';
  contactPerson?: string;
  createdAt: Date;
}

export interface FollowUpReminder {
  id: string;
  applicationId: string;
  date: Date;
  reminderText: string;
  isCompleted: boolean;
  createdAt: Date;
}