import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import {
  LayoutDashboard,
  FileText,
  Zap,
  Settings,
  Bell,
  Search,
  Star,
  Lock,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  ArrowUpRight,
  CreditCard,
  Calendar,
  MessageSquare,
  BarChart3,
  Users,
  Sparkles,
  Menu,
  X,
  LogOut,
  HelpCircle,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
};

type QuoteRecord = {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  status: string;
  total: number;
  notes?: string;
  lineItems?: LineItem[];
  updatedAt?: unknown;
};

type AppCard = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  status: "free" | "premium" | "flagship";
  url?: string;
  features: string[];
};

// ─── App data ─────────────────────────────────────────────────────────────────

const apps: AppCard[] = [
  {
    id: "quotestar",
    name: "QuoteStar",
    description: "Electrical business estimator - Create professional quotes in minutes",
    icon: Sparkles,
    color: "amber",
    status: "flagship",
    url: "https://quotezap.com.au/quotestar/",
    features: ["Instant quotes", "SMS delivery", "Payment tracking", "Custom templates"],
  },
  {
    id: "invoiceflow",
    name: "InvoiceFlow",
    description: "Automated invoicing and payment collection system",
    icon: FileText,
    color: "blue",
    status: "premium",
    features: ["Auto invoicing", "Payment reminders", "Xero integration", "Recurring billing"],
  },
  {
    id: "jobtracker",
    name: "JobTracker",
    description: "Manage all your jobs and technicians in one place",
    icon: Calendar,
    color: "green",
    status: "premium",
    features: ["Job scheduling", "Technician tracking", "Client portal", "GPS routing"],
  },
  {
    id: "messagezap",
    name: "MessageZap",
    description: "SMS marketing and client communication hub",
    icon: MessageSquare,
    color: "purple",
    status: "free",
    features: ["Bulk SMS", "Templates", "Delivery reports"],
  },
  {
    id: "analyticspro",
    name: "AnalyticsPro",
    description: "Business insights and performance analytics",
    icon: BarChart3,
    color: "indigo",
    status: "premium",
    features: ["Revenue tracking", "Conversion rates", "Custom reports", "Forecasting"],
  },
  {
    id: "crewmanager",
    name: "CrewManager",
    description: "Team management and payroll simplified",
    icon: Users,
    color: "rose",
    status: "premium",
    features: ["Time tracking", "Payroll automation", "Leave management", "Performance reviews"],
  },
];

const colorMap = {
  amber:  { bg: "bg-amber-50",  border: "border-amber-200",  badge: "bg-amber-100 text-amber-700",   gradient: "from-amber-400 to-amber-600",   hover: "hover:bg-amber-100"  },
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",     gradient: "from-blue-400 to-blue-600",     hover: "hover:bg-blue-100"   },
  green:  { bg: "bg-green-50",  border: "border-green-200",  badge: "bg-green-100 text-green-700",   gradient: "from-green-400 to-green-600",   hover: "hover:bg-green-100"  },
  purple: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", gradient: "from-purple-400 to-purple-600", hover: "hover:bg-purple-100" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700", gradient: "from-indigo-400 to-indigo-600", hover: "hover:bg-indigo-100" },
  rose:   { bg: "bg-rose-50",   border: "border-rose-200",   badge: "bg-rose-100 text-rose-700",     gradient: "from-rose-400 to-rose-600",     hover: "hover:bg-rose-100"   },
};

const STATUS_OPTIONS = ["draft", "sent", "accepted", "declined", "invoiced"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function calcTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

// ─── Quote Editor ─────────────────────────────────────────────────────────────

function QuoteEditor({ quoteId }: { quoteId: string }) {
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "quotes", quoteId));
        if (snap.exists()) {
          const data = snap.data() as Omit<QuoteRecord, "id">;
          setQuote({ id: snap.id, ...data, lineItems: data.lineItems ?? [] });
        } else {
          setErrorMsg("Quote not found.");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load quote.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [quoteId]);

  function updateField<K extends keyof QuoteRecord>(field: K, value: QuoteRecord[K]) {
    setQuote((prev) => (prev ? { ...prev, [field]: value } : prev));
    setSaveStatus("idle");
  }

  function addLineItem() {
    const newItem: LineItem = { id: generateId(), description: "", qty: 1, unitPrice: 0 };
    setQuote((prev) => prev ? { ...prev, lineItems: [...(prev.lineItems ?? []), newItem] } : prev);
    setSaveStatus("idle");
  }

  function updateLineItem(id: string, field: keyof LineItem, value: string | number) {
    setQuote((prev) => {
      if (!prev) return prev;
      const updated = (prev.lineItems ?? []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      );
      return { ...prev, lineItems: updated };
    });
    setSaveStatus("idle");
  }

  function removeLineItem(id: string) {
    setQuote((prev) =>
      prev ? { ...prev, lineItems: (prev.lineItems ?? []).filter((i) => i.id !== id) } : prev
    );
    setSaveStatus("idle");
  }

  async function handleSave() {
    if (!quote) return;
    setSaving(true);
    setSaveStatus("idle");
    const computedTotal = calcTotal(quote.lineItems ?? []);
    const payload = {
      customerName:    quote.customerName,
      customerEmail:   quote.customerEmail   ?? "",
      customerPhone:   quote.customerPhone   ?? "",
      customerAddress: quote.customerAddress ?? "",
      status:          quote.status,
      notes:           quote.notes           ?? "",
      lineItems:       quote.lineItems       ?? [],
      total:           computedTotal,
      updatedAt:       serverTimestamp(),
    };
    try {
      await updateDoc(doc(db, "quotes", quote.id), payload);
      setQuote((prev) => (prev ? { ...prev, total: computedTotal } : prev));
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-sm">Loading quote…</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-4">{errorMsg || "Quote not found."}</p>
          <button
            onClick={() => { window.location.href = "/premium-test/"; }}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const lineItems = quote.lineItems ?? [];
  const computedTotal = calcTotal(lineItems);

  const statusColors: Record<string, string> = {
    draft:    "bg-gray-100 text-gray-600",
    sent:     "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-600",
    invoiced: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30">

      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={() => { window.location.href = "/premium-test/"; }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 transition-colors font-medium"
          >
            ← Dashboard
          </button>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusColors[quote.status] ?? "bg-gray-100 text-gray-600"}`}>
              {quote.status}
            </span>
            {saveStatus === "success" && (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" /> Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-sm text-red-500 font-medium">
                <AlertCircle className="h-4 w-4" /> Save failed
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-amber-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save Quote"}
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Quote</h1>
          <p className="text-sm text-gray-400 mt-1">ID: {quote.id}</p>
        </div>

        {/* Customer Details */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" /> Customer Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={quote.customerName}
                onChange={(e) => updateField("customerName", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all"
                placeholder="e.g. John Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Email
              </label>
              <input
                type="email"
                value={quote.customerEmail ?? ""}
                onChange={(e) => updateField("customerEmail", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={quote.customerPhone ?? ""}
                onChange={(e) => updateField("customerPhone", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all"
                placeholder="04xx xxx xxx"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Address
              </label>
              <input
                type="text"
                value={quote.customerAddress ?? ""}
                onChange={(e) => updateField("customerAddress", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all"
                placeholder="123 Main St, Brisbane QLD"
              />
            </div>
          </div>
        </section>

        {/* Quote Status */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-500" /> Quote Status
          </h2>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => updateField("status", s)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize border transition-all ${
                  quote.status === s
                    ? "bg-amber-500 text-white border-amber-500 shadow-md"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-300 hover:bg-amber-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Line Items */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-500" /> Line Items
            </h2>
            <button
              onClick={addLineItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>

          {lineItems.length > 0 && (
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
              <span className="col-span-6">Description</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Unit Price</span>
              <span className="col-span-1 text-right">Total</span>
              <span className="col-span-1" />
            </div>
          )}

          <div className="space-y-2">
            {lineItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center group">
                <div className="col-span-6">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                    placeholder="Item description…"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={0}
                    value={item.qty}
                    onChange={(e) => updateLineItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm text-center transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="w-full pl-6 pr-2 py-2 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm text-right transition-all"
                    />
                  </div>
                </div>
                <div className="col-span-1 text-right text-sm font-semibold text-gray-700">
                  ${(item.qty * item.unitPrice).toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => removeLineItem(item.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {lineItems.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No line items yet. Click <strong>Add Item</strong> to get started.</p>
            </div>
          )}

          {lineItems.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-end">
                <div className="w-60 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>${computedTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>GST (10%)</span>
                    <span>${(computedTotal * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total (inc. GST)</span>
                    <span>${(computedTotal * 1.1).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Notes */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-500" /> Notes
          </h2>
          <textarea
            rows={4}
            value={quote.notes ?? ""}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Add any notes, special instructions, or terms for this quote…"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm resize-none transition-all"
          />
        </section>

        {/* Bottom save bar */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4">
          <div className="text-sm">
            {saveStatus === "success" && (
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" /> Quote saved successfully
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1.5 text-red-500 font-medium">
                <AlertCircle className="h-4 w-4" /> Something went wrong — please try again
              </span>
            )}
            {saveStatus === "idle" && (
              <span className="text-gray-400">Unsaved changes will be lost if you leave.</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { window.location.href = "/premium-test/"; }}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-amber-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save Quote"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App (Dashboard) ─────────────────────────────────────────────────────

export default function App() {
  // All hooks at the top, before any conditional logic
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeApp, setUpgradeApp] = useState<AppCard | null>(null);

  const path = window.location.pathname;
  const isQuotePage = path.includes("/quote/");
  const quoteId = isQuotePage ? path.split("/quote/")[1] : null;

  useEffect(() => {
    async function fetchQuotes() {
      try {
        const q = query(
          collection(db, "quotes"),
          where("userId", "==", "test-user"),
          orderBy("updatedAt", "desc"),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<QuoteRecord, "id">),
        }));
        setQuotes(data);
      } catch (err) {
        console.error("Firestore error:", err);
      }
    }
    fetchQuotes();
  }, []);

  const userStats = {
    quotesCreated: 147,
    quotesSent: 138,
    winRate: 68,
    totalRevenue: 42850,
    thisMonth: { quotes: 23, revenue: 8420, trend: 12 },
  };

  const handleAppClick = (app: AppCard) => {
    if (app.status === "flagship" && app.url) {
      window.open(app.url, "_blank");
    } else if (app.status === "premium") {
      setUpgradeApp(app);
      setShowUpgradeModal(true);
    }
  };

  const closeUpgradeModal = () => {
    setShowUpgradeModal(false);
    setUpgradeApp(null);
  };

  const handleUpgradeNow = () => {
    window.open("https://quotezap.com.au/pricing/", "_blank");
  };

  // Route: quote editor
  if (isQuotePage && quoteId) {
    return <QuoteEditor quoteId={quoteId} />;
  }

  // Route: main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30">

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 flex flex-col ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-200">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">QuoteZap</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 shrink-0">
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg bg-amber-50 text-amber-700 font-medium">
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button
            onClick={() => { window.location.href = "/premium-test/quotes/"; }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Quotes</span>}
          </button>
          <button
            onClick={() => { window.location.href = "/premium-test/calendar/"; }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Calendar</span>}
          </button>
          <button
            onClick={() => { window.location.href = "/premium-test/clients/"; }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Users className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Clients</span>}
          </button>
        </nav>

        {/* Recent Jobs */}
        {sidebarOpen && (
          <div className="px-4 pt-2 pb-4 overflow-y-auto flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Recent Jobs
            </p>
            {quotes.length === 0 ? (
              <p className="text-xs text-gray-400 px-1">No jobs yet…</p>
            ) : (
              <div className="space-y-1">
                {quotes.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => { window.location.href = `/premium-test/quote/${q.id}`; }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors group"
                  >
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-amber-700">
                      {q.customerName}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{q.status}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={() => { window.location.href = "/premium-test/settings/"; }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mb-2"
          >
            <Settings className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button
            onClick={() => { window.location.href = "/premium-test/logout/"; }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}>

        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quotes, clients, apps..."
                  className="pl-10 pr-4 py-2 w-80 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </button>
              <button
                onClick={() => window.open("https://quotezap.com.au/support/", "_blank")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <HelpCircle className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">Mitchell Sparkie</p>
                  <p className="text-xs text-gray-500">Premium Plan</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold">
                  MS
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 shadow-lg shadow-amber-200 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Welcome back, Mitchell! 👋</h1>
                <p className="text-amber-100">You've created 23 quotes this month. Keep up the great work!</p>
              </div>
              <button
                onClick={() => window.open("https://quotezap.com.au/quotestar/", "_blank")}
                className="flex items-center gap-2 px-5 py-3 bg-white text-amber-600 rounded-xl font-semibold hover:bg-amber-50 transition-colors shadow-lg"
              >
                <Sparkles className="h-5 w-5" />
                Open QuoteStar
                <ArrowUpRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Quotes Created</span>
                <FileText className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">{userStats.quotesCreated}</span>
                <span className="text-sm text-green-600 font-medium flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />+12%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Total Revenue</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">${userStats.totalRevenue.toLocaleString()}</span>
                <span className="text-sm text-green-600 font-medium flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />+18%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">This year</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Win Rate</span>
                <Star className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">{userStats.winRate}%</span>
                <span className="text-sm text-green-600 font-medium flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />+5%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Industry avg: 45%</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">This Month</span>
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">${userStats.thisMonth.revenue.toLocaleString()}</span>
                <span className="text-sm text-green-600 font-medium flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />+{userStats.thisMonth.trend}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{userStats.thisMonth.quotes} quotes sent</p>
            </div>
          </div>

          {/* Your Apps */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Apps</h2>
                <p className="text-sm text-gray-500 mt-1">Access all your business tools in one place</p>
              </div>
              <button
                onClick={handleUpgradeNow}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg font-medium hover:bg-amber-100 transition-colors border border-amber-200"
              >
                <CreditCard className="h-4 w-4" />
                Upgrade Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => {
                const colors = colorMap[app.color as keyof typeof colorMap];
                const Icon = app.icon;
                return (
                  <div
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    className={`bg-white rounded-xl border-2 ${
                      app.status === "flagship" ? "border-amber-400" : "border-gray-200"
                    } p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group ${colors.hover}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 text-${app.color}-600`} />
                      </div>
                      {app.status === "flagship" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-semibold rounded-full">
                          <Star className="h-3 w-3 fill-current" /> Flagship
                        </span>
                      )}
                      {app.status === "premium" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                          <Lock className="h-3 w-3" /> Premium
                        </span>
                      )}
                      {app.status === "free" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          <CheckCircle className="h-3 w-3" /> Free
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{app.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{app.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {app.features.slice(0, 3).map((feature, idx) => (
                        <span key={idx} className={`text-xs px-2 py-1 rounded-md ${colors.badge}`}>
                          {feature}
                        </span>
                      ))}
                      {app.features.length > 3 && (
                        <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                          +{app.features.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        app.status === "flagship" ? "text-amber-600"
                        : app.status === "premium" ? "text-gray-600"
                        : "text-green-600"
                      }`}>
                        {app.status === "flagship" ? "Open App →"
                          : app.status === "premium" ? "Unlock Access"
                          : "Available"}
                      </span>
                      <ChevronRight className={`h-5 w-5 text-gray-400 group-hover:translate-x-1 group-hover:text-${app.color}-600 transition-all`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-1">Unlock All Apps</h3>
                  <p className="text-gray-400">Get access to all premium apps and grow your business faster</p>
                </div>
              </div>
              <button
                onClick={handleUpgradeNow}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl"
              >
                <CreditCard className="h-5 w-5" />
                Upgrade Now
                <ArrowUpRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && upgradeApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Upgrade to Premium</h3>
              <button onClick={closeUpgradeModal} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className={`h-14 w-14 rounded-xl ${colorMap[upgradeApp.color as keyof typeof colorMap].bg} flex items-center justify-center`}>
                <upgradeApp.icon className="h-7 w-7" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{upgradeApp.name}</h4>
                <p className="text-sm text-gray-500">{upgradeApp.description}</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-gray-700">Features included:</h4>
              {upgradeApp.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Premium Plan</span>
                <span className="text-2xl font-bold text-amber-600">
                  $49<span className="text-sm font-normal text-gray-500">/mo</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">All apps included • Cancel anytime</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={closeUpgradeModal}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={handleUpgradeNow}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
