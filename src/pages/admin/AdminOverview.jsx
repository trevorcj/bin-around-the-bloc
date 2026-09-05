import { useQuery } from "@tanstack/react-query";
import { Users, Banknote, CreditCard, AlertCircle, ArrowUpRight, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import clsx from "clsx";
import useAuth from "../../hooks/useAuth";
import { getEstateOverview, getEstateSettings } from "../../api/adminApi";
import { StyledH1 } from "../../styles/CommonStyles";
import Table from "../../ui/Table";
import PayoutAccountModal from "./PayoutAccountModal";
import formatCurrency from "../../utils/formatCurrency";
import formatDate from "../../utils/formatDate";
import showToast from "../../utils/showToast";

const RECENT_PAYMENT_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "resident", label: "Resident" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "method", label: "Method" },
  { key: "status", label: "Status" },
];

function getStatusClasses(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "successful") {
    return "bg-status-success/10 text-status-success";
  }
  if (normalized === "pending") {
    return "bg-status-warning/10 text-status-warning";
  }
  return "bg-status-error/10 text-status-error";
}

function AdminOverview() {
  const { user } = useAuth();
  const estateId = user?.estate_id;
  const estateCode = user?.estate?.code || "";
  const [copied, setCopied] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);

  const { data: estateSettings } = useQuery({
    queryKey: ["estateSettings", estateId],
    queryFn: () => getEstateSettings(estateId),
    enabled: !!estateId,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminOverview", estateId],
    queryFn: () => getEstateOverview(estateId),
    enabled: !!estateId,
  });

  const needsPayoutSetup =
    estateSettings && estateSettings.payout_account_status !== "connected";

  const showFirstTimeModal =
    needsPayoutSetup && !dismissedPrompt && !isPayoutModalOpen;

  async function handleCopyCode() {
    if (!estateCode) return;
    try {
      await navigator.clipboard.writeText(estateCode);
      setCopied(true);
      showToast("success", "Estate code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("error", "Unable to copy code.");
    }
  }

  const totalResidents = data?.totalResidents ?? 0;
  const totalCollected = data?.totalCollected ?? 0;
  const totalPayments = data?.totalPayments ?? 0;
  const totalOutstanding = data?.totalOutstanding ?? 0;
  const recentPayments = data?.recentPayments || [];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <StyledH1>Estate Overview</StyledH1>
          <p className="text-brand-accent/80 mt-1">
            Financial snapshot and resident billing summary for {user?.estate?.name || "your estate"}.
          </p>
        </div>

        {estateCode && (
          <div className="flex items-center gap-3 bg-white border border-brand-accent/10 px-4 py-2.5 rounded-sm shadow-xs self-start sm:self-auto">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-accent/50">
                Share Estate Code
              </p>
              <p className="font-mono font-bold text-base text-brand-primary tracking-wider">
                {estateCode}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-brand-accent/5 hover:bg-brand-accent/10 text-brand-accent text-xs font-semibold transition-colors cursor-pointer">
              {copied ? (
                <>
                  <Check size={14} className="text-status-success" /> Copied
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Code
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {needsPayoutSetup && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-sm border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="size-5 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-amber-950">
                Connect your estate payout account
              </p>
              <p className="text-amber-800 mt-0.5">
                Residents cannot pay online until a settlement bank account is connected. Payouts settle directly to your designated bank account every morning.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPayoutModalOpen(true)}
            className="inline-flex items-center justify-center shrink-0 px-3.5 py-2 rounded-sm bg-brand-accent text-white font-medium text-xs hover:bg-brand-accent/90 cursor-pointer self-start sm:self-auto">
            Connect Account
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <article className="flex flex-col justify-between border border-brand-accent/10 bg-white p-5 rounded-sm shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm text-brand-primary bg-brand-primary/10">
              <Users size={22} />
            </div>
            <Link
              to="/admin/residents"
              className="text-xs font-semibold text-brand-accent/60 hover:text-brand-primary flex items-center gap-0.5">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/45">
              Registered Residents
            </p>
            <h3 className="mt-2 text-2xl font-bold text-brand-accent">
              {isLoading ? "…" : totalResidents}
            </h3>
            <p className="mt-1 text-xs text-brand-accent/45">
              Active residents in this estate
            </p>
          </div>
        </article>

        <article className="flex flex-col justify-between border border-brand-accent/10 bg-white p-5 rounded-sm shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm text-brand-secondary bg-brand-secondary/10">
              <Banknote size={22} />
            </div>
            <Link
              to="/admin/payments"
              className="text-xs font-semibold text-brand-accent/60 hover:text-brand-secondary flex items-center gap-0.5">
              Ledger <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/45">
              Total Collected
            </p>
            <h3 className="mt-2 text-2xl font-bold text-brand-accent">
              {isLoading ? "…" : formatCurrency(totalCollected, "NGN")}
            </h3>
            <p className="mt-1 text-xs text-brand-accent/45">
              Verified waste collection payments
            </p>
          </div>
        </article>

        <article className="flex flex-col justify-between border border-brand-accent/10 bg-white p-5 rounded-sm shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm text-status-success bg-status-success/10">
              <CreditCard size={22} />
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/45">
              Successful Payments
            </p>
            <h3 className="mt-2 text-2xl font-bold text-brand-accent">
              {isLoading ? "…" : totalPayments}
            </h3>
            <p className="mt-1 text-xs text-brand-accent/45">
              Total settled transactions
            </p>
          </div>
        </article>

        <article className="flex flex-col justify-between border border-brand-accent/10 bg-white p-5 rounded-sm shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm text-status-warning bg-status-warning/10">
              <AlertCircle size={22} />
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/45">
              Outstanding Balance
            </p>
            <h3 className="mt-2 text-2xl font-bold text-brand-accent">
              {isLoading ? "…" : formatCurrency(totalOutstanding, "NGN")}
            </h3>
            <p className="mt-1 text-xs text-brand-accent/45">
              Unpaid bills + opening balances
            </p>
          </div>
        </article>
      </div>

      <Table
        data={recentPayments}
        columns={RECENT_PAYMENT_COLUMNS}
        responsiveAt="md"
        title="Recent Estate Payments"
        subtitle="Latest resident payments verified and recorded in your estate."
        emptyState="No payments recorded yet. Share your estate code with residents to begin collecting fees."
        actions={
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-1 rounded-sm border border-brand-accent/10 px-3 py-2 text-sm font-medium text-brand-accent transition-colors hover:bg-brand-accent/5">
            View all payments
          </Link>
        }
        isLoading={isLoading}
        error={error}
        renderRow={(row) => (
          <tr className="border-b border-brand-accent/8 transition-colors last:border-b-0 hover:bg-brand-accent/[0.018]">
            <td className="px-6 py-4">
              <div className="space-y-0.5">
                <p className="font-medium text-brand-accent">
                  {formatDate(row.createdat)}
                </p>
                <p className="text-xs text-brand-accent/45">{row.receiptid}</p>
              </div>
            </td>

            <td className="px-6 py-4">
              <div className="space-y-0.5">
                <p className="font-medium text-brand-accent">{row.fullname}</p>
                <p className="text-xs text-brand-accent/50">{row.address}</p>
              </div>
            </td>

            <td className="px-6 py-4 text-right font-medium text-brand-accent">
              {formatCurrency(row.amount, "NGN")}
            </td>

            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-sm bg-brand-accent/5 text-brand-accent">
                {row.paymentMethod || "Paystack"}
              </span>
            </td>

            <td className="px-6 py-4">
              <span
                className={clsx(
                  "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                  getStatusClasses(row.status)
                )}>
                {row.status}
              </span>
            </td>
          </tr>
        )}
        renderCard={(row) => (
          <article className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-brand-accent">
                  {row.fullname}
                </p>
                <p className="text-xs text-brand-accent/50">{row.address}</p>
              </div>
              <span
                className={clsx(
                  "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  getStatusClasses(row.status)
                )}>
                {row.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t border-brand-accent/5">
              <span className="text-xs text-brand-accent/50">
                {formatDate(row.createdat)} • {row.paymentMethod}
              </span>
              <span className="font-semibold text-brand-accent">
                {formatCurrency(row.amount, "NGN")}
              </span>
            </div>
          </article>
        )}
      />

      <PayoutAccountModal
        isOpen={isPayoutModalOpen || showFirstTimeModal}
        onClose={() => {
          setIsPayoutModalOpen(false);
          setDismissedPrompt(true);
        }}
        estateId={estateId}
        currentPayoutAccount={estateSettings}
        isEditing={estateSettings?.payout_account_status === "connected"}
      />
    </div>
  );
}

export default AdminOverview;
