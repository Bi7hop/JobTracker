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
    title: string;
    company: string;
    time: string;
    isToday: boolean;
    color: string;
  }
  