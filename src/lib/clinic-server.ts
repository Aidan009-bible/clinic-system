import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { demoClinicSnapshot } from "@/lib/demo-data";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type {
  ClinicSnapshot,
  DemoUser,
  Medicine,
  Patient,
  PrescriptionItem,
  ReportItem,
  Visit,
  VisitStatus,
} from "@/lib/types";

const localStorePath = path.join(process.cwd(), "data", "clinic-store.json");
const snapshotRevisions = new WeakMap<ClinicSnapshot, number>();

function cloneSnapshot(snapshot: ClinicSnapshot) {
  return JSON.parse(JSON.stringify(snapshot)) as ClinicSnapshot;
}

function normalizeUser(user: Record<string, unknown>): DemoUser | null {
  const username = String(user.username ?? "").trim();

  if (!username) {
    return null;
  }

  const normalizedRole =
    user.role === "admin"
      ? "admin"
      : user.role === "reception"
        ? "reception"
        : "doctor";

  const defaultScreens =
    normalizedRole === "admin"
      ? ["Overview", "Patients", "Medicine Stocks"]
      : normalizedRole === "reception"
        ? ["Overview", "Patients", "Queue", "Billing", "Medicine Stock"]
        : ["Overview", "Waiting", "Patient History", "Medicine Stock"];

  return {
    username,
    password: String(user.password ?? (normalizedRole === "admin" ? "admin123" : normalizedRole === "reception" ? "reception123" : "doctor123")),
    passwordHint: String(user.passwordHint ?? user.password_hint ?? (normalizedRole === "admin" ? "admin123" : normalizedRole === "reception" ? "reception123" : "doctor123")),
    role: normalizedRole,
    screens: defaultScreens,
  };
}

function normalizePatient(patient: Record<string, unknown>): Patient | null {
  const id = String(patient.id ?? "").trim();
  const patientCode = String(patient.patientCode ?? patient.patient_code ?? "").trim();
  const name = String(patient.name ?? "").trim();

  if (!id || !patientCode || !name) {
    return null;
  }

  return {
    id,
    patientCode,
    name,
    age: Number(patient.age ?? 0),
    phone: String(patient.phone ?? ""),
    tags: Array.isArray(patient.tags) ? patient.tags.map(String) : [],
    lastVisitAt: String(
      patient.lastVisitAt ??
        patient.last_visit_at ??
        patient.lastVisit ??
        patient.last_visit ??
        new Date().toISOString(),
    ),
  };
}

function normalizeMedicine(medicine: Record<string, unknown>): Medicine | null {
  const id = String(medicine.id ?? "").trim();
  const name = String(medicine.name ?? "").trim();

  if (!id || !name) {
    return null;
  }

  return computeMedicineFlags({
    id,
    name,
    stock: Number(medicine.stock ?? 0),
    unit: String(medicine.unit ?? ""),
    expiry: String(medicine.expiry ?? ""),
    salePrice: Number(medicine.salePrice ?? medicine.sale_price ?? 0),
    photoDataUrl:
      medicine.photoDataUrl == null && medicine.photo_data_url == null
        ? null
        : String(medicine.photoDataUrl ?? medicine.photo_data_url),
    lowStock: Boolean(medicine.lowStock ?? medicine.low_stock),
  });
}

function normalizePrescriptionItem(
  item: Record<string, unknown>,
  medicines: Medicine[],
): PrescriptionItem | null {
  const medicineName = String(item.medicineName ?? item.medicine ?? "").trim();
  const quantity = Number(item.quantity ?? 0);

  if (!medicineName || quantity <= 0) {
    return null;
  }

  const matchedMedicine = medicines.find(
    (medicine) => medicine.name.toLowerCase() === medicineName.toLowerCase(),
  );
  const unitPrice = Number(item.unitPrice ?? item.unit_price ?? matchedMedicine?.salePrice ?? 0);

  return {
    medicineId: String(item.medicineId ?? item.medicine_id ?? matchedMedicine?.id ?? buildId("med-ref")),
    medicineName,
    dosage: String(item.dosage ?? ""),
    quantity,
    unitPrice,
    lineTotal: Number(item.lineTotal ?? item.line_total ?? unitPrice * quantity),
  };
}

function normalizeVisit(visit: Record<string, unknown>, patients: Patient[], medicines: Medicine[]): Visit | null {
  const id = String(visit.id ?? "").trim();
  const patientCode = String(visit.patientCode ?? visit.patient_code ?? "").trim();
  const patientName = String(visit.patientName ?? visit.patient_name ?? "").trim();

  if (!id || !patientCode || !patientName) {
    return null;
  }

  const matchedPatient =
    patients.find((patient) => patient.patientCode === patientCode) ??
    patients.find((patient) => patient.name === patientName);

  const prescription = Array.isArray(visit.prescription)
    ? visit.prescription
        .map((item) => normalizePrescriptionItem(item as Record<string, unknown>, medicines))
        .filter((item): item is PrescriptionItem => Boolean(item))
    : [];

  const normalizedVisit: Visit = {
    id,
    patientId: String(visit.patientId ?? visit.patient_id ?? matchedPatient?.id ?? ""),
    patientCode,
    patientName,
    createdAt: String(
      visit.createdAt ??
        visit.created_at ??
        visit.receiptIssuedAt ??
        matchedPatient?.lastVisitAt ??
        new Date().toISOString(),
    ),
    status:
      visit.status === "Completed"
        ? "Completed"
        : visit.status === "Ready for Billing" || visit.status === "Prescription Ready"
          ? "Ready for Billing"
          : visit.status === "In Consultation" || visit.status === "With Doctor"
            ? "In Consultation"
            : "Waiting",
    symptoms: Array.isArray(visit.symptoms) ? visit.symptoms.map(String) : [],
    diagnosis: String(visit.diagnosis ?? ""),
    notes: String(visit.notes ?? ""),
    consultationFee: Number(visit.consultationFee ?? visit.consultation_fee ?? 0),
    prescription,
    medicineCharge: Number(visit.medicineCharge ?? visit.medicine_charge ?? prescription.reduce((sum, item) => sum + item.lineTotal, 0)),
    totalCharge: Number(visit.totalCharge ?? visit.total_charge ?? 0),
    receiptIssuedAt:
      visit.receiptIssuedAt == null && visit.receipt_issued_at == null
        ? null
        : String(visit.receiptIssuedAt ?? visit.receipt_issued_at),
  };

  computeVisitTotals(normalizedVisit);
  return normalizedVisit;
}

function normalizeSnapshot(raw: unknown): ClinicSnapshot {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const usersRaw = Array.isArray(source.users) ? source.users : demoClinicSnapshot.users;
  const patientsRaw = Array.isArray(source.patients) ? source.patients : demoClinicSnapshot.patients;
  const medicinesRaw = Array.isArray(source.medicines) ? source.medicines : demoClinicSnapshot.medicines;

  const users = usersRaw
    .map((user) => normalizeUser(user as Record<string, unknown>))
    .filter((user): user is DemoUser => Boolean(user));

  const patients = patientsRaw
    .map((patient) => normalizePatient(patient as Record<string, unknown>))
    .filter((patient): patient is Patient => Boolean(patient));

  const medicines = medicinesRaw
    .map((medicine) => normalizeMedicine(medicine as Record<string, unknown>))
    .filter((medicine): medicine is Medicine => Boolean(medicine));

  const visitsRaw = Array.isArray(source.visits)
    ? source.visits
    : Array.isArray(source.queue)
      ? source.queue
      : demoClinicSnapshot.visits;

  const visits = visitsRaw
    .map((visit) => normalizeVisit(visit as Record<string, unknown>, patients, medicines))
    .filter((visit): visit is Visit => Boolean(visit));

  const mergedUsers = users.length ? users : demoClinicSnapshot.users;
  const hasDoctorUser = mergedUsers.some((user) => user.username === "doctor");

  return buildSnapshotWithReports({
    users: hasDoctorUser
      ? mergedUsers
      : [
          ...mergedUsers.filter((user) => user.username !== "doctor1" && user.username !== "doctor2"),
          demoClinicSnapshot.users.find((user) => user.username === "doctor")!,
        ],
    patients,
    visits,
    medicines,
    reports: demoClinicSnapshot.reports,
  });
}

function buildSnapshotWithReports(snapshot: ClinicSnapshot) {
  const todayVisits = snapshot.visits.filter((visit) =>
    visit.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10),
  );
  const completedRevenue = snapshot.visits
    .filter((visit) => visit.status === "Completed")
    .reduce((sum, visit) => sum + visit.totalCharge, 0);
  const lowStockCount = snapshot.medicines.filter((medicine) => medicine.lowStock).length;

  return {
    ...snapshot,
    reports: [
      {
        label: "Today patients",
        value: String(todayVisits.length),
        detail: `${todayVisits.filter((visit) => visit.status === "Completed").length} completed, ${
          todayVisits.filter((visit) => visit.status === "Ready for Billing").length
        } waiting for billing`,
      },
      {
        label: "Completed revenue",
        value: `${completedRevenue.toLocaleString()} MMK`,
        detail: "Bills already issued by reception",
      },
      {
        label: "Low stock alerts",
        value: String(lowStockCount),
        detail: "Medicines at or below 20 units",
      },
    ] satisfies ReportItem[],
  };
}

async function ensureLocalStore() {
  try {
    const raw = await readFile(localStorePath, "utf8");
    if (!raw.trim()) {
      throw new Error("empty-store");
    }
  } catch {
    await mkdir(path.dirname(localStorePath), { recursive: true });
    await writeLocalStore(demoClinicSnapshot);
  }
}

async function readLocalStore(): Promise<ClinicSnapshot> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("clinic_state")
      .select("snapshot, revision")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      throw new Error(`Could not read Supabase clinic data: ${error.message}`);
    }

    if (!data) {
      const { error: seedError } = await supabase.from("clinic_state").upsert({
        id: "default",
        snapshot: cloneSnapshot(demoClinicSnapshot),
        revision: 0,
      }, { onConflict: "id", ignoreDuplicates: true });

      if (seedError) throw new Error(`Could not initialize clinic data: ${seedError.message}`);
      return readLocalStore();
    }

    const snapshot = normalizeSnapshot(data.snapshot);
    snapshotRevisions.set(snapshot, Number(data.revision));
    return snapshot;
  }

  if (process.env.VERCEL) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel before using the clinic.");
  }

  await ensureLocalStore();
  let raw = "";

  try {
    raw = await readFile(localStorePath, "utf8");

    if (!raw.trim()) {
      throw new Error("empty-store");
    }

    const normalized = normalizeSnapshot(JSON.parse(raw) as unknown);
    const normalizedJson = JSON.stringify(normalized, null, 2);

    if (normalizedJson !== raw) {
      await writeLocalStore(normalized);
    }

    return normalized;
  } catch {
    const fallback = cloneSnapshot(demoClinicSnapshot);
    await writeLocalStore(fallback);
    return buildSnapshotWithReports(fallback);
  }
}

async function writeLocalStore(snapshot: ClinicSnapshot) {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const revision = snapshotRevisions.get(snapshot);
    if (revision === undefined) throw new Error("Refresh the clinic before saving changes.");

    // Compare revisions so simultaneous staff updates cannot overwrite each other.
    const { data, error } = await supabase.from("clinic_state")
      .update({ snapshot, revision: revision + 1, updated_at: new Date().toISOString() })
      .eq("id", "default")
      .eq("revision", revision)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(`Could not save Supabase clinic data: ${error.message}`);
    }

    if (!data) throw new Error("Another staff member saved changes. Refresh and try again.");
    snapshotRevisions.set(snapshot, revision + 1);

    return;
  }

  await mkdir(path.dirname(localStorePath), { recursive: true });
  const tempPath = `${localStorePath}.tmp`;
  await writeFile(tempPath, JSON.stringify(snapshot, null, 2), "utf8");
  await rename(tempPath, localStorePath);
}

function buildId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function buildPatientCode(snapshot: ClinicSnapshot) {
  const maxCode = snapshot.patients.reduce((max, patient) => {
    const numeric = Number(patient.patientCode.replace("P-", ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 24000);

  return `P-${String(maxCode + 1)}`;
}

function computeMedicineFlags(medicine: Medicine) {
  medicine.lowStock = medicine.stock <= 20;
  return medicine;
}

function computeVisitTotals(visit: Visit) {
  visit.medicineCharge = visit.prescription.reduce((sum, item) => sum + item.lineTotal, 0);
  visit.totalCharge = visit.consultationFee + visit.medicineCharge;
  return visit;
}

function deriveDoctorVisitStatus(visit: Visit): VisitStatus {
  if (visit.receiptIssuedAt) {
    return "Completed";
  }

  if (visit.diagnosis.trim() || visit.consultationFee > 0 || visit.prescription.length > 0) {
    return "Ready for Billing";
  }

  return "Waiting";
}

function parsePrescriptionText(text: string, medicines: Medicine[]) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [medicineNameRaw, dosageRaw, quantityRaw] = line.split("|").map((item) => item.trim());
      const medicine = medicines.find(
        (entry) => entry.name.toLowerCase() === medicineNameRaw.toLowerCase(),
      );
      const quantity = Number(quantityRaw ?? 0);
      const unitPrice = medicine?.salePrice ?? 0;

      return {
        medicineId: medicine?.id ?? buildId("med-ref"),
        medicineName: medicineNameRaw,
        dosage: dosageRaw ?? "",
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      } satisfies PrescriptionItem;
    })
    .filter((item) => item.medicineName && item.quantity > 0);
}

function normalizePrescriptionInput(
  items: Array<{
    medicineId?: string;
    dosage?: string;
    quantity?: number;
  }>,
  medicines: Medicine[],
) {
  return items
    .map((item) => {
      const medicine = medicines.find((entry) => entry.id === item.medicineId);
      const quantity = Math.max(0, Number(item.quantity ?? 0));

      if (!medicine || quantity <= 0) {
        return null;
      }

      return {
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage: String(item.dosage ?? "").trim(),
        quantity,
        unitPrice: medicine.salePrice,
        lineTotal: medicine.salePrice * quantity,
      } satisfies PrescriptionItem;
    })
    .filter((item): item is PrescriptionItem => Boolean(item));
}

export async function getClinicSnapshot() {
  return readLocalStore();
}

export async function authenticateDemoUser(username: string, password: string) {
  const snapshot = await readLocalStore();
  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();

  return (
    snapshot.users.find(
      (user) => user.username === normalizedUsername && user.password === normalizedPassword,
    ) ??
    demoClinicSnapshot.users.find(
      (user) => user.username === normalizedUsername && user.password === normalizedPassword,
    ) ??
    null
  );
}

export async function createPatient(input: {
  name: string;
  age: number;
  phone: string;
  tags: string[];
}) {
  const snapshot = await readLocalStore();
  const patient: Patient = {
    id: buildId("pat"),
    patientCode: buildPatientCode(snapshot),
    name: input.name.trim(),
    age: input.age,
    phone: input.phone.trim(),
    tags: input.tags,
    lastVisitAt: new Date().toISOString(),
  };

  snapshot.patients.unshift(patient);
  await writeLocalStore(snapshot);
  return patient;
}

export async function createVisit(input: {
  patientId: string;
  symptoms: string[];
}) {
  const snapshot = await readLocalStore();
  const patient = snapshot.patients.find((entry) => entry.id === input.patientId);

  if (!patient) {
    throw new Error("Patient not found.");
  }

  const visit: Visit = {
    id: buildId("visit"),
    patientId: patient.id,
    patientCode: patient.patientCode,
    patientName: patient.name,
    createdAt: new Date().toISOString(),
    status: "Waiting",
    symptoms: input.symptoms,
    diagnosis: "",
    notes: "",
    consultationFee: 0,
    prescription: [],
    medicineCharge: 0,
    totalCharge: 0,
    receiptIssuedAt: null,
  };

  patient.lastVisitAt = visit.createdAt;
  snapshot.visits.unshift(visit);
  await writeLocalStore(snapshot);
  return visit;
}

export async function updateQueuedVisit(visitId: string, symptoms: string[]) {
  const snapshot = await readLocalStore();
  const visit = snapshot.visits.find((entry) => entry.id === visitId);

  if (!visit) {
    throw new Error("Visit not found.");
  }

  if (!["Waiting", "In Consultation"].includes(visit.status)) {
    throw new Error("Only an active queue visit can be edited by reception.");
  }

  visit.symptoms = symptoms.map((symptom) => symptom.trim()).filter(Boolean);
  await writeLocalStore(snapshot);
  return visit;
}

export async function deleteQueuedVisit(visitId: string) {
  const snapshot = await readLocalStore();
  const visitIndex = snapshot.visits.findIndex((entry) => entry.id === visitId);

  if (visitIndex === -1) {
    throw new Error("Visit not found.");
  }

  if (!["Waiting", "In Consultation"].includes(snapshot.visits[visitIndex].status)) {
    throw new Error("Only an active queue visit can be deleted by reception.");
  }

  const [visit] = snapshot.visits.splice(visitIndex, 1);
  await writeLocalStore(snapshot);
  return visit;
}

export async function updateVisitClinical(
  visitId: string,
  payload: {
    diagnosis?: string;
    notes?: string;
    consultationFee?: number;
    prescriptionText?: string;
    prescriptionItems?: Array<{
      medicineId?: string;
      dosage?: string;
      quantity?: number;
    }>;
  },
) {
  const snapshot = await readLocalStore();
  const visit = snapshot.visits.find((entry) => entry.id === visitId);

  if (!visit) {
    throw new Error("Visit not found.");
  }

  visit.diagnosis = payload.diagnosis ?? visit.diagnosis;
  visit.notes = payload.notes ?? visit.notes;
  visit.consultationFee = Number(payload.consultationFee ?? visit.consultationFee ?? 0);

  if (Array.isArray(payload.prescriptionItems)) {
    visit.prescription = normalizePrescriptionInput(payload.prescriptionItems, snapshot.medicines);
  } else if (payload.prescriptionText !== undefined) {
    visit.prescription = parsePrescriptionText(payload.prescriptionText, snapshot.medicines);
  }

  computeVisitTotals(visit);
  visit.status = deriveDoctorVisitStatus(visit);
  await writeLocalStore(snapshot);
  return visit;
}

export async function startVisitConsultation(visitId: string) {
  const snapshot = await readLocalStore();
  const visit = snapshot.visits.find((entry) => entry.id === visitId);

  if (!visit) {
    throw new Error("Visit not found.");
  }

  if (visit.status === "Completed" || visit.status === "Ready for Billing") {
    throw new Error("This visit is no longer waiting for consultation.");
  }

  visit.status = "In Consultation";
  await writeLocalStore(snapshot);
  return visit;
}

export async function issueBillAndReduceStock(visitId: string) {
  const snapshot = await readLocalStore();
  const visit = snapshot.visits.find((entry) => entry.id === visitId);

  if (!visit) {
    throw new Error("Visit not found.");
  }

  if (visit.status === "Completed" || visit.receiptIssuedAt) {
    return visit;
  }

  if (visit.status !== "Ready for Billing") {
    throw new Error("The doctor must finish this consultation before issuing a bill.");
  }

  for (const item of visit.prescription) {
    const medicine = snapshot.medicines.find((entry) => entry.id === item.medicineId);

    if (!medicine) {
      continue;
    }

    if (medicine.stock < item.quantity) {
      throw new Error(`Not enough stock for ${medicine.name}.`);
    }

    medicine.stock -= item.quantity;
    computeMedicineFlags(medicine);
  }

  visit.status = "Completed";
  visit.receiptIssuedAt = new Date().toISOString();
  computeVisitTotals(visit);
  await writeLocalStore(snapshot);
  return visit;
}

export async function adjustMedicineStock(medicineId: string, delta: number) {
  const snapshot = await readLocalStore();
  const medicine = snapshot.medicines.find((entry) => entry.id === medicineId);

  if (!medicine) {
    throw new Error("Medicine not found.");
  }

  medicine.stock = Math.max(0, medicine.stock + delta);
  computeMedicineFlags(medicine);
  await writeLocalStore(snapshot);
  return medicine;
}

export async function updateMedicine(
  medicineId: string,
  input: {
    name: string;
    stock: number;
    unit: string;
    expiry: string;
    salePrice: number;
    photoDataUrl?: string | null;
  },
) {
  const snapshot = await readLocalStore();
  const medicine = snapshot.medicines.find((entry) => entry.id === medicineId);

  if (!medicine) {
    throw new Error("Medicine not found.");
  }

  const trimmedName = input.name.trim();
  const trimmedUnit = input.unit.trim();
  const trimmedExpiry = input.expiry.trim();

  if (!trimmedName) {
    throw new Error("Medicine name is required.");
  }

  if (!trimmedUnit) {
    throw new Error("Medicine unit is required.");
  }

  if (!trimmedExpiry) {
    throw new Error("Medicine expiry is required.");
  }

  medicine.name = trimmedName;
  medicine.stock = Math.max(0, Number(input.stock) || 0);
  medicine.unit = trimmedUnit;
  medicine.expiry = trimmedExpiry;
  medicine.salePrice = Math.max(0, Number(input.salePrice) || 0);
  medicine.photoDataUrl = input.photoDataUrl?.trim() ? input.photoDataUrl : null;
  computeMedicineFlags(medicine);

  await writeLocalStore(snapshot);
  return medicine;
}

export async function createMedicine(input: {
  name: string;
  stock: number;
  unit: string;
  expiry: string;
  salePrice: number;
  photoDataUrl?: string | null;
}) {
  const snapshot = await readLocalStore();
  const medicine: Medicine = computeMedicineFlags({
    id: buildId("med"),
    name: input.name.trim(),
    stock: input.stock,
    unit: input.unit.trim(),
    expiry: input.expiry,
    salePrice: input.salePrice,
    photoDataUrl: input.photoDataUrl?.trim() ? input.photoDataUrl : null,
    lowStock: false,
  });

  snapshot.medicines.unshift(medicine);
  await writeLocalStore(snapshot);
  return medicine;
}

export async function importMedicinesFromCsv(csvText: string) {
  const snapshot = await readLocalStore();
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("CSV content is empty.");
  }

  const imported: Medicine[] = [];

  for (const [index, line] of lines.entries()) {
    const [name, stock, unit, expiry, salePrice] = line.split(",").map((item) => item.trim());

    if (index === 0 && name.toLowerCase() === "name") {
      continue;
    }

    if (!name || !stock || !unit || !expiry || !salePrice) {
      continue;
    }

    const existing = snapshot.medicines.find(
      (entry) => entry.name.toLowerCase() === name.toLowerCase(),
    );

    if (existing) {
      existing.stock = Number(stock);
      existing.unit = unit;
      existing.expiry = expiry;
      existing.salePrice = Number(salePrice);
      computeMedicineFlags(existing);
      imported.push(existing);
      continue;
    }

    const medicine: Medicine = computeMedicineFlags({
      id: buildId("med"),
      name,
      stock: Number(stock),
      unit,
      expiry,
      salePrice: Number(salePrice),
      photoDataUrl: null,
      lowStock: false,
    });

    snapshot.medicines.unshift(medicine);
    imported.push(medicine);
  }

  await writeLocalStore(snapshot);
  return imported;
}

export async function deleteMedicine(medicineId: string) {
  const snapshot = await readLocalStore();
  const medicineIndex = snapshot.medicines.findIndex((entry) => entry.id === medicineId);

  if (medicineIndex === -1) {
    throw new Error("Medicine not found.");
  }

  const inActiveVisit = snapshot.visits.some(
    (visit) =>
      visit.status !== "Completed" &&
      visit.prescription.some((item) => item.medicineId === medicineId),
  );

  if (inActiveVisit) {
    throw new Error("Cannot delete medicine used in an active visit.");
  }

  const [medicine] = snapshot.medicines.splice(medicineIndex, 1);
  await writeLocalStore(snapshot);
  return medicine;
}

export async function getPatientHistory(patientId: string) {
  const snapshot = await readLocalStore();
  return snapshot.visits
    .filter((visit) => visit.patientId === patientId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function resetClinicStore() {
  const snapshot = cloneSnapshot(demoClinicSnapshot);
  await writeLocalStore(snapshot);
  return snapshot;
}

export async function getUsers() {
  const snapshot = await readLocalStore();
  return snapshot.users as DemoUser[];
}
