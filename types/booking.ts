export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  duration: number;
  service: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}