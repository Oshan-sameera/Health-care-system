export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'patient' | 'admin';
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  about: string;
  image: string;
  department: string;
  availableDays: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  title: string;
  fileUrl: string;
  date: string;
  createdAt: string;
}
