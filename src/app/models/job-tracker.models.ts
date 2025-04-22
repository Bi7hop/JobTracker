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
}

export interface Event {
  id: string | number; 
  title: string;
  company: string;
  time: string;
  date: string; 
  color: string; 
}

