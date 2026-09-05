import {
  AlertCircle,
  ArrowUpRight,
  BanknoteArrowUp,
  Building2,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import Table from "./Table";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import useAuth from "../hooks/useAuth";
import usePayments from "../hooks/usePayments";
import supabase from "../services/supabase";
import formatDate from "../utils/formatDate";
import formatCurrency from "../utils/formatCurrency";

const DASHBOARD_HISTORY_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "charge", label: "Charge & Period" },
  { key: "method", label: "Payment Method" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "status", label: "Status" },
];

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}

function getDashboardStatusClasses(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "successful") {
    return "bg-status-success/10 text-status-success";
  }

  if (normalized === "pending") {
    return "bg-status-warning/10 text-status-warning";
  }

  if (normalized === "failed") {
    return "bg-status-error/10 text-status-error";
  }

  return "bg-brand-accent/10 text-brand-accent";
}

function DashboardGrid({ user: propUser }) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  const { data: bills = [], isLoading: billsLoading } = useQuery({
    queryKey: ["residentDashboardBills", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("resident_id", user.id)
        .order("year", { ascending: false });
      if (error) return [];
      return data || [];
    },
  });

  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error,
  } = usePayments({
    search: "",
    status: "all",
    month: "all",
    page: 1,
  });

  const allPayments = paymentsData?.data || [];
  const payments = allPayments.slice(0, 5);
  const lastPayment = allPayments[0] || null;

  const unpaidBills = bills.filter(
    (bill) => normalizeStatus(bill.status) === "unpaid",
  );
  const unpaidSum = unpaidBills.reduce(
    (acc, b) => acc + (Number(b.amount) || 0),
    0,
  );
  const openingBalance = Number(user?.opening_balance) || 0;
  const totalOutstanding = unpaidSum + openingBalance;
  const monthlyFee = Number(user?.property_fee) || 5000;

  const lastPeriod =
    lastPayment?.month && lastPayment?.year
      ? `${lastPayment.month.charAt(0).toUpperCase() + lastPayment.month.slice(1)}, ${lastPayment.year}`
      : "No history";
  const lastPaymentAmount = lastPayment?.amount ?? 0;

  return (
    <div className="bg-transparent space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          className={clsx(
            "flex flex-col justify-between rounded-sm border p-5 transition-shadow",
            totalOutstanding > 0
              ? "border-amber-300 bg-amber-50/40"
              : "border-brand-accent/10 bg-white",
          )}>
          <div className="flex items-start justify-between">
            <div
              className={clsx(
                "flex h-11 w-11 items-center justify-center rounded-sm",
                totalOutstanding > 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700",
              )}>
              {totalOutstanding > 0 ? (
                <AlertCircle size={22} />
              ) : (
                <CheckCircle2 size={22} />
              )}
            </div>
            {totalOutstanding > 0 ? (
              <Link to="/app/payment">
                <span className="inline-flex items-center gap-1 rounded-sm bg-brand-accent px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-accent/90">
                  Pay bill <ArrowUpRight size={14} />
                </span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Settled
              </span>
            )}
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/45">
              Total Outstanding Balance
            </p>
            <h3
              className={clsx(
                "mt-2 text-2xl font-semibold tracking-tight",
                totalOutstanding > 0 ? "text-amber-900" : "text-brand-accent",
              )}>
              {billsLoading ? "..." : formatCurrency(totalOutstanding, "NGN")}
            </h3>
            <p className="mt-1 text-xs text-brand-accent/60">
              {totalOutstanding > 0
                ? `${unpaidBills.length} unpaid bill(s) pending payment`
                : "All bills settled"}
            </p>
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-sm border border-brand-accent/10 bg-white p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary">
              <Building2 size={22} />
            </div>
            <Link to="/app/payment">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline">
                Make payment <ArrowUpRight size={14} />
              </span>
            </Link>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/45">
              Assigned Monthly Rate
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-brand-accent">
              {formatCurrency(monthlyFee, "NGN")}
              <span className="text-sm font-normal text-brand-accent/50">
                {" "}
                / month
              </span>
            </h3>
            <p className="mt-1 text-xs text-brand-accent/60">
              {user?.property_type_name || "Standard Property"} • Set by Estate
              Admin
            </p>
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-sm border border-brand-accent/10 bg-white p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-brand-secondary/15 text-brand-secondary">
              <BanknoteArrowUp size={22} />
            </div>
            <Link to="/app/history">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline">
                All receipts <ArrowUpRight size={14} />
              </span>
            </Link>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent/45">
              Last Payment Recorded
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-brand-accent">
              {formatCurrency(lastPaymentAmount, "NGN")}
            </h3>
            <p className="mt-1 text-xs text-brand-accent/60">
              {lastPeriod} •{" "}
              {lastPayment?.recorded_by === "Admin"
                ? "Reconciled by Admin"
                : lastPayment?.paymentMethod || "Paystack"}
            </p>
          </div>
        </article>
      </div>

      {unpaidBills.length > 0 && (
        <div className="flex flex-col gap-3 rounded-sm border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-950">
                Pending Estate Bills: {formatCurrency(totalOutstanding, "NGN")}
              </p>
              <p className="text-xs text-amber-800">
                You have {unpaidBills.length} unpaid bill(s) for{" "}
                {unpaidBills
                  .map(
                    (b) =>
                      `${b.month ? b.month.charAt(0).toUpperCase() + b.month.slice(1) : ""} ${b.year || ""}`,
                  )
                  .join(", ")}
                .
              </p>
            </div>
          </div>
          <Link
            to="/app/payment"
            className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-amber-900 px-4 py-2 text-xs font-medium text-white hover:bg-amber-950 self-start sm:self-auto shrink-0">
            Settle Outstanding Bills <ArrowUpRight size={14} />
          </Link>
        </div>
      )}

      <Table
        data={payments}
        columns={DASHBOARD_HISTORY_COLUMNS}
        responsiveAt="md"
        title="Recent Transactions"
        subtitle="A quick view of your recorded estate waste payments."
        renderRow={(row) => (
          <tr
            key={row.id || row.receiptid}
            onClick={() => navigate(`/app/receipts/${row.receiptid || row.id}`)}
            className="border-b border-brand-accent/8 transition-colors last:border-b-0 hover:bg-brand-accent/[0.018] cursor-pointer">
            <th
              scope="row"
              className="px-6 py-4 text-left font-normal whitespace-nowrap">
              <div className="space-y-1">
                <p className="font-medium text-brand-accent">
                  {formatDate(row.createdat)}
                </p>
                <p className="text-xs text-brand-accent/45">{row.receiptid}</p>
              </div>
            </th>

            <td className="px-6 py-4">
              <div className="space-y-1">
                <p className="font-medium text-brand-accent">
                  {row.month
                    ? `${row.month.charAt(0).toUpperCase() + row.month.slice(1)}, ${row.year}`
                    : "Waste Collection Fee"}
                </p>
                <p className="text-xs text-brand-accent/50">
                  {row.note ||
                    (row.recorded_by === "Admin"
                      ? "Reconciled by Admin"
                      : "Direct Online Payment")}
                </p>
              </div>
            </td>

            <td className="px-6 py-4">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-accent/75">
                <CreditCard size={13} className="shrink-0" />
                {row.paymentMethod || "Paystack"}
              </span>
            </td>

            <td className="px-6 py-4 text-right font-medium text-brand-accent">
              {formatCurrency(row.amount, "NGN")}
            </td>

            <td className="px-6 py-4">
              <span
                className={clsx(
                  "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                  getDashboardStatusClasses(row.status),
                )}>
                {row.status}
              </span>
            </td>
          </tr>
        )}
        renderCard={(row) => {
          const periodLabel = row.month
            ? `${row.month.charAt(0).toUpperCase() + row.month.slice(1)}, ${row.year}`
            : "Waste Collection";

          return (
            <article
              key={row.id || row.receiptid}
              onClick={() =>
                navigate(`/app/receipts/${row.receiptid || row.id}`)
              }
              className="space-y-3 p-4 cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand-accent">
                    Waste Collection Fee - {periodLabel}
                  </p>
                  <p className="text-xs text-brand-accent/50 mt-0.5">
                    {row.paymentMethod || "Paystack"}
                  </p>
                </div>

                <span
                  className={clsx(
                    "inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                    getDashboardStatusClasses(row.status),
                  )}>
                  {row.status}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-sm pt-2 border-t border-brand-accent/5">
                <div>
                  <p className="text-xs text-brand-accent/50">
                    {formatDate(row.createdat)}
                  </p>
                  <p className="text-[11px] text-brand-accent/40 font-mono">
                    {row.receiptid}
                  </p>
                </div>
                <p className="font-semibold text-brand-accent">
                  {formatCurrency(row.amount, "NGN")}
                </p>
              </div>
            </article>
          );
        }}
        actions={
          <Link
            to="/app/history"
            className="inline-flex items-center gap-1 rounded-sm border border-brand-accent/10 px-3 py-1.5 text-xs font-medium text-brand-accent transition-colors hover:bg-brand-accent/5">
            View all
          </Link>
        }
        isLoading={paymentsLoading}
        error={error}
      />
    </div>
  );
}

export default DashboardGrid;
