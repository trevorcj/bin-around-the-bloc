import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  Clock,
  CreditCard,
  ChevronDown,
  Banknote,
  Users,
  Check,
} from "lucide-react";
import clsx from "clsx";

function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [activeReconTab, setActiveReconTab] = useState("all");

  const faqs = [
    {
      q: "How do resident payments reach our estate bank account?",
      a: "Bin Around The Bloc integrates directly with Paystack via dedicated settlement subaccounts. Resident dues are paid online and settled automatically into the estate's verified bank account every morning (next business day T+1) without platform holding or custody delays.",
    },
    {
      q: "Can different property types pay different monthly dues?",
      a: "Yes. Estate administrators can configure customized property categories (e.g. Duplex ₦10,000, Bungalow ₦7,500, Flat ₦5,000, Commercial Shop ₦12,000). When rates change, historical records are preserved and only future cycles adopt the new rate.",
    },
    {
      q: "Can administrators record direct bank transfers and offline payments?",
      a: "Yes. If a resident pays via USSD or manual bank transfer directly to the estate, administrators can record the payment manually. The ledger updates instantly, marks the resident's monthly bill as paid, and issues a verified digital receipt.",
    },
    {
      q: "What happens when a resident moves out or leaves the estate?",
      a: "Administrators can deactivate the resident profile in one click. Deactivated residents are excluded from future monthly bill generation, while their entire historical ledger, payments, receipts, and reconciliation records remain permanently archived.",
    },
    {
      q: "Do residents need to download an application to pay?",
      a: "No app download is required. Residents access their responsive web portal from any mobile phone or computer using their estate code, view their balance, and pay securely using Card, Bank Transfer, or USSD.",
    },
  ];

  const sampleReconciliationRows = [
    {
      street: "Palm Grove Avenue",
      house: "House 12",
      name: "Engr. Babatunde Lawal",
      type: "Duplex",
      amount: "₦10,000",
      status: "Paid",
      date: "Aug 02, 2026",
    },
    {
      street: "Palm Grove Avenue",
      house: "House 14A",
      name: "Dr. Amaka Okonkwo",
      type: "Duplex",
      amount: "₦10,000",
      status: "Paid",
      date: "Aug 03, 2026",
    },
    {
      street: "Palm Grove Avenue",
      house: "House 16",
      name: "Tariq Adeleke",
      type: "Bungalow",
      amount: "₦7,500",
      status: "Unpaid",
      date: "-",
    },
    {
      street: "Hibiscus Close",
      house: "Plot 4, Flat 2",
      name: "Chidinma Nwosu",
      type: "Flat",
      amount: "₦5,000",
      status: "Paid",
      date: "Aug 01, 2026",
    },
    {
      street: "Hibiscus Close",
      house: "Plot 8",
      name: "Musa Ibrahim",
      type: "Bungalow",
      amount: "₦7,500",
      status: "Unpaid",
      date: "-",
    },
  ];

  const filteredReconciliationRows = sampleReconciliationRows.filter((r) => {
    if (activeReconTab === "paid") return r.status === "Paid";
    if (activeReconTab === "unpaid") return r.status === "Unpaid";
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 text-brand-accent selection:bg-brand-primary/20 selection:text-brand-accent">
      <header className="sticky top-0 z-50 border-b border-brand-accent/8 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Bin Around The Bloc" className="h-8 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-accent/70">
            <a href="#how-it-works" className="hover:text-brand-accent transition-colors">
              How it works
            </a>
            <a href="#features" className="hover:text-brand-accent transition-colors">
              Capabilities
            </a>
            <a href="#reconciliation" className="hover:text-brand-accent transition-colors">
              Reconciliation
            </a>
            <a href="#settlement" className="hover:text-brand-accent transition-colors">
              Payouts
            </a>
            <a href="#faq" className="hover:text-brand-accent transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-sm px-4 text-sm font-medium text-brand-accent hover:bg-brand-accent/5 transition-colors">
              Log in
            </Link>
            <Link
              to="/admin/signup"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-white shadow-xs hover:bg-brand-primary/90 transition-colors">
              Get started
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32 bg-radial from-brand-primary/5 via-stone-50 to-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3.5 py-1 text-xs font-semibold text-brand-primary mb-6">
              <ShieldCheck size={14} />
              <span>Estate Waste Dues & Automated Settlements</span>
            </div>

            <h1 className="text-4xl font-headlines sm:text-6xl text-brand-accent tracking-tight leading-[1.1]">
              Make waste collection payments effortless for your estate.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-brand-accent/75 leading-relaxed">
              Automate monthly dues, eliminate unverified bank alerts, and receive direct Paystack settlements into your estate's bank account every morning.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/admin/signup"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-brand-primary px-7 text-sm font-semibold text-white shadow-md hover:bg-brand-primary/90 transition-colors">
                Register Your Estate
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-brand-accent/15 bg-white px-6 text-sm font-medium text-brand-accent hover:bg-brand-accent/5 transition-colors">
                Resident Portal
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-brand-accent/60">
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-brand-primary" /> Zero platform holding
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-brand-primary" /> Next-morning bank payouts
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-brand-primary" /> Waste contractor reports
              </span>
            </div>
          </div>

          <div className="mt-16 mx-auto max-w-5xl rounded-lg border border-brand-accent/10 bg-white p-4 sm:p-6 shadow-xl shadow-brand-accent/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-brand-accent/8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-accent/50">
                    Live Estate Dashboard
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-status-success/10 px-2 py-0.5 text-[11px] font-semibold text-status-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" /> Connected
                  </span>
                </div>
                <h3 className="text-xl font-bold text-brand-accent mt-0.5">
                  Greenfield Residential Estate
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-sm bg-brand-accent/4 px-3 py-1.5 text-right">
                  <p className="text-[11px] text-brand-accent/50">Estate Code</p>
                  <p className="font-mono font-bold text-sm text-brand-accent tracking-wider">
                    GRN-4821
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
              <div className="rounded-sm border border-brand-accent/8 bg-brand-accent/2 p-4">
                <p className="text-xs font-medium text-brand-accent/60">Monthly Collections</p>
                <p className="text-2xl font-bold text-brand-accent mt-1">₦1,450,000</p>
                <p className="text-xs text-status-success font-medium mt-1">↑ 92% collection rate</p>
              </div>

              <div className="rounded-sm border border-brand-accent/8 bg-brand-accent/2 p-4">
                <p className="text-xs font-medium text-brand-accent/60">Registered Residents</p>
                <p className="text-2xl font-bold text-brand-accent mt-1">168 Homes</p>
                <p className="text-xs text-brand-accent/50 mt-1">Across 7 designated streets</p>
              </div>

              <div className="rounded-sm border border-brand-accent/8 bg-brand-accent/2 p-4">
                <p className="text-xs font-medium text-brand-accent/60">Next Bank Settlement</p>
                <p className="text-2xl font-bold text-brand-secondary mt-1">Tomorrow, 8:00 AM</p>
                <p className="text-xs text-brand-accent/50 mt-1">Direct Paystack T+1 NUBAN payout</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white border-y border-brand-accent/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-secondary">
              The Problem
            </h2>
            <p className="mt-2 text-3xl font-headlines sm:text-4xl text-brand-accent tracking-tight">
              Stop chasing bank transfer screenshots.
            </p>
            <p className="mt-3 text-brand-accent/70 text-base">
              Managing estate dues with spreadsheets and messaging chats creates disputes, missing money, and wasted executive hours.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="rounded-md border border-status-error/20 bg-status-error/[0.02] p-6 sm:p-8 space-y-4">
              <div className="inline-flex rounded-sm bg-status-error/10 px-3 py-1 text-xs font-semibold text-status-error">
                The Manual Chaos
              </div>
              <ul className="space-y-3.5 text-sm text-brand-accent/80">
                <li className="flex items-start gap-2.5">
                  <span className="text-status-error font-bold">✕</span>
                  Unverified bank receipts posted to WhatsApp group chats.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-status-error font-bold">✕</span>
                  Treasurers spending weekends matching narration text to house numbers.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-status-error font-bold">✕</span>
                  Disputes on collection day over who paid for waste pickup.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-status-error font-bold">✕</span>
                  No automated reports for the waste management contractor.
                </li>
              </ul>
            </div>

            <div className="rounded-md border border-brand-primary/30 bg-brand-primary/[0.03] p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="inline-flex rounded-sm bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                The Bin Around The Bloc Way
              </div>
              <ul className="space-y-3.5 text-sm text-brand-accent/90">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-brand-primary shrink-0 mt-0.5" />
                  Instant online payment via Card or Transfer with zero screenshot chasing.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-brand-primary shrink-0 mt-0.5" />
                  Automated next-day morning bank settlements straight to your estate account.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-brand-primary shrink-0 mt-0.5" />
                  One-click street-by-street PDF & CSV exports for waste truck operators.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-brand-primary shrink-0 mt-0.5" />
                  Verifiable digital receipts generated automatically for every home.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-primary">
              Simple 3-Step Process
            </h2>
            <p className="mt-2 text-3xl font-headlines sm:text-4xl text-brand-accent tracking-tight">
              Up and running in under five minutes.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-sm border border-brand-accent/10 bg-white p-6 sm:p-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary font-headlines text-xl font-bold">
                01
              </div>
              <h3 className="text-lg font-bold text-brand-accent">Set Up Your Estate</h3>
              <p className="text-sm text-brand-accent/70 leading-relaxed">
                Add your streets, configure property categories with your monthly waste collection rates, and connect your verified estate bank account.
              </p>
            </div>

            <div className="rounded-sm border border-brand-accent/10 bg-white p-6 sm:p-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary font-headlines text-xl font-bold">
                02
              </div>
              <h3 className="text-lg font-bold text-brand-accent">Residents Self-Register</h3>
              <p className="text-sm text-brand-accent/70 leading-relaxed">
                Share your unique estate code. Residents register in 60 seconds, choose their street and property number, and access their personal dues portal.
              </p>
            </div>

            <div className="rounded-sm border border-brand-accent/10 bg-white p-6 sm:p-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary font-headlines text-xl font-bold">
                03
              </div>
              <h3 className="text-lg font-bold text-brand-accent">Collect & Auto-Reconcile</h3>
              <p className="text-sm text-brand-accent/70 leading-relaxed">
                Residents pay seamlessly. Paystack settles directly to your account next business day, and our system generates complete street audits on demand.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white border-t border-brand-accent/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-secondary">
              Product Capabilities
            </h2>
            <p className="mt-2 text-3xl font-headlines sm:text-4xl text-brand-accent tracking-tight">
              Engineered specifically for Nigerian residential estates.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-sm border border-brand-accent/8 bg-stone-50/70 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-accent text-white">
                <Banknote size={20} />
              </div>
              <h4 className="text-base font-bold text-brand-accent">Direct Paystack Settlements</h4>
              <p className="text-xs text-brand-accent/70 leading-relaxed">
                100% of resident collections route directly to your designated bank account with zero platform fees split.
              </p>
            </div>

            <div className="rounded-sm border border-brand-accent/8 bg-stone-50/70 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-accent text-white">
                <Building2 size={20} />
              </div>
              <h4 className="text-base font-bold text-brand-accent">Tiered Property Dues</h4>
              <p className="text-xs text-brand-accent/70 leading-relaxed">
                Configure distinct dues for shops, duplexes, or flats. Rate adjustments protect historical bills and apply only to future cycles.
              </p>
            </div>

            <div className="rounded-sm border border-brand-accent/8 bg-stone-50/70 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-accent text-white">
                <FileSpreadsheet size={20} />
              </div>
              <h4 className="text-base font-bold text-brand-accent">Street-by-Street Audit Trail</h4>
              <p className="text-xs text-brand-accent/70 leading-relaxed">
                Reconcile collections house-by-house. Hand your waste collection crew a clean PDF manifest before each pickup run.
              </p>
            </div>

            <div className="rounded-sm border border-brand-accent/8 bg-stone-50/70 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-accent text-white">
                <Receipt size={20} />
              </div>
              <h4 className="text-base font-bold text-brand-accent">Instant Digital Receipts</h4>
              <p className="text-xs text-brand-accent/70 leading-relaxed">
                Residents receive verifiable digital receipts for every payment, with reference codes, timestamps, and downloadable PDFs.
              </p>
            </div>

            <div className="rounded-sm border border-brand-accent/8 bg-stone-50/70 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-accent text-white">
                <Users size={20} />
              </div>
              <h4 className="text-base font-bold text-brand-accent">Resident Self-Service</h4>
              <p className="text-xs text-brand-accent/70 leading-relaxed">
                Residents can check billing history, verify payment status, and settle outstanding balances in seconds without contacting the admin.
              </p>
            </div>

            <div className="rounded-sm border border-brand-accent/8 bg-stone-50/70 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-accent text-white">
                <CreditCard size={20} />
              </div>
              <h4 className="text-base font-bold text-brand-accent">Pre-Platform Debt Management</h4>
              <p className="text-xs text-brand-accent/70 leading-relaxed">
                Onboard residents with historical debts seamlessly. Opening balances are preserved and tracked alongside monthly dues.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="reconciliation" className="py-24 bg-stone-50 border-t border-brand-accent/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-primary">
              Audit & Operations
            </h2>
            <p className="mt-2 text-3xl font-headlines sm:text-4xl text-brand-accent tracking-tight">
              Audit-ready reconciliation for your waste contractors.
            </p>
            <p className="mt-3 text-sm sm:text-base text-brand-accent/70 leading-relaxed">
              Generate full billing manifests filtered by street, property category, or payment status. Export to print-ready PDF or formatted CSV in one click.
            </p>
          </div>

          <div className="mt-12 rounded-sm border border-brand-accent/10 bg-white shadow-sm overflow-hidden max-w-4xl mx-auto">
            <div className="p-4 sm:p-5 border-b border-brand-accent/8 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReconTab("all")}
                  className={clsx(
                    "px-3 py-1 rounded-sm text-xs font-medium cursor-pointer transition-colors",
                    activeReconTab === "all"
                      ? "bg-brand-accent text-white"
                      : "text-brand-accent/70 hover:bg-brand-accent/5"
                  )}>
                  All Residents (5)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReconTab("paid")}
                  className={clsx(
                    "px-3 py-1 rounded-sm text-xs font-medium cursor-pointer transition-colors",
                    activeReconTab === "paid"
                      ? "bg-brand-accent text-white"
                      : "text-brand-accent/70 hover:bg-brand-accent/5"
                  )}>
                  Paid (3)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReconTab("unpaid")}
                  className={clsx(
                    "px-3 py-1 rounded-sm text-xs font-medium cursor-pointer transition-colors",
                    activeReconTab === "unpaid"
                      ? "bg-brand-accent text-white"
                      : "text-brand-accent/70 hover:bg-brand-accent/5"
                  )}>
                  Unpaid (2)
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-brand-accent/60">
                <span className="inline-flex items-center gap-1 rounded-sm border border-brand-accent/15 px-2.5 py-1 bg-white">
                  <FileSpreadsheet size={13} /> Export CSV
                </span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-brand-accent/15 px-2.5 py-1 bg-white">
                  <Receipt size={13} /> Export PDF
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-brand-accent/10 bg-stone-50 text-brand-accent/60 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Street & Property</th>
                    <th className="px-4 py-3">Resident Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Dues</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-accent/5">
                  {filteredReconciliationRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-brand-accent/[0.015]">
                      <td className="px-4 py-3 font-medium text-brand-accent">
                        {row.street}, <span className="text-brand-accent/60">{row.house}</span>
                      </td>
                      <td className="px-4 py-3 text-brand-accent/80">{row.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-sm bg-brand-accent/5 text-[11px]">
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-brand-accent">
                        {row.amount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={clsx(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            row.status === "Paid"
                              ? "bg-status-success/10 text-status-success"
                              : "bg-status-warning/10 text-status-warning"
                          )}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="settlement" className="py-20 bg-white border-t border-brand-accent/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-md bg-[#0a2525] p-8 sm:p-12 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-secondary">
                  <Clock size={14} /> Automated Daily Settlements
                </div>
                <h3 className="text-2xl sm:text-3xl font-headlines tracking-tight">
                  Next business day bank deposits. Powered by Paystack.
                </h3>
                <p className="text-sm text-white/75 leading-relaxed">
                  Payouts are automatically settled into the estate's bank account every morning (next business day T+1) by Paystack. Your funds are never held on intermediate ledgers.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-xs uppercase tracking-widest text-white/50 font-semibold">
                    Official Settlement Partner:
                  </span>
                  <img src="/paystack.svg" alt="Paystack" className="h-5 opacity-90" />
                </div>
              </div>

              <div className="rounded-sm border border-white/15 bg-white/5 p-6 text-center shrink-0 space-y-2">
                <p className="text-xs uppercase tracking-wider text-white/60">Platform Deduction</p>
                <p className="text-4xl font-headlines font-bold text-white">0%</p>
                <p className="text-xs text-brand-secondary">100% of dues go to your estate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 bg-stone-50 border-t border-brand-accent/8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-primary">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-3xl font-headlines sm:text-4xl text-brand-accent tracking-tight">
              Everything you need to know.
            </p>
          </div>

          <div className="mt-12 space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-sm border border-brand-accent/10 bg-white overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-brand-accent hover:bg-brand-accent/2 cursor-pointer transition-colors">
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={clsx(
                        "text-brand-accent/50 transition-transform duration-200 shrink-0",
                        isOpen && "rotate-180 text-brand-accent"
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-brand-accent/75 leading-relaxed border-t border-brand-accent/5 pt-3 bg-stone-50/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0a2525] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-headlines tracking-tight">
            Ready to modernize waste collection in your estate?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/75 max-w-2xl mx-auto">
            Join forward-thinking estates managing waste dues with automated billing, transparent ledgers, and zero friction.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/admin/signup"
              className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-brand-primary px-8 text-sm font-semibold text-white shadow-lg hover:bg-brand-primary/90 transition-colors">
              Create Estate Account
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-white/20 bg-white/5 px-7 text-sm font-medium text-white hover:bg-white/10 transition-colors">
              Resident Sign In
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-brand-accent/10 bg-white py-12 text-xs text-brand-accent/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Bin Around The Bloc" className="h-6 w-auto" />
              <span>&copy; {new Date().getFullYear()} Bin Around The Bloc. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-6">
              <Link to="/login" className="hover:text-brand-accent transition-colors">
                Resident Portal
              </Link>
              <Link to="/admin/signup" className="hover:text-brand-accent transition-colors">
                Estate Registration
              </Link>
              <div className="flex items-center gap-2 text-brand-accent/40">
                <span>Secured by</span>
                <img src="/paystack-dark.svg" alt="Paystack" className="h-3.5 opacity-70" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
