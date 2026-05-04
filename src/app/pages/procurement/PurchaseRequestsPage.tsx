import { useState, useEffect } from "react";
import {
  getPurchaseRequests,
  PurchaseRequest as ApiPR,
} from "../../api/procurement-requests";
import {
  ShoppingCart,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  X,
  Trash2,
  Send,
  Users,
  ArrowRight,
  LinkIcon,
} from "lucide-react";
import {
  AdvancedFilter,
  applyFiltersAndSort,
  type FilterFieldDef,
  type ActiveFilters,
  type SortConfig,
} from "../../components/AdvancedFilter";

// ── Types ─────────────────────────────────────────────────────────────────────
type PRStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent_to_suppliers"
  | "quotes_received"
  | "po_created"
  | "cancelled";
type SupplierStatus =
  | "not_sent"
  | "request_sent"
  | "quote_received"
  | "po_created"
  | "approved"
  | "paid"
  | "delivered";

interface SupplierProgress {
  supplier: string;
  status: SupplierStatus;
  sentDate?: string;
  quoteRef?: string;
  quoteAmount?: number;
  poRef?: string;
}

interface PRItem {
  material: string;
  qty: number;
  unit: string;
  estimatedUnitCost: number;
}

interface PurchaseRequest {
  id: string;
  materialRequestRef: string;
  project: string;
  raisedBy: string;
  procurementType: "direct" | "rfq";
  status: PRStatus;
  raisedDate: string;
  requiredDate: string;
  totalItems: number;
  estimatedValue: number;
  suppliers: SupplierProgress[];
  items: PRItem[];
}

// ── API mapper ────────────────────────────────────────────────────────────────
function fromApi(r: ApiPR): PurchaseRequest {
  const validStatuses: PRStatus[] = [
    "draft",
    "pending_approval",
    "approved",
    "sent_to_suppliers",
    "quotes_received",
    "po_created",
    "cancelled",
  ];
  const rawStatus = r.status?.toLowerCase().replace(/\s+/g, "_") ?? "draft";
  const status: PRStatus = validStatuses.includes(rawStatus as PRStatus)
    ? (rawStatus as PRStatus)
    : "draft";
  return {
    id: r.id,
    materialRequestRef: r.prRef ?? r.id,
    project: r.projectName ?? "Unknown Project",
    raisedBy: r.requestedBy ?? "Unknown",
    procurementType: "rfq",
    status,
    raisedDate: r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "",
    requiredDate: r.daysToDeliver
      ? new Date(Date.now() + r.daysToDeliver * 86400000).toLocaleDateString(
          "en-GB",
          { day: "2-digit", month: "short", year: "numeric" },
        )
      : "",
    totalItems: r.items?.length ?? 0,
    estimatedValue:
      r.items?.reduce(
        (sum, it) => sum + (it.qty ?? 0) * (it.unitPrice ?? 0),
        0,
      ) ?? 0,
    suppliers: [],
    items: (r.items ?? []).map((it) => ({
      material: it.description ?? "",
      qty: it.qty ?? 0,
      unit: it.unit ?? "Units",
      estimatedUnitCost: it.unitPrice ?? 0,
    })),
  };
}

// ── Dead seed data (replaced by API) ──────────────────────────────────────────
const _SEED_PRS_PLACEHOLDER: PurchaseRequest[] = [
  {
    id: "PR-0018",
    materialRequestRef: "MR-0038",
    project: "Industrial Warehouse",
    raisedBy: "Amaka Osei",
    procurementType: "rfq",
    status: "quotes_received",
    raisedDate: "Apr 8, 2026",
    requiredDate: "Apr 12, 2026",
    totalItems: 2,
    estimatedValue: 3480000,
    suppliers: [
      {
        supplier: "Alpha Aggregates",
        status: "quote_received",
        sentDate: "Apr 8, 2026",
        quoteRef: "QT-0020",
        quoteAmount: 3550000,
      },
      {
        supplier: "BetaCo Supplies",
        status: "quote_received",
        sentDate: "Apr 8, 2026",
        quoteRef: "QT-0021",
        quoteAmount: 3820000,
      },
      {
        supplier: "UniTrade Ltd",
        status: "request_sent",
        sentDate: "Apr 8, 2026",
      },
    ],
    items: [
      {
        material: "Sand (River)",
        qty: 60,
        unit: "Tonnes",
        estimatedUnitCost: 25000,
      },
      {
        material: "Granite 3/4 Inch",
        qty: 40,
        unit: "Tonnes",
        estimatedUnitCost: 35000,
      },
    ],
  },
  {
    id: "PR-0017",
    materialRequestRef: "MR-0036",
    project: "Downtown Office Complex",
    raisedBy: "Amaka Osei",
    procurementType: "direct",
    status: "po_created",
    raisedDate: "Apr 7, 2026",
    requiredDate: "Apr 10, 2026",
    totalItems: 2,
    estimatedValue: 8250000,
    suppliers: [
      {
        supplier: "SteelMart Int'l",
        status: "po_created",
        sentDate: "Apr 7, 2026",
        quoteRef: "QT-0019",
        quoteAmount: 8050000,
        poRef: "PO-0030",
      },
    ],
    items: [
      {
        material: "Steel Rebar Y16",
        qty: 15,
        unit: "Tonnes",
        estimatedUnitCost: 410000,
      },
      {
        material: "Steel Rebar Y12",
        qty: 5,
        unit: "Tonnes",
        estimatedUnitCost: 380000,
      },
    ],
  },
  {
    id: "PR-0016",
    materialRequestRef: "MR-0033",
    project: "Riverside Residential",
    raisedBy: "Amaka Osei",
    procurementType: "rfq",
    status: "pending_approval",
    raisedDate: "Apr 6, 2026",
    requiredDate: "Apr 13, 2026",
    totalItems: 3,
    estimatedValue: 2640000,
    suppliers: [
      { supplier: "ElectraHub", status: "not_sent" },
      { supplier: "PlumbTech Ltd", status: "not_sent" },
    ],
    items: [
      {
        material: "Electrical Conduit 25mm",
        qty: 1500,
        unit: "Metres",
        estimatedUnitCost: 1200,
      },
      {
        material: "2.5mm Twin Cable",
        qty: 500,
        unit: "Metres",
        estimatedUnitCost: 850,
      },
      {
        material: "Water Pipe 63mm HDPE",
        qty: 300,
        unit: "Metres",
        estimatedUnitCost: 2900,
      },
    ],
  },
  {
    id: "PR-0015",
    materialRequestRef: "MR-0031",
    project: "Highway Interchange",
    raisedBy: "Amaka Osei",
    procurementType: "rfq",
    status: "po_created",
    raisedDate: "Apr 5, 2026",
    requiredDate: "Apr 9, 2026",
    totalItems: 2,
    estimatedValue: 6720000,
    suppliers: [
      {
        supplier: "SteelMart Int'l",
        status: "paid",
        sentDate: "Apr 5, 2026",
        quoteRef: "QT-0018",
        quoteAmount: 5760000,
        poRef: "PO-0028",
      },
      {
        supplier: "Alpha Aggregates",
        status: "delivered",
        sentDate: "Apr 5, 2026",
        quoteRef: "QT-0017",
        quoteAmount: 6200000,
        poRef: "PO-0029",
      },
    ],
    items: [
      {
        material: "BRC Mesh A193",
        qty: 120,
        unit: "Sheets",
        estimatedUnitCost: 48000,
      },
      {
        material: "Cement (50kg bags)",
        qty: 240,
        unit: "Bags",
        estimatedUnitCost: 8500,
      },
    ],
  },
  {
    id: "PR-0014",
    materialRequestRef: "MR-0029",
    project: "Industrial Warehouse",
    raisedBy: "Amaka Osei",
    procurementType: "direct",
    status: "draft",
    raisedDate: "Apr 9, 2026",
    requiredDate: "Apr 18, 2026",
    totalItems: 1,
    estimatedValue: 580000,
    suppliers: [{ supplier: "BuildPlus Supplies", status: "not_sent" }],
    items: [
      {
        material: "Plywood Formwork 18mm",
        qty: 400,
        unit: "Sheets",
        estimatedUnitCost: 14500,
      },
    ],
  },
];
void _SEED_PRS_PLACEHOLDER;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `₦${(n / 1000).toFixed(0)}K`;
  return `₦${n}`;
}

const PR_STATUS_CFG: Record<PRStatus, { label: string; badge: string }> = {
  draft: { label: "Draft", badge: "bg-gray-100 text-gray-600" },
  pending_approval: {
    label: "Pending Approval",
    badge: "bg-amber-100 text-amber-700",
  },
  approved: { label: "Approved", badge: "bg-green-100 text-green-700" },
  sent_to_suppliers: {
    label: "Sent to Suppliers",
    badge: "bg-blue-100 text-blue-700",
  },
  quotes_received: {
    label: "Quotes Received",
    badge: "bg-purple-100 text-purple-700",
  },
  po_created: { label: "PO Created", badge: "bg-teal-100 text-teal-700" },
  cancelled: { label: "Cancelled", badge: "bg-red-100 text-red-700" },
};

const SUPPLIER_PIPELINE: {
  key: SupplierStatus;
  label: string;
  color: string;
}[] = [
  { key: "not_sent", label: "Not Sent", color: "bg-gray-100 text-gray-400" },
  { key: "request_sent", label: "Sent", color: "bg-blue-100 text-blue-600" },
  {
    key: "quote_received",
    label: "Quote Rcvd",
    color: "bg-purple-100 text-purple-700",
  },
  {
    key: "po_created",
    label: "PO Created",
    color: "bg-teal-100 text-teal-700",
  },
  { key: "approved", label: "Approved", color: "bg-green-100 text-green-700" },
  { key: "paid", label: "Paid", color: "bg-emerald-100 text-emerald-700" },
  { key: "delivered", label: "Delivered", color: "bg-gray-100 text-gray-500" },
];

const SUPPLIER_STEP: Record<SupplierStatus, number> = {
  not_sent: 0,
  request_sent: 1,
  quote_received: 2,
  po_created: 3,
  approved: 4,
  paid: 5,
  delivered: 6,
};

const TABS: { key: PRStatus | "all"; label: string }[] = [
  { key: "all", label: "All PRs" },
  { key: "draft", label: "Draft" },
  { key: "pending_approval", label: "Pending Approval" },
  { key: "approved", label: "Approved" },
  { key: "sent_to_suppliers", label: "Sent to Suppliers" },
  { key: "quotes_received", label: "Quotes Received" },
  { key: "po_created", label: "PO Created" },
];

const PR_FILTER_FIELDS: FilterFieldDef[] = [
  { key: "id", label: "PR Number", type: "text" },
  { key: "project", label: "Project", type: "text" },
  { key: "materialRequestRef", label: "MR Ref", type: "text" },
  {
    key: "procurementType",
    label: "Type",
    type: "select",
    options: ["direct", "rfq"],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      "draft",
      "pending_approval",
      "approved",
      "sent_to_suppliers",
      "quotes_received",
      "po_created",
      "cancelled",
    ],
  },
];

const PR_PROJECTS = [
  "Industrial Warehouse",
  "Downtown Office Complex",
  "Riverside Residential",
  "Highway Interchange",
  "University Science Block",
];
const PR_UNITS = [
  "Tonnes",
  "Bags",
  "Metres",
  "Sheets",
  "Rolls",
  "Units",
  "Cartons",
  "Litres",
];
const ALL_SUPPLIERS = [
  "Alpha Aggregates",
  "SteelMart Int'l",
  "CemCo Nigeria Ltd",
  "ElectraHub",
  "PlumbTech Ltd",
  "DangCem Enterprises",
  "BuildPlus Supplies",
  "BetaCo Supplies",
  "UniTrade Ltd",
];

// ── Supplier pipeline row ─────────────────────────────────────────────────────
function SupplierPipelineRow({
  sup,
  onAdvance,
}: {
  sup: SupplierProgress;
  onAdvance: (s: SupplierStatus) => void;
}) {
  const step = SUPPLIER_STEP[sup.status];
  const nextStage = SUPPLIER_PIPELINE[step + 1];
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-36 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-800 truncate">
          {sup.supplier}
        </p>
        {sup.quoteRef && (
          <p className="text-xs text-purple-600 mt-0.5">
            {sup.quoteRef} · {fmt(sup.quoteAmount ?? 0)}
          </p>
        )}
        {sup.poRef && (
          <p className="text-xs text-teal-600 mt-0.5 flex items-center gap-1">
            <LinkIcon className="w-3 h-3" />
            {sup.poRef}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 flex-1 overflow-x-auto pb-1">
        {SUPPLIER_PIPELINE.map((stage, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={stage.key}
              className="flex items-center gap-1 flex-shrink-0"
            >
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                  active
                    ? stage.color
                    : done
                      ? "bg-gray-50 text-gray-400"
                      : "text-gray-200"
                }`}
              >
                {done ? "✓ " : ""}
                {stage.label}
              </span>
              {i < SUPPLIER_PIPELINE.length - 1 && (
                <ArrowRight className="w-3 h-3 text-gray-200 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {nextStage && sup.status !== "not_sent" && (
        <button
          onClick={() => onAdvance(nextStage.key)}
          className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-1 flex-shrink-0 whitespace-nowrap"
        >
          → {nextStage.label}
        </button>
      )}
    </div>
  );
}

// ── New PR modal ──────────────────────────────────────────────────────────────
interface NewPRItemForm {
  material: string;
  qty: string;
  unit: string;
  estimatedUnitCost: string;
}

function NewPRModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (pr: PurchaseRequest) => void;
}) {
  const today = new Date();
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const addDays = (n: number) => {
    const d2 = new Date(today);
    d2.setDate(d2.getDate() + n);
    return fmtDate(d2);
  };

  const [project, setProject] = useState(PR_PROJECTS[0]);
  const [mrRef, setMrRef] = useState("MR-0041");
  const [procType, setProcType] = useState<"direct" | "rfq">("direct");
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([
    ALL_SUPPLIERS[0],
  ]);
  const [daysToDeliver, setDaysToDeliver] = useState("7");
  const [items, setItems] = useState<NewPRItemForm[]>([
    { material: "", qty: "", unit: PR_UNITS[0], estimatedUnitCost: "" },
  ]);

  function toggleSupplier(s: string) {
    if (procType === "direct") {
      setSelectedSuppliers([s]);
    } else {
      setSelectedSuppliers((prev) =>
        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
      );
    }
  }

  const valid =
    project &&
    mrRef.trim() &&
    items.every((it) => it.material.trim() && it.qty.trim());

  function save() {
    if (!valid || !selectedSuppliers.length) return;
    const id = `PR-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const total = items.reduce(
      (s, it) =>
        s + parseFloat(it.qty) * parseFloat(it.estimatedUnitCost || "0"),
      0,
    );
    onSave({
      id,
      materialRequestRef: mrRef,
      project,
      raisedBy: "Amaka Osei",
      procurementType: procType,
      status: "draft",
      raisedDate: fmtDate(today),
      requiredDate: addDays(parseInt(daysToDeliver) || 7),
      totalItems: items.length,
      estimatedValue: total,
      suppliers: selectedSuppliers.map((s) => ({
        supplier: s,
        status: "not_sent" as SupplierStatus,
      })),
      items: items.map((it) => ({
        material: it.material,
        qty: parseFloat(it.qty) || 0,
        unit: it.unit,
        estimatedUnitCost: parseFloat(it.estimatedUnitCost) || 0,
      })),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">
            New Purchase Request
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PR_PROJECTS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                MR Reference
              </label>
              <input
                value={mrRef}
                onChange={(e) => setMrRef(e.target.value)}
                placeholder="e.g. MR-0041"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Required in (days)
              </label>
              <input
                type="number"
                min={1}
                value={daysToDeliver}
                onChange={(e) => setDaysToDeliver(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Required by: {addDays(parseInt(daysToDeliver) || 7)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Procurement Type
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["direct", "rfq"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setProcType(t);
                    if (t === "direct")
                      setSelectedSuppliers([
                        selectedSuppliers[0] ?? ALL_SUPPLIERS[0],
                      ]);
                  }}
                  className={`p-3 rounded-xl border text-left ${procType === t ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <p
                    className={`text-sm font-semibold ${procType === t ? "text-blue-700" : "text-gray-700"}`}
                  >
                    {t === "direct"
                      ? "Direct Procurement"
                      : "Request for Quote (RFQ)"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t === "direct"
                      ? "Single supplier chosen directly"
                      : "Multiple suppliers invited to quote"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {procType === "direct"
                ? "Select Supplier"
                : "Select Suppliers for RFQ"}
            </p>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
              {ALL_SUPPLIERS.map((s) => {
                const sel = selectedSuppliers.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSupplier(s)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 ${sel ? "bg-blue-50" : ""}`}
                  >
                    <span
                      className={
                        sel ? "text-blue-700 font-medium" : "text-gray-700"
                      }
                    >
                      {s}
                    </span>
                    {sel && <CheckCircle className="w-4 h-4 text-blue-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Line Items <span className="text-red-500">*</span>
              </p>
              <button
                onClick={() =>
                  setItems((p) => [
                    ...p,
                    {
                      material: "",
                      qty: "",
                      unit: PR_UNITS[0],
                      estimatedUnitCost: "",
                    },
                  ])
                }
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_60px_80px_90px_28px] gap-1.5 items-center"
                >
                  <input
                    value={it.material}
                    onChange={(e) =>
                      setItems((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, material: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Material"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={it.qty}
                    onChange={(e) =>
                      setItems((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, qty: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Qty"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={it.unit}
                    onChange={(e) =>
                      setItems((p) =>
                        p.map((x, j) =>
                          j === i ? { ...x, unit: e.target.value } : x,
                        ),
                      )
                    }
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PR_UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={it.estimatedUnitCost}
                    onChange={(e) =>
                      setItems((p) =>
                        p.map((x, j) =>
                          j === i
                            ? { ...x, estimatedUnitCost: e.target.value }
                            : x,
                        ),
                      )
                    }
                    placeholder="Unit ₦"
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() =>
                        setItems((p) => p.filter((_, j) => j !== i))
                      }
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!valid || !selectedSuppliers.length}
            className="px-4 py-2 text-sm bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create PR
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Send to Suppliers modal ───────────────────────────────────────────────────
function SendToSuppliersModal({
  pr,
  onClose,
  onSend,
}: {
  pr: PurchaseRequest;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Send to Suppliers
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm">
            <p className="font-medium text-blue-800">
              {pr.id} · {pr.project}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              {pr.procurementType === "rfq"
                ? "Request for Quote"
                : "Direct Procurement"}{" "}
              · {pr.suppliers.length} supplier
              {pr.suppliers.length > 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Will be sent to:
            </p>
            <div className="space-y-1">
              {pr.suppliers.map((s) => (
                <div
                  key={s.supplier}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm"
                >
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-700">{s.supplier}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {pr.procurementType === "rfq"
              ? "Each supplier will receive the material requirements and be asked to submit a quote."
              : "The selected supplier will receive the purchase request directly."}
          </p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSend();
              onClose();
            }}
            className="px-4 py-2 text-sm bg-blue-700 text-white rounded-xl hover:bg-blue-800 flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Confirm & Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function PurchaseRequestsPage() {
  const [prList, setPrList] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPurchaseRequests()
      .then((data) => setPrList(data.map(fromApi)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  const [activeTab, setActiveTab] = useState<PRStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNewPR, setShowNewPR] = useState(false);
  const [sendFor, setSendFor] = useState<PurchaseRequest | null>(null);
  const [advFilters, setAdvFilters] = useState<ActiveFilters>({});
  const [advSort, setAdvSort] = useState<SortConfig>(null);

  const filtered = applyFiltersAndSort(
    prList.filter((pr) => {
      const matchTab = activeTab === "all" || pr.status === activeTab;
      const matchSearch =
        pr.id.toLowerCase().includes(search.toLowerCase()) ||
        pr.project.toLowerCase().includes(search.toLowerCase()) ||
        pr.materialRequestRef.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    }),
    advFilters,
    advSort,
  );

  function approvePR(id: string) {
    setPrList((prev) =>
      prev.map((pr) =>
        pr.id === id ? { ...pr, status: "approved" as PRStatus } : pr,
      ),
    );
  }

  function sendToSuppliers(id: string) {
    const now = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    setPrList((prev) =>
      prev.map((pr) =>
        pr.id !== id
          ? pr
          : {
              ...pr,
              status: "sent_to_suppliers" as PRStatus,
              suppliers: pr.suppliers.map((s) => ({
                ...s,
                status: "request_sent" as SupplierStatus,
                sentDate: now,
              })),
            },
      ),
    );
  }

  function advanceSupplier(
    prId: string,
    supplierName: string,
    newStatus: SupplierStatus,
  ) {
    setPrList((prev) =>
      prev.map((pr) => {
        if (pr.id !== prId) return pr;
        const sups = pr.suppliers.map((s) =>
          s.supplier === supplierName ? { ...s, status: newStatus } : s,
        );
        const statuses = sups.map((s) => s.status);
        let prStatus = pr.status;
        if (statuses.some((s) => s === "quote_received"))
          prStatus = "quotes_received";
        if (statuses.some((s) => s === "po_created")) prStatus = "po_created";
        return { ...pr, suppliers: sups, status: prStatus };
      }),
    );
  }

  if (loading)
    return (
      <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Purchase Requests
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Multi-supplier sourcing — track each vendor independently from
            request to delivery
          </p>
        </div>
        <button
          onClick={() => setShowNewPR(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-md text-sm hover:bg-blue-800"
        >
          <Plus className="w-3.5 h-3.5" /> New PR
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? prList.length
              : prList.filter((pr) => pr.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PR, MR ref, project…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <AdvancedFilter
          fields={PR_FILTER_FIELDS}
          filters={advFilters}
          onFiltersChange={setAdvFilters}
          sort={advSort}
          onSortChange={setAdvSort}
        />
        <span className="text-xs text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((pr) => {
          const statusCfg = PR_STATUS_CFG[pr.status];
          const isExpanded = expanded === pr.id;
          const bestQuote = pr.suppliers.reduce<SupplierProgress | null>(
            (best, s) => {
              if (!s.quoteAmount) return best;
              return !best || s.quoteAmount < (best.quoteAmount ?? Infinity)
                ? s
                : best;
            },
            null,
          );

          return (
            <div
              key={pr.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(isExpanded ? null : pr.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {pr.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.badge}`}
                    >
                      {statusCfg.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${pr.procurementType === "rfq" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {pr.procurementType === "rfq" ? "RFQ" : "Direct"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{pr.project}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Linked:{" "}
                    <span className="font-mono text-gray-500">
                      {pr.materialRequestRef}
                    </span>
                    {" · "}
                    {pr.totalItems} item{pr.totalItems > 1 ? "s" : ""}
                    {" · "}
                    <Users className="w-3 h-3 inline-block align-middle" />{" "}
                    {pr.suppliers.length} supplier
                    {pr.suppliers.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 min-w-[170px]">
                  <p className="text-sm font-semibold text-gray-900">
                    Est. {fmt(pr.estimatedValue)}
                  </p>
                  {bestQuote?.quoteAmount && (
                    <p className="text-xs text-purple-600 mt-0.5">
                      Best: {fmt(bestQuote.quoteAmount)} ({bestQuote.supplier})
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Required by: {pr.requiredDate}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-5">
                  {/* Traceability bar */}
                  <div className="flex items-center gap-2 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <LinkIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500">Material Request:</span>
                    <span className="font-semibold text-blue-600">
                      {pr.materialRequestRef}
                    </span>
                    <span className="text-gray-300 mx-1">|</span>
                    <span className="text-gray-500">
                      Raised by {pr.raisedBy} · {pr.raisedDate}
                    </span>
                  </div>

                  {/* Items table */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Line Items
                    </p>
                    <table className="w-full text-sm bg-white rounded-lg border border-gray-200">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">
                            Material
                          </th>
                          <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">
                            Qty
                          </th>
                          <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">
                            Est. Unit
                          </th>
                          <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">
                            Est. Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {pr.items.map((it, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium text-gray-900">
                              {it.material}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              {it.qty.toLocaleString()} {it.unit}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              {fmt(it.estimatedUnitCost)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-900">
                              {fmt(it.qty * it.estimatedUnitCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Supplier pipeline */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Supplier Tracking
                      {bestQuote?.quoteAmount && (
                        <span className="ml-2 text-green-600 normal-case font-normal">
                          — Lowest quote: {bestQuote.supplier} at{" "}
                          {fmt(bestQuote.quoteAmount)}
                        </span>
                      )}
                    </p>
                    <div className="bg-white border border-gray-200 rounded-xl px-4">
                      {pr.suppliers.map((sup) => (
                        <SupplierPipelineRow
                          key={sup.supplier}
                          sup={sup}
                          onAdvance={(newStatus) =>
                            advanceSupplier(pr.id, sup.supplier, newStatus)
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    {pr.status === "pending_approval" && (
                      <>
                        <button className="px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-50">
                          Reject
                        </button>
                        <button
                          onClick={() => approvePR(pr.id)}
                          className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                      </>
                    )}
                    {pr.status === "approved" && (
                      <button
                        onClick={() => setSendFor(pr)}
                        className="px-3 py-2 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Send to Suppliers
                      </button>
                    )}
                    {(pr.status === "quotes_received" ||
                      pr.status === "sent_to_suppliers") && (
                      <button className="px-3 py-2 text-sm bg-purple-700 text-white rounded-lg hover:bg-purple-800 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> Create PO from
                        Quote
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No purchase requests found</p>
          </div>
        )}
      </div>

      {showNewPR && (
        <NewPRModal
          onClose={() => setShowNewPR(false)}
          onSave={(pr) => {
            setPrList((prev) => [pr, ...prev]);
            setShowNewPR(false);
          }}
        />
      )}

      {sendFor && (
        <SendToSuppliersModal
          pr={sendFor}
          onClose={() => setSendFor(null)}
          onSend={() => sendToSuppliers(sendFor.id)}
        />
      )}
    </div>
  );
}
