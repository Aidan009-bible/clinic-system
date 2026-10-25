import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { deletePatient, updatePatient } from "@/lib/clinic-server";

function refreshPatientPages() {
  for (const path of ["/reception/patients", "/reception/overview", "/reception/queue", "/reception/billing", "/admin/patients", "/admin/overview", "/doctor/history", "/doctor/queue"]) {
    revalidatePath(path);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "reception"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const patient = await updatePatient(id, {
      name: String(body.name ?? ""),
      age: Number(body.age),
      phone: String(body.phone ?? ""),
    });
    refreshPatientPages();
    return NextResponse.json({ patient });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update patient." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "reception"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deletePatient(id);
    refreshPatientPages();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete patient." }, { status: 400 });
  }
}
