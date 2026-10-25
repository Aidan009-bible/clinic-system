"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { Medicine } from "@/lib/types";

type MedicineDraft = {
  name: string;
  stock: string;
  unit: string;
  expiry: string;
  salePrice: string;
  photoDataUrl: string | null;
};

function buildDraft(medicine: Medicine): MedicineDraft {
  return {
    name: medicine.name,
    stock: String(medicine.stock),
    unit: medicine.unit,
    expiry: medicine.expiry,
    salePrice: String(medicine.salePrice),
    photoDataUrl: medicine.photoDataUrl,
  };
}

function formatMoney(value: number) {
  return `${value.toLocaleString()} MMK`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

export function MedicineStockTable({
  medicines,
  editable = false,
  title,
  description,
  initialLowStockOnly = false,
}: {
  medicines: Medicine[];
  editable?: boolean;
  title: string;
  description: string;
  initialLowStockOnly?: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MedicineDraft | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(initialLowStockOnly);
  const [error, setError] = useState("");

  const filteredMedicines = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return medicines.filter((medicine) => {
      if (lowStockOnly && !medicine.lowStock) {
        return false;
      }

      return (
        !normalizedQuery ||
        `${medicine.name} ${medicine.unit} ${medicine.expiry}`
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [lowStockOnly, medicines, query]);

  async function saveMedicine(medicineId: string) {
    if (!draft) {
      return;
    }

    setError("");
    setLoadingId(medicineId);

    try {
      const response = await fetch(`/api/medicines/${medicineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          stock: Number(draft.stock),
          unit: draft.unit,
          expiry: draft.expiry,
          salePrice: Number(draft.salePrice),
          photoDataUrl: draft.photoDataUrl,
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to update medicine.");
      }

      setEditingId(null);
      setDraft(null);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to update medicine.",
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function removeMedicine(medicineId: string) {
    setError("");
    setLoadingId(medicineId);

    try {
      const response = await fetch(`/api/medicines/${medicineId}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to delete medicine.");
      }

      if (editingId === medicineId) {
        setEditingId(null);
        setDraft(null);
      }

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to delete medicine.",
      );
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section data-ui="medicine-reference" className="rounded-[24px] border border-[#d8e4ec] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Medicine stock</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[#071b33]">{title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61758a]">{description}</p>
        </div>
        <div className="w-full max-w-sm">
          <label htmlFor="medicine-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#61758a]">
            Search medicine
          </label>
          <input
            id="medicine-search"
            className="w-full rounded-2xl border border-[#d8e4ec] px-4 py-3 text-sm text-[#071b33] outline-none transition placeholder:text-[#8ca0b4] focus:border-[#2f80ed] focus:ring-4 focus:ring-[#e7f0ff]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or unit"
            value={query}
          />
          <button
            aria-pressed={lowStockOnly}
            className={`mt-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              lowStockOnly
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-[#d8e4ec] bg-white text-[#61758a] hover:bg-[#f7fafc]"
            }`}
            onClick={() => setLowStockOnly((current) => !current)}
            type="button"
          >
            {lowStockOnly ? "Showing low stock only" : "Filter low stock"}
          </button>
        </div>
      </div>

      {editable && editingId && draft ? (
        <div data-ui="medicine-editor" className="mt-5 rounded-[20px] border border-[#d8e4ec] bg-[#f7fafc] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Editing medicine</p>
              <h4 className="mt-1 text-xl font-semibold tracking-tight text-[#071b33]">
                {draft.name || "Medicine details"}
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-full bg-[#0b2a5b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#08234c] disabled:opacity-60"
                disabled={loadingId === editingId}
                onClick={() => saveMedicine(editingId)}
                type="button"
              >
                {loadingId === editingId ? "Saving..." : "Save changes"}
              </button>
              <button
                className="rounded-full border border-[#d8e4ec] bg-white px-4 py-2 text-xs font-semibold text-[#61758a] hover:bg-[#f7fafc]"
                onClick={() => {
                  setEditingId(null);
                  setDraft(null);
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-[#d8e4ec] bg-white p-4">
              <div className="h-36 overflow-hidden rounded-2xl border border-[#d8e4ec] bg-[#f7fafc]">
                {draft.photoDataUrl ? (
                  <img
                    alt={draft.name || "Medicine"}
                    className="h-full w-full object-cover"
                    src={draft.photoDataUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#8ca0b4]">
                    No photo
                  </div>
                )}
              </div>
              <input
                accept="image/*"
                className="mt-4 block w-full text-xs text-[#61758a] file:mr-3 file:rounded-xl file:border-0 file:bg-[#0b2a5b] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                onChange={async (event) => {
                  const file = event.target.files?.[0];

                  if (!file) {
                    return;
                  }

                  try {
                    const dataUrl = await readFileAsDataUrl(file);
                    setDraft((current) =>
                      current ? { ...current, photoDataUrl: dataUrl } : current,
                    );
                  } catch (uploadError) {
                    setError(
                      uploadError instanceof Error
                        ? uploadError.message
                        : "Failed to read image.",
                    );
                  }
                }}
                type="file"
              />
              <button
                className="mt-3 text-xs font-semibold text-rose-700"
                onClick={() =>
                  setDraft((current) =>
                    current ? { ...current, photoDataUrl: null } : current,
                  )
                }
                type="button"
              >
                Remove photo
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[#61758a]">
                <span className="font-medium text-[#071b33]">Medicine name</span>
                <input
                  className="rounded-2xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm text-[#071b33] outline-none transition focus:border-[#2f80ed] focus:ring-4 focus:ring-[#e7f0ff]"
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    )
                  }
                  value={draft.name}
                />
              </label>
              <label className="grid gap-2 text-sm text-[#61758a]">
                <span className="font-medium text-[#071b33]">Stock</span>
                <input
                  className="rounded-2xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm text-[#071b33] outline-none transition focus:border-[#2f80ed] focus:ring-4 focus:ring-[#e7f0ff]"
                  min="0"
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, stock: event.target.value } : current,
                    )
                  }
                  type="number"
                  value={draft.stock}
                />
              </label>
              <label className="grid gap-2 text-sm text-[#61758a]">
                <span className="font-medium text-[#071b33]">Unit</span>
                <input
                  className="rounded-2xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm text-[#071b33] outline-none transition focus:border-[#2f80ed] focus:ring-4 focus:ring-[#e7f0ff]"
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, unit: event.target.value } : current,
                    )
                  }
                  value={draft.unit}
                />
              </label>
              <label className="grid gap-2 text-sm text-[#61758a]">
                <span className="font-medium text-[#071b33]">Price</span>
                <input
                  className="rounded-2xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm text-[#071b33] outline-none transition focus:border-[#2f80ed] focus:ring-4 focus:ring-[#e7f0ff]"
                  min="0"
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, salePrice: event.target.value } : current,
                    )
                  }
                  type="number"
                  value={draft.salePrice}
                />
              </label>
              <label className="grid gap-2 text-sm text-[#61758a] md:col-span-2">
                <span className="font-medium text-[#071b33]">Expiry</span>
                <input
                  className="rounded-2xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm text-[#071b33] outline-none transition focus:border-[#2f80ed] focus:ring-4 focus:ring-[#e7f0ff]"
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, expiry: event.target.value } : current,
                    )
                  }
                  type="date"
                  value={draft.expiry}
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-[#61758a] lg:hidden">Swipe the table sideways to see every column.</p>
      <div aria-label="Medicine stock table, scroll horizontally for all columns" className="mt-3 max-w-full overflow-x-auto overscroll-x-contain rounded-[20px] border border-[#d8e4ec]" role="region" tabIndex={0}>
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-[#f7fafc] text-left text-xs uppercase tracking-[0.1em] text-[#61758a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Photo</th>
              <th className="px-4 py-3 font-semibold">Medicine</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Unit</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Expiry</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              {editable ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.map((medicine) => {
              const isEditing = editingId === medicine.id && draft;

              return (
                <tr data-editing={Boolean(isEditing)} key={medicine.id} className="border-t border-[#d8e4ec] align-top text-[#61758a] transition hover:bg-[#f7fafc]">
                  <td className="px-4 py-3">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border border-[#d8e4ec] bg-[#f7fafc]">
                      {medicine.photoDataUrl ? (
                        <img
                          alt={medicine.name}
                          className="h-full w-full object-cover"
                          src={medicine.photoDataUrl}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[11px] text-[#8ca0b4]">
                          No photo
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-[#071b33]">{medicine.name}</p>
                      <p className="mt-1 text-xs text-[#61758a]">ID: {medicine.id}</p>
                    </div>
                  </td>
                  <td data-ui="stock-value" className="px-4 py-3 font-semibold text-[#071b33]">{medicine.stock.toLocaleString()}</td>
                  <td className="px-4 py-3">{medicine.unit}</td>
                  <td data-ui="price-value" className="px-4 py-3">{formatMoney(medicine.salePrice)}</td>
                  <td className="px-4 py-3">{medicine.expiry}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        medicine.lowStock
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {medicine.lowStock ? "Low" : "OK"}
                    </span>
                  </td>
                  {editable ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                            isEditing
                              ? "bg-[#e7f0ff] text-[#0b2a5b]"
                              : "bg-[#0b2a5b] text-white hover:bg-[#08234c]"
                          }`}
                          onClick={() => {
                            setError("");
                            setEditingId(medicine.id);
                            setDraft(buildDraft(medicine));
                          }}
                          type="button"
                        >
                          {isEditing ? "Editing" : "Edit"}
                        </button>
                        <button
                          className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                          disabled={loadingId === medicine.id}
                          onClick={() => removeMedicine(medicine.id)}
                          type="button"
                        >
                          {loadingId === medicine.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {!filteredMedicines.length ? (
              <tr>
                <td
                  className="px-4 py-12 text-center text-sm text-[#61758a]"
                  colSpan={editable ? 8 : 7}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f0ff] text-[#0b2a5b]">
                    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 4.5a4.95 4.95 0 0 1 7 7l-4 4a4.95 4.95 0 0 1-7-7l4-4Z" />
                      <path strokeLinecap="round" d="m8 12 4 4" />
                    </svg>
                  </div>
                  <p className="mt-4 font-semibold text-[#071b33]">No medicines found</p>
                  <p className="mt-1 text-[#61758a]">Try another search term or clear the low-stock filter.</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
      ) : null}
    </section>
  );
}
