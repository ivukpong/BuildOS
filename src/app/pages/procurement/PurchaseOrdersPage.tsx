import { useState, useEffect } from "react";
import { fetchPurchaseOrders } from "../../api/purchase-orders";
import { getReferenceData } from "../../api/reference-data";
import {
  ShoppingCart,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Download,
  Package,
  X,
  Trash2,
  CreditCard,
  Building2,
  LinkIcon,
} from "lucide-react";

type POStatus =
  | "draft"
  | "sent"
  | "confirmed"
  | "partially_received"
  | "completed"
  | "cancelled";
type PaymentStatus = "unpaid" | "confirmation_requested" | "paid";

interface PurchaseOrder {
  id: string;
  prRef: string;
  mrRef: string;
  supplier: string;
  supplierContact: string;
  status: POStatus;
  paymentStatus: PaymentStatus;
  sentToFinance: boolean;
  financeRef?: string;
  createdBy: string;
  createdDate: string;
  expectedDate: string;
  totalItems: number;
  totalValue: number;
  receivedValue: number;
  items: {
    material: string;
    qty: number;
    unit: string;
    unitCost: number;
    received: number;
  }[];
}

const PAYMENT_STATUS_CFG: Record<
  PaymentStatus,
  { label: string; badge: string }
> = {
  unpaid: { label: "Unpaid", badge: "bg-gray-100 text-gray-500" },
  confirmation_requested: {
    label: "Payment Requested",
    badge: "bg-amber-100 text-amber-700",
  },
  paid: { label: "Paid", badge: "bg-green-100 text-green-700" },
};

const statusConfig: Record<
  POStatus,
  { label: string; badge: string; icon: React.ReactNode; step: number }
> = {
  draft: {
    label: "Draft",
    badge: "bg-gray-100 text-gray-600",
    icon: <FileText className="w-3.5 h-3.5" />,
    step: 1,
  },
  sent: {
    label: "Sent to Supplier",
    badge: "bg-blue-100 text-blue-700",
    icon: <Send className="w-3.5 h-3.5" />,
    step: 2,
  },
  confirmed: {
    label: "Confirmed",
    badge: "bg-green-100 text-green-700",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    step: 3,
  },
  partially_received: {
    label: "Partially Received",
    badge: "bg-amber-100 text-amber-700",
    icon: <Truck className="w-3.5 h-3.5" />,
    step: 4,
  },
  completed: {
    label: "Completed",
    badge: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    step: 5,
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-red-100 text-red-700",
    icon: <XCircle className="w-3.5 h-3.5" />,
    step: 0,
  },
};

const tabs: { key: POStatus | "all"; label: string }[] = [
  { key: "all", label: "All POs" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "confirmed", label: "Confirmed" },
  { key: "partially_received", label: "Partial Receipt" },
  { key: "completed", label: "Completed" },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `₦${(n / 1000).toFixed(0)}K`;
  return `₦${n}`;
}

const PO_UNITS = [
  "Tonnes",
  "Bags",
  "Metres",
  "Sheets",
  "Rolls",
  "Units",
  "Cartons",
  "Litres",
];

interface POItem {
  material: string;
  qty: string;
  unit: string;
  unitCost: string;
}

function NewPOModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (po: PurchaseOrder) => void;
}) {
  const today = new Date();
  const fmtDate = (d: Date) =>
    d
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, " ");
  const addDays = (n: number) => {
    const d2 = new Date(today);
    d2.setDate(d2.getDate() + n);
    return fmtDate(d2);
  };

  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [supplier, setSupplier] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [prRef, setPrRef] = useState("");
  const [project, setProject] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [items, setItems] = useState<POItem[]>([
    { material: "", qty: "", unit: PO_UNITS[0], unitCost: "" },
  ]);

  useEffect(() => {
    getReferenceData()
      .then((data) => {
        const supplierNames = data.suppliers.map((s) => s.name);
        const projectNames = data.projects.map((p) => p.name);
        setSuppliers(supplierNames);
        setProjects(projectNames);
        setSupplier((prev) => prev || supplierNames[0] || "");
        setProject((prev) => prev || projectNames[0] || "");
      })
      .catch(() => {});
  }, []);

  const addItem = () =>
    setItems((p) => [
      ...p,
      { material: "", qty: "", unit: PO_UNITS[0], unitCost: "" },
    ]);
  const removeItem = (i: number) =>
    setItems((p) => p.filter((_, j) => j !== i));
  const updateItem = (i: number, k: keyof POItem, v: string) =>
    setItems((p) => p.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const totalValue = items.reduce(
    (s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.unitCost) || 0),
    0,
  );
  const valid =
    supplier &&
    items.every(
      (it) => it.material.trim() && it.qty.trim() && it.unitCost.trim(),
    );

  function handleSave() {
    if (!valid) return;
    const nextId = `PO-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    onSave({
      id: nextId,
      prRef: prRef.trim() || "—",
      mrRef: "—",
      supplier,
      supplierContact: supplierContact.trim() || supplier,
      status: "draft",
      paymentStatus: "unpaid",
      sentToFinance: false,
      createdBy: "Amaka Osei",
      createdDate: fmtDate(today),
      expectedDate: addDays(parseInt(deliveryDays) || 7),
      totalItems: items.length,
      totalValue,
      receivedValue: 0,
      items: items.map((it) => ({
        material: it.material,
        qty: parseFloat(it.qty) || 0,
        unit: it.unit,
        unitCost: parseFloat(it.unitCost) || 0,
        received: 0,
      })),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">
            New Purchase Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {suppliers.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Supplier Contact
              </label>
              <input
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                placeholder="Name — +234 …"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                PR Reference
              </label>
              <input
                value={prRef}
                onChange={(e) => setPrRef(e.target.value)}
                placeholder="PR-0019"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Project
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Expected Delivery (days)
              </label>
              <input
                type="number"
                min={1}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Expected: {addDays(parseInt(deliveryDays) || 7)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">
                Line Items <span className="text-red-500">*</span>
              </label>
              <button
                onClick={addItem}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Line
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_70px_90px_90px_32px] gap-1.5 items-center"
                >
                  <input
                    value={item.material}
                    onChange={(e) => updateItem(i, "material", e.target.value)}
                    placeholder="Material"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateItem(i, "qty", e.target.value)}
                    placeholder="Qty"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(i, "unit", e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PO_UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.unitCost}
                    onChange={(e) => updateItem(i, "unitCost", e.target.value)}
                    placeholder="Unit ₦"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(i)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {totalValue > 0 && (
              <div className="flex justify-end mt-2">
                <span className="text-sm font-semibold text-gray-800">
                  Total: {fmt(totalValue)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!valid}
            className="px-4 py-2 text-sm bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" /> Create Draft PO
          </button>
        </div>
      </div>
    </div>
  );
}

function SendToSupplierModal({
  po,
  onClose,
  onDone,
}: {
  po: PurchaseOrder;
  onClose: () => void;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    `Dear ${po.supplier},\n\nPlease find attached Purchase Order ${po.id}. Kindly confirm receipt and expected delivery by ${po.expectedDate}.\n\nRegards,\nProcurement Team`,
  );
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Send PO to Supplier
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
            <span className="font-medium text-blue-800">{po.id}</span> →{" "}
            <span className="text-blue-700">{po.supplier}</span> ·{" "}
            {fmt(po.totalValue)}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Supplier Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="procurement@supplier.ng"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onDone}
            disabled={!email.trim()}
            className="px-4 py-2 text-sm bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Send PO
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordReceiptModal({
  po,
  onClose,
  onDone,
}: {
  po: PurchaseOrder;
  onClose: () => void;
  onDone: (received: number[]) => void;
}) {
  const [received, setReceived] = useState<string[]>(po.items.map(() => ""));
  const [warehouse, setWarehouse] = useState("Main Store");
  const [deliveryNote, setDeliveryNote] = useState("");
  const valid = received.every((v) => v.trim() !== "") && deliveryNote.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">
            Record Delivery — {po.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Warehouse / Location
              </label>
              <input
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Delivery Note No. <span className="text-red-500">*</span>
              </label>
              <input
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="DN-XXXX-0000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">
              Quantities Received
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-200">
                  <th className="text-left px-3 py-2">Material</th>
                  <th className="text-right px-3 py-2">Ordered</th>
                  <th className="text-right px-3 py-2">Already Rcvd</th>
                  <th className="px-3 py-2">Qty Received Now</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {po.items.map((item, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-3 py-2 font-medium text-gray-800">
                      {item.material}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {item.qty} {item.unit}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500">
                      {item.received} {item.unit}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={item.qty - item.received}
                        value={received[i]}
                        onChange={(e) =>
                          setReceived((p) =>
                            p.map((v, j) => (j === i ? e.target.value : v)),
                          )
                        }
                        placeholder={`Max ${item.qty - item.received}`}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              valid && onDone(received.map((v) => parseFloat(v) || 0))
            }
            disabled={!valid}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Truck className="w-4 h-4" /> Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

export function PurchaseOrdersPage() {
  const [poList, setPoList] = useState<PurchaseOrder[]>([]);
  useEffect(() => {
    fetchPurchaseOrders().then(setPoList);
  }, []);
  const [activeTab, setActiveTab] = useState<POStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNewPO, setShowNewPO] = useState(false);
  const [sendPO, setSendPO] = useState<PurchaseOrder | null>(null);
  const [receiptPO, setReceiptPO] = useState<PurchaseOrder | null>(null);

  function sendToFinance(id: string) {
    const ref = `FIN-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setPoList((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, sentToFinance: true, financeRef: ref } : p,
      ),
    );
  }

  function requestPaymentConfirmation(id: string) {
    setPoList((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, paymentStatus: "confirmation_requested" as PaymentStatus }
          : p,
      ),
    );
  }

  const filtered = poList.filter((po) => {
    const matchTab = activeTab === "all" || po.status === activeTab;
    const matchSearch =
      po.id.toLowerCase().includes(search.toLowerCase()) ||
      po.supplier.toLowerCase().includes(search.toLowerCase()) ||
      po.prRef.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalValue = poList
    .filter((po) => po.status !== "cancelled")
    .reduce((a, po) => a + po.totalValue, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Purchase Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage PO lifecycle from draft to completed delivery
          </p>
        </div>
        <button
          onClick={() => setShowNewPO(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-md text-sm hover:bg-blue-800"
        >
          <Plus className="w-3.5 h-3.5" /> New Purchase Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total POs",
            value: poList.length,
            sub: "All time",
            color: "bg-gray-50 border-gray-200 text-gray-900",
          },
          {
            label: "Open POs",
            value: poList.filter((p) =>
              ["sent", "confirmed", "partially_received"].includes(p.status),
            ).length,
            sub: "Awaiting delivery",
            color: "bg-blue-50 border-blue-200 text-blue-700",
          },
          {
            label: "Total Open Value",
            value: fmt(totalValue),
            sub: "Outstanding",
            color: "bg-amber-50 border-amber-200 text-amber-700",
          },
          {
            label: "Completed",
            value: poList.filter((p) => p.status === "completed").length,
            sub: "This month",
            color: "bg-green-50 border-green-200 text-green-700",
          },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-lg border ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm mt-0.5 opacity-80">{s.label}</p>
            <p className="text-xs mt-0.5 opacity-60">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const count =
            tab.key === "all"
              ? poList.length
              : poList.filter((po) => po.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-blue-700 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {tab.label}{" "}
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search POs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((po) => {
          const cfg = statusConfig[po.status];
          const isExpanded = expanded === po.id;
          const receivedPct =
            po.totalValue > 0
              ? Math.round((po.receivedValue / po.totalValue) * 100)
              : 0;
          return (
            <div
              key={po.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(isExpanded ? null : po.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {po.id}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      PR: {po.prRef}
                    </span>
                    {po.mrRef && po.mrRef !== "—" && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        MR: {po.mrRef}
                      </span>
                    )}
                    <span
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${cfg.badge}`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_STATUS_CFG[po.paymentStatus].badge}`}
                    >
                      {PAYMENT_STATUS_CFG[po.paymentStatus].label}
                    </span>
                    {po.sentToFinance && (
                      <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        Finance: {po.financeRef}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 font-medium mt-1">
                    {po.supplier}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {po.supplierContact} · {po.totalItems} line item
                    {po.totalItems > 1 ? "s" : ""}
                  </p>
                </div>
                {po.status === "partially_received" && (
                  <div className="w-32 flex-shrink-0">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Received</span>
                      <span>{receivedPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-amber-400 h-2 rounded-full"
                        style={{ width: `${receivedPct}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-gray-900">
                    {fmt(po.totalValue)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Expected: {po.expectedDate}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  <div className="grid grid-cols-3 gap-6 mb-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Supplier</p>
                      <p className="font-medium text-gray-900">{po.supplier}</p>
                      <p className="text-xs text-gray-400">
                        {po.supplierContact}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Created by</p>
                      <p className="font-medium text-gray-900">
                        {po.createdBy}
                      </p>
                      <p className="text-xs text-gray-400">{po.createdDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        Expected Delivery
                      </p>
                      <p className="font-medium text-gray-900">
                        {po.expectedDate}
                      </p>
                    </div>
                  </div>
                  <table className="w-full text-sm bg-white rounded-md border border-gray-200 mb-4">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left">
                        <th className="px-3 py-2 text-xs font-medium text-gray-500">
                          Material
                        </th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">
                          Ordered
                        </th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">
                          Received
                        </th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">
                          Unit Cost
                        </th>
                        <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">
                          Line Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {po.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {item.material}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {item.qty.toLocaleString()} {item.unit}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span
                              className={
                                item.received >= item.qty
                                  ? "text-green-700 font-medium"
                                  : item.received > 0
                                    ? "text-amber-600 font-medium"
                                    : "text-gray-400"
                              }
                            >
                              {item.received.toLocaleString()} {item.unit}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-600">
                            {fmt(item.unitCost)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-900">
                            {fmt(item.qty * item.unitCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-2 text-sm font-medium text-gray-700 text-right"
                        >
                          Total
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900">
                          {fmt(po.totalValue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="flex justify-end gap-2 flex-wrap">
                    <button className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </button>
                    {po.status === "draft" && (
                      <button
                        onClick={() => setSendPO(po)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-700 text-white rounded-md hover:bg-blue-800"
                      >
                        <Send className="w-3.5 h-3.5" /> Send to Supplier
                      </button>
                    )}
                    {["confirmed", "partially_received", "completed"].includes(
                      po.status,
                    ) &&
                      !po.sentToFinance && (
                        <button
                          onClick={() => sendToFinance(po.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          <Building2 className="w-3.5 h-3.5" /> Send to Finance
                        </button>
                      )}
                    {po.status === "confirmed" &&
                      po.paymentStatus === "unpaid" && (
                        <button
                          onClick={() => requestPaymentConfirmation(po.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Request Payment
                          Confirmation
                        </button>
                      )}
                    {po.status === "confirmed" &&
                      po.paymentStatus === "confirmation_requested" && (
                        <span className="flex items-center gap-1.5 px-4 py-2 text-sm bg-amber-50 border border-amber-200 text-amber-700 rounded-md">
                          <Clock className="w-3.5 h-3.5" /> Payment Confirmation
                          Pending
                        </span>
                      )}
                    {po.status === "partially_received" && (
                      <button
                        onClick={() => setReceiptPO(po)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-amber-500 text-white rounded-md hover:bg-amber-600"
                      >
                        <Truck className="w-3.5 h-3.5" /> Record More Deliveries
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showNewPO && (
        <NewPOModal
          onClose={() => setShowNewPO(false)}
          onSave={(po) => {
            setPoList((prev) => [po, ...prev]);
            setShowNewPO(false);
          }}
        />
      )}
      {sendPO && (
        <SendToSupplierModal
          po={sendPO}
          onClose={() => setSendPO(null)}
          onDone={() => {
            setPoList((prev) =>
              prev.map((p) =>
                p.id === sendPO.id ? { ...p, status: "sent" as const } : p,
              ),
            );
            setSendPO(null);
          }}
        />
      )}
      {receiptPO && (
        <RecordReceiptModal
          po={receiptPO}
          onClose={() => setReceiptPO(null)}
          onDone={(received) => {
            setPoList((prev) =>
              prev.map((p) => {
                if (p.id !== receiptPO.id) return p;
                const newItems = p.items.map((it, i) => ({
                  ...it,
                  received: it.received + (received[i] || 0),
                }));
                const newReceivedValue = newItems.reduce(
                  (s, it) => s + it.received * it.unitCost,
                  0,
                );
                const allReceived = newItems.every(
                  (it) => it.received >= it.qty,
                );
                return {
                  ...p,
                  items: newItems,
                  receivedValue: newReceivedValue,
                  status: (allReceived
                    ? "completed"
                    : "partially_received") as typeof p.status,
                };
              }),
            );
            setReceiptPO(null);
          }}
        />
      )}
    </div>
  );
}
