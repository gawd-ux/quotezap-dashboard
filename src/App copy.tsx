import { doc, getDoc } from "firebase/firestore";
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
  HelpCircle
} from 'lucide-react';

type QuoteRecord = {
  id: string;
  customerName: string;
  status: string;
  total: number;
  updatedAt?: unknown;
};

type AppCard = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  status: 'free' | 'premium' | 'flagship';
  url?: string;
  features: string[];
};

const apps: AppCard[] = [
  {
    id: 'quotestar',
    name: 'QuoteStar',
    description: 'Electrical business estimator - Create professional quotes in minutes',
    icon: Sparkles,
    color: 'amber',
    status: 'flagship',
    url: 'https://quotezap.com.au/quotestar/',
    features: ['Instant quotes', 'SMS delivery', 'Payment tracking', 'Custom templates']
  },
  {
    id: 'invoiceflow',
    name: 'InvoiceFlow',
    description: 'Automated invoicing and payment collection system',
    icon: FileText,
    color: 'blue',
    status: 'premium',
    features: ['Auto invoicing', 'Payment reminders', 'Xero integration', 'Recurring billing']
  },
  {
    id: 'jobtracker',
    name: 'JobTracker',
    description: 'Manage all your jobs and technicians in one place',
    icon: Calendar,
    color: 'green',
    status: 'premium',
    features: ['Job scheduling', 'Technician tracking', 'Client portal', 'GPS routing']
  },
  {
    id: 'messagezap',
    name: 'MessageZap',
    description: 'SMS marketing and client communication hub',
    icon: MessageSquare,
    color: 'purple',
    status: 'free',
    features: ['Bulk SMS', 'Templates', 'Delivery reports']
  },
  {
    id: 'analyticspro',
    name: 'AnalyticsPro',
    description: 'Business insights and performance analytics',
    icon: BarChart3,
    color: 'indigo',
    status: 'premium',
    features: ['Revenue tracking', 'Conversion rates', 'Custom reports', 'Forecasting']
  },
  {
    id: 'crewmanager',
    name: 'CrewManager',
    description: 'Team management and payroll simplified',
    icon: Users,
    color: 'rose',
    status: 'premium',
    features: ['Time tracking', 'Payroll automation', 'Leave management', 'Performance reviews']
  }
];

const colorMap = {
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    gradient: 'from-amber-400 to-amber-600',
    hover: 'hover:bg-amber-100'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    gradient: 'from-blue-400 to-blue-600',
    hover: 'hover:bg-blue-100'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    gradient: 'from-green-400 to-green-600',
    hover: 'hover:bg-green-100'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    gradient: 'from-purple-400 to-purple-600',
    hover: 'hover:bg-purple-100'
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-700',
    gradient: 'from-indigo-400 to-indigo-600',
    hover: 'hover:bg-indigo-100'
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-700',
    gradient: 'from-rose-400 to-rose-600',
    hover: 'hover:bg-rose-100'
  }
};

export default function App() {
  // ── All hooks declared at the top, before any conditional logic ──
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [activeQuote, setActiveQuote] = useState<QuoteRecord | null>(null);
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
          ...(d.data() as Omit<QuoteRecord, 'id'>),
        }));
        setQuotes(data);
      } catch (err) {
        console.error("Firestore error:", err);
      }
    }
    fetchQuotes();
  }, []);

  useEffect(() => {
    async function loadQuote() {
      if (!quoteId) return;
      try {
        const docRef = doc(db, "quotes", quoteId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setActiveQuote({ id: snap.id, ...(snap.data() as Omit<QuoteRecord, 'id'>) });
        }
      } catch (err) {
        console.error("Error loading quote:", err);
      }
    }
    loadQuote();
  }, [quoteId]);

  const userStats = {
    quotesCreated: 147,
    quotesSent: 138,
    winRate: 68,
    totalRevenue: 42850,
    thisMonth: {
      quotes: 23,
      revenue: 8420,
      trend: 12
    }
  };

  const handleAppClick = (app: AppCard) => {
    if (app.status === 'flagship' && app.url) {
      window.open(app.url, '_blank');
    } else if (app.status === 'premium') {
      setUpgradeApp(app);
      setShowUpgradeModal(true);
    }
  };

  const closeUpgradeModal = () => {
    setShowUpgradeModal(false);
    setUpgradeApp(null);
  };

  const handleUpgradeNow = () => {
    window.open('https://quotezap.com.au/pricing/', '_blank');
  };

  // ── Quote detail page view ──
  if (isQuotePage && activeQuote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <button
            onClick={() => { window.location.href = "/premium-test/"; }}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors mb-6"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Quote Editor</h1>
          <div className="space-y-3">
            <p className="text-gray-700"><span className="font-semibold">Customer:</span> {activeQuote.customerName}</p>
            <p className="text-gray-700"><span className="font-semibold">Status:</span> {activeQuote.status}</p>
            <p className="text-gray-700"><span className="font-semibold">Total:</span> ${activeQuote.total}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main dashboard view ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
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
        <nav className="p-4 space-y-1">
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg bg-amber-50 text-amber-700 font-medium">
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => { window.location.href = '/premium-test/quotes/'; }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Quotes</span>}
          </button>

          <button
            onClick={() => { window.location.href = '/premium-test/calendar/'; }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Calendar</span>}
          </button>

          <button
            onClick={() => { window.location.href = '/premium-test/clients/'; }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Users className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Clients</span>}
          </button>
        </nav>

        {/* Recent Jobs — styled sidebar section */}
        {sidebarOpen && (
          <div className="px-4 pt-2 pb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Jobs</p>
            {quotes.length === 0 ? (
              <p className="text-xs text-gray-400 px-1">No jobs yet...</p>
            ) : (
              <div className="space-y-1">
                {quotes.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => { window.location.href = `/premium-test/quote/${q.id}`; }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">{q.customerName}</p>
                    <p className="text-xs text-gray-400 capitalize">{q.status}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <button
            onClick={() => { window.location.href = '/premium-test/settings/'; }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors mb-2"
          >
            <Settings className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button
            onClick={() => { window.location.href = '/premium-test/logout/'; }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
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
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={() => window.open('https://quotezap.com.au/support/', '_blank')}
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
                onClick={() => window.open('https://quotezap.com.au/quotestar/', '_blank')}
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

          {/* Your Apps Section */}
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
                      app.status === 'flagship' ? 'border-amber-400' : 'border-gray-200'
                    } p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group ${colors.hover}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 text-${app.color}-600`} />
                      </div>

                      {app.status === 'flagship' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-semibold rounded-full">
                          <Star className="h-3 w-3 fill-current" />
                          Flagship
                        </span>
                      )}
                      {app.status === 'premium' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                          <Lock className="h-3 w-3" />
                          Premium
                        </span>
                      )}
                      {app.status === 'free' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Free
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
                      <span
                        className={`text-sm font-medium ${
                          app.status === 'flagship'
                            ? 'text-amber-600'
                            : app.status === 'premium'
                            ? 'text-gray-600'
                            : 'text-green-600'
                        }`}
                      >
                        {app.status === 'flagship'
                          ? 'Open App →'
                          : app.status === 'premium'
                          ? 'Unlock Access'
                          : 'Available'}
                      </span>
                      <ChevronRight
                        className={`h-5 w-5 text-gray-400 group-hover:translate-x-1 group-hover:text-${app.color}-600 transition-all`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upgrade CTA Banner */}
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
              <button
                onClick={closeUpgradeModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
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
