import { useState, useEffect } from "react";
import { getBankAccounts, getTaxConfigs } from "../../api/finance-extras";
import { apiFetch } from "../../api/client";
import {
  Save,
  Plus,
  Edit,
  Trash2,
  Settings2,
  Info,
  CreditCard,
  Building2,
  X,
  CheckCircle,
  Percent,
} from "lucide-react";

interface BankAccount {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  currency: string;
  balance: number;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
}

type TaxType = "VAT" | "WHT" | "PAYE" | "Custom";

interface TaxEntry {
  id: string;
  name: string;
  type: TaxType;
  rate: number;
  glCode: string;
  appliesTo: string;
  enabled: boolean;
}

const CURRENCIES = ["USD", "NGN", "GBP", "EUR", "GHS", "ZAR"];
const FISCAL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function FinanceConfigPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [saved, setSaved] = useState(false);

  // General settings state
  const [currency, setCurrency] = useState("USD");
  const [fiscalYearStart, setFiscalYearStart] = useState("January");
  const [approvalThreshold, setApprovalThreshold] = useState("100000");

  // Bank account modal
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    name: "",
    bank: "",
    accountNumber: "",
    currency: "USD",
    balance: "",
  });

  useEffect(() => {
    getBankAccounts()
      .then((data) =>
        setBankAccounts(
          data.map((a) => ({
            id: a.id,
            name: a.accountName,
            bank: a.bankName,
            accountNumber: a.accountNumber,
            currency: a.currency,
            balance: a.balance ?? 0,
            isDefault: a.isDefault ?? false,
          })),
        ),
      )
      .catch(console.error);
    getTaxConfigs()
      .then((data) =>
        setTaxEntries(
          data.map((t) => ({
            id: t.id,
            name: t.name,
            type: (t.type as TaxType) ?? "Custom",
            rate: t.rate,
            glCode: t.code ?? "",
            appliesTo: t.description ?? "",
            enabled: t.isActive ?? true,
          })),
        ),
      )
      .catch(console.error);
  }, []);

  // Tax state
  const [taxEntries, setTaxEntries] = useState<TaxEntry[]>([]);
  const [companyTIN, setCompanyTIN] = useState("12345678-0001");
  const [vatRegNumber, setVatRegNumber] = useState("VAT-NG-00987654");
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxEditId, setTaxEditId] = useState<string | null>(null);
  const [taxForm, setTaxForm] = useState<{
    name: string;
    type: TaxType;
    rate: string;
    glCode: string;
    appliesTo: string;
  }>({
    name: "",
    type: "VAT",
    rate: "",
    glCode: "",
    appliesTo: "",
  });

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  function saveAll() {
    apiFetch("/finance-extras/config", {
      method: "POST",
      body: JSON.stringify({
        currency,
        fiscalYearStart,
        approvalThreshold: parseFloat(approvalThreshold),
      }),
    }).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
    apiFetch("/finance-extras/bank-accounts", {
      method: "POST",
      body: JSON.stringify({
        accountName: bankForm.name,
        bankName: bankForm.bank,
        accountNumber: bankForm.accountNumber,
        currency: bankForm.currency,
        balance: parseFloat(bankForm.balance || "0"),
        isDefault: bankAccounts.length === 0,
      }),
    })
      .then(() => {
        const acc: BankAccount = {
          id: `b${Date.now()}`,
          name: bankForm.name,
          bank: bankForm.bank,
          accountNumber: bankForm.accountNumber,
          currency: bankForm.currency,
          balance: parseFloat(bankForm.balance || "0"),
          isDefault: bankAccounts.length === 0,
        };
        setBankAccounts([...bankAccounts, acc]);
        setShowBankModal(false);
        setBankForm({
          name: "",
          bank: "",
          accountNumber: "",
          currency: "USD",
          balance: "",
        });
      })
      .catch((err) => {
        alert("Failed to add bank account. Please try again.");
        console.error(err);
      });
  }

  function setDefault(id: string) {
    setBankAccounts((prev) =>
      prev.map((b) => ({ ...b, isDefault: b.id === id })),
    );
  }

  function toggleMethod(id: string) {
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    );
  }

  function addBankAccount() {
    if (
      !bankForm.name.trim() ||
      !bankForm.bank.trim() ||
      !bankForm.accountNumber.trim()
    ) {
      return;
    }
    const acc: BankAccount = {
      id: `b${Date.now()}`,
      name: bankForm.name,
      bank: bankForm.bank,
      accountNumber: bankForm.accountNumber,
      currency: bankForm.currency,
      balance: parseFloat(bankForm.balance || "0"),
      isDefault: bankAccounts.length === 0,
    };
    setBankAccounts((prev) => [...prev, acc]);
    setShowBankModal(false);
    setBankForm({
      name: "",
      bank: "",
      accountNumber: "",
      currency: "USD",
      balance: "",
    });
  }

  function toggleTax(id: string) {
    setTaxEntries((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)),
    );
  }

  function openTaxEdit(t: TaxEntry) {
    setTaxForm({
      name: t.name,
      type: t.type,
      rate: String(t.rate),
      glCode: t.glCode,
      appliesTo: t.appliesTo,
    });
    setTaxEditId(t.id);
    setShowTaxModal(true);
  }

  function openTaxCreate() {
    setTaxForm({ name: "", type: "VAT", rate: "", glCode: "", appliesTo: "" });
    setTaxEditId(null);
    setShowTaxModal(true);
  }

  function saveTax() {
    if (!taxForm.name.trim()) return;
    const entry = {
      ...taxForm,
      rate: parseFloat(taxForm.rate || "0"),
      enabled: true,
    };
    if (taxEditId) {
      apiFetch(`/finance-extras/tax-configs/${taxEditId}`, {
        method: "PATCH",
        body: JSON.stringify(entry),
      })
        .then(() => {
          setTaxEntries((prev) =>
            prev.map((t) => (t.id === taxEditId ? { ...t, ...entry } : t)),
          );
          setShowTaxModal(false);
        })
        .catch((err) => {
          alert("Failed to update tax config. Please try again.");
          console.error(err);
        });
    } else {
      apiFetch("/finance-extras/tax-configs", {
        method: "POST",
        body: JSON.stringify(entry),
      })
        .then(() => {
          setTaxEntries((prev) => [
            ...prev,
            { id: `t${Date.now()}`, ...entry },
          ]);
          setShowTaxModal(false);
        })
        .catch((err) => {
          alert("Failed to create tax config. Please try again.");
          console.error(err);
        });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Finance Configuration
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure financial settings, bank accounts, payment methods, and
            tax rules
          </p>
        </div>
        <button
          onClick={saveAll}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${saved ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4" /> Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save All
            </>
          )}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <Info className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800">
          These settings control the core behaviour of the Finance module.
          Changes affect all financial workflows, approvals, and reporting.
        </p>
      </div>

      {/* General Setup */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">General Setup</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Default Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Financial Year Start
            </label>
            <select
              value={fiscalYearStart}
              onChange={(e) => setFiscalYearStart(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {FISCAL_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Approval Threshold (USD)
            </label>
            <input
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(e.target.value)}
              placeholder="e.g. 100000"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Expenses above this amount require manager approval
            </p>
          </div>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">
              Bank Accounts
            </h2>
          </div>
          <button
            onClick={() => setShowBankModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add Account
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {bankAccounts.map((b) => (
            <div
              key={b.id}
              className="px-5 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {b.name}
                    </p>
                    {b.isDefault && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {b.bank} · {b.accountNumber} · {b.currency}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-gray-900">
                  {fmt(b.balance)}
                </p>
                {!b.isDefault && (
                  <button
                    onClick={() => setDefault(b.id)}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() =>
                    setBankAccounts((prev) => prev.filter((x) => x.id !== b.id))
                  }
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">
            Payment Methods
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {paymentMethods.map((m) => (
            <div
              key={m.id}
              className="px-5 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{m.name}</p>
              </div>
              <button
                onClick={() => toggleMethod(m.id)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${m.enabled ? "bg-emerald-500" : "bg-gray-200"}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${m.enabled ? "translate-x-4.5" : "translate-x-1"}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tax Setup */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Tax Setup</h2>
          </div>
          <button
            onClick={openTaxCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add Tax Rule
          </button>
        </div>

        {/* Company Tax IDs */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Company Tax Identification
          </p>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Company TIN
              </label>
              <input
                value={companyTIN}
                onChange={(e) => setCompanyTIN(e.target.value)}
                placeholder="e.g. 12345678-0001"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                VAT Registration Number
              </label>
              <input
                value={vatRegNumber}
                onChange={(e) => setVatRegNumber(e.target.value)}
                placeholder="e.g. VAT-NG-00987654"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Tax Rules Table */}
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                Tax Name
              </th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                Type
              </th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                Rate
              </th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                GL Code
              </th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                Applies To
              </th>
              <th className="text-center px-5 py-2.5 text-xs font-semibold text-gray-500">
                Active
              </th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {taxEntries.map((t) => {
              const typeColors: Record<TaxType, string> = {
                VAT: "bg-blue-100 text-blue-700",
                WHT: "bg-purple-100 text-purple-700",
                PAYE: "bg-amber-100 text-amber-700",
                Custom: "bg-gray-100 text-gray-600",
              };
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">
                    {t.name}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${typeColors[t.type]}`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {t.type === "PAYE" ? (
                      <span className="text-xs text-gray-400 italic">
                        Variable
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {t.rate}%
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {t.glCode}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {t.appliesTo}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => toggleTax(t.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${t.enabled ? "bg-emerald-500" : "bg-gray-200"}`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${t.enabled ? "translate-x-4.5" : "translate-x-1"}`}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openTaxEdit(t)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setTaxEntries((prev) =>
                            prev.filter((x) => x.id !== t.id),
                          )
                        }
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bank Account Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Add Bank Account
              </h2>
              <button
                onClick={() => setShowBankModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Account Name *
                </label>
                <input
                  value={bankForm.name}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, name: e.target.value })
                  }
                  placeholder="e.g. Primary Operations Account"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Bank Name *
                  </label>
                  <input
                    value={bankForm.bank}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, bank: e.target.value })
                    }
                    placeholder="e.g. GTBank"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Account Number *
                  </label>
                  <input
                    value={bankForm.accountNumber}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="e.g. ****8821"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={bankForm.currency}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Opening Balance
                  </label>
                  <input
                    value={bankForm.balance}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, balance: e.target.value })
                    }
                    placeholder="e.g. 1000000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowBankModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addBankAccount}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                {taxEditId ? "Edit Tax Rule" : "New Tax Rule"}
              </h2>
              <button
                onClick={() => setShowTaxModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Tax Name *
                </label>
                <input
                  value={taxForm.name}
                  onChange={(e) =>
                    setTaxForm({ ...taxForm, name: e.target.value })
                  }
                  placeholder="e.g. VAT (Standard Rate)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Tax Type
                  </label>
                  <select
                    value={taxForm.type}
                    onChange={(e) =>
                      setTaxForm({
                        ...taxForm,
                        type: e.target.value as TaxType,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="VAT">VAT</option>
                    <option value="WHT">WHT</option>
                    <option value="PAYE">PAYE</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Rate (%)
                  </label>
                  <input
                    value={taxForm.rate}
                    onChange={(e) =>
                      setTaxForm({ ...taxForm, rate: e.target.value })
                    }
                    placeholder="e.g. 7.5"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    GL Code
                  </label>
                  <input
                    value={taxForm.glCode}
                    onChange={(e) =>
                      setTaxForm({ ...taxForm, glCode: e.target.value })
                    }
                    placeholder="e.g. 2300"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Applies To
                  </label>
                  <input
                    value={taxForm.appliesTo}
                    onChange={(e) =>
                      setTaxForm({ ...taxForm, appliesTo: e.target.value })
                    }
                    placeholder="e.g. Goods & Services"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowTaxModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveTax}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
