export type Role = "admin" | "doctor" | "reception";

export type Patient = {
  id: string;
  patientCode: string;
  name: string;
  age: number;
  phone: string;
  tags: string[];
  lastVisitAt: string;
  archivedAt?: string | null;
};

export type VisitStatus =
  | "Waiting"
  | "In Consultation"
  | "Ready for Billing"
  | "Completed";

export type PrescriptionItem = {
  medicineId: string;
  medicineName: string;
  dosage: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Visit = {
  id: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  createdAt: string;
  status: VisitStatus;
  symptoms: string[];
  diagnosis: string;
  notes: string;
  consultationFee: number;
  prescription: PrescriptionItem[];
  medicineCharge: number;
  totalCharge: number;
  receiptIssuedAt: string | null;
};

export type Medicine = {
  id: string;
  name: string;
  stock: number;
  unit: string;
  expiry: string;
  salePrice: number;
  photoDataUrl: string | null;
  lowStock: boolean;
};

export type ReportItem = {
  label: string;
  value: string;
  detail: string;
};

export type DemoUser = {
  username: string;
  password: string;
  passwordHint: string;
  role: Role;
  screens: string[];
};

export type AuthSession = {
  username: string;
  role: Role;
};

export type DashboardNavItem = {
  href: string;
  label: string;
};

export type ClinicSnapshot = {
  users: DemoUser[];
  patients: Patient[];
  visits: Visit[];
  medicines: Medicine[];
  reports: ReportItem[];
};
