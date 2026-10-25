"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MedicineStockTable } from "@/components/medicine-stock-table";
import type { Medicine } from "@/lib/types";

function InventoryMetricIcon({ label }: { label: string }) {
  const paths: Record<string, string> = {
    "Medicine types": "M8.5 4.5a4.95 4.95 0 0 1 7 7l-4 4a4.95 4.95 0 0 1-7-7l4-4ZM8 12l4 4",
    "Total units": "M4 7h16M6 7v13h12V7M9 11h6M7 3h10l3 4H4l3-4Z",
    "Low stock": "M12 9v4m0 4h.01M10.3 4.6 2.8 17.5A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.5L13.7 4.6a2 2 0 0 0-3.4 0Z",
    "Missing photos": "M4 4h16v16H4V4Zm0 12 5-5 4 4 3-3 4 4M8 8h.01",
  };

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[label]} />
    </svg>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

export function AdminActions({
  medicines,
  initialLowStockOnly = false,
}: {
  medicines: Medicine[];
  initialLowStockOnly?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const totalUnits = medicines.reduce((sum, medicine) => sum + medicine.stock, 0);
  const lowStockCount = medicines.filter((medicine) => medicine.lowStock).length;
  const noPhotoCount = medicines.filter((medicine) => !medicine.photoDataUrl).length;

  async function submitJson(url: string, method: string, body: object) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(result.error ?? "Request failed.");
    }
  }

  return (
    <div className="admin-inventory grid min-w-0 grid-cols-1 gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Medicine types", medicines.length.toLocaleString(), "Items in inventory"],
          ["Total units", totalUnits.toLocaleString(), "Combined stock count"],
          ["Low stock", lowStockCount.toLocaleString(), "Needs restock review"],
          ["Missing photos", noPhotoCount.toLocaleString(), "Improve visual records"],
        ].map(([label, value, detail]) => (
          <div className={`rounded-[20px] border p-4 shadow-sm ${label === "Low stock" ? "border-amber-200 bg-amber-50" : "border-[#d8e4ec] bg-white"}`} key={label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#61758a]">{label}</p>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${label === "Low stock" ? "bg-amber-100 text-amber-800" : label === "Missing photos" ? "bg-[#f1f5f9] text-[#61758a]" : "bg-[#e7f0ff] text-[#0b2a5b]"}`}>
                <InventoryMetricIcon label={label} />
              </div>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-[#071b33]">{value}</p>
            <p className="mt-2 text-xs text-[#61758a]">{detail}</p>
          </div>
        ))}
      </section>

      <section>
        <form
          className="admin-stock-entry rounded-[20px] border border-[#d8e4ec] bg-white p-5 shadow-sm"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setLoading("manual");
            const form = event.currentTarget;
            const formData = new FormData(form);

            try {
              await submitJson("/api/medicines", "POST", {
                mode: "manual",
                name: String(formData.get("name") ?? ""),
                stock: Number(formData.get("stock") ?? 0),
                unit: String(formData.get("unit") ?? ""),
                expiry: String(formData.get("expiry") ?? ""),
                salePrice: Number(formData.get("salePrice") ?? 0),
                photoDataUrl,
              });
              form.reset();
              setPhotoDataUrl(null);
              router.refresh();
            } catch (submitError) {
              setError(
                submitError instanceof Error ? submitError.message : "Failed to add medicine.",
              );
            } finally {
              setLoading(null);
            }
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Inventory tools</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#071b33]">
            Add medicine
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#61758a]">
            Record medicine details, available quantity, sale price, and expiry. A photo is optional.
          </p>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="grid gap-4">
              <label className="grid min-w-0 gap-2 text-sm font-medium text-[#071b33]">
                <span>Medicine name</span>
                <input
                  className="rounded-2xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm text-[#071b33] outline-none transition placeholder:text-[#8ca0b4] focus:border-[#2f80ed] focus:ring-4 focus:ring-[#e7f0ff]"
                  name="name"
                  placeholder="Medicine name"
                  required
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid min-w-0 gap-2 text-sm font-medium text-[#071b33]">
                  <span>Stock quantity</span>
                  <input
                    className="rounded-2xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm text-[#071b33] outline-none transition placeholder:text-[#8ca0b4] focus:border-[#2f80ed] focus:ring-4 focus:ring-[#e7f0ff]"
                    min="0"
                    name="stock"
                    placeholder="Stock quantity"
                    required
                    type="number"
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-medium text-[#071b33]">
                  <span>Unit</span>
                  <input
                    className="rounded-2xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm text-[#071b33] outline-none transition placeholder:text-[#8ca0b4] focus:border-[#2f80ed] focus:ring-4 focus:ring-[#e7f0ff]"
                    name="unit"
                    placeholder="e.g. tabs, capsules, packs"
                    required
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid min-w-0 gap-2 text-sm font-medium text-[#071b33]">
                  <span>Expiry date</span>
                  <input
                    className="rounded-2xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm text-[#071b33] outline-none transition focus:border-[#2f80ed] focus:ring-4 focus:ring-[#e7f0ff]"
                    name="expiry"
                    required
                    type="date"
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-medium text-[#071b33]">
                  <span>Sale price (MMK)</span>
                  <input
                    className="rounded-2xl border border-[#d8e4ec] bg-white px-4 py-3 text-sm text-[#071b33] outline-none transition placeholder:text-[#8ca0b4] focus:border-[#2f80ed] focus:ring-4 focus:ring-[#e7f0ff]"
                    min="0"
                    name="salePrice"
                    placeholder="Sale price MMK"
                    required
                    type="number"
                  />
                </label>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-[#b9cbe0] bg-[#f7fafc] p-4">
              <label htmlFor="new-medicine-photo" className="block text-sm font-semibold text-[#071b33]">Medicine photo <span className="font-normal text-[#61758a]">(optional)</span></label>
              <p className="mt-2 text-xs leading-5 text-[#61758a]">Use a clear photo of the medicine or packaging for easy identification.</p>
              <input
                id="new-medicine-photo"
                accept="image/*"
                className="mt-3 block w-full text-sm text-[#61758a] file:mr-3 file:rounded-xl file:border-0 file:bg-[#0b2a5b] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                onChange={async (event) => {
                  const file = event.target.files?.[0];

                  if (!file) {
                    setPhotoDataUrl(null);
                    return;
                  }

                  try {
                    setPhotoDataUrl(await readFileAsDataUrl(file));
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
              {photoDataUrl ? (
                <div className="mt-4 h-24 w-24 overflow-hidden rounded-2xl border border-[#d8e4ec] bg-white">
                  <img
                    alt="Medicine preview"
                    className="h-full w-full object-cover"
                    src={photoDataUrl}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <button
            className="mt-5 min-h-11 rounded-xl bg-[#0b2a5b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#08234c] disabled:opacity-60"
            disabled={loading === "manual"}
            type="submit"
          >
            {loading === "manual" ? "Saving..." : "Create medicine"}
          </button>
          {error ? (
            <p role="alert" className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
          ) : null}
        </form>

      </section>

      <MedicineStockTable
        description="Search inventory, review availability, and update medicine details."
        editable
        initialLowStockOnly={initialLowStockOnly}
        medicines={medicines}
        title="Medicine stock list"
      />
    </div>
  );
}
