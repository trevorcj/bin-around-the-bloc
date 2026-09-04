import { ArrowUpRight, BanknoteArrowUp, CalendarClock } from "lucide-react";
import Table from "./Table";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { addDays, differenceInCalendarDays } from "date-fns";

import usePayments from "../hooks/usePayments";
import formatDate from "../utils/formatDate";
import formatCurrency from "../utils/formatCurrency";

const DASHBOARD_HISTORY_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "charge", label: "Charge" },
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

function parsePaymentDate(receipt) {
  if (!receipt) return null;
  const value = receipt.createdat || receipt.paymentDate || receipt.date;
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function getNextPaymentInfo(receipt) {
  if (!receipt) {
    return { label: "No payment history", detail: "" };
  }

  const lastDate = parsePaymentDate(receipt);

  if (!lastDate) {
    return { label: "No due date", detail: "" };
  }

  const nextDueDate = addDays(lastDate, 30);
  const daysUntilDue = differenceInCalendarDays(nextDueDate, new Date());

  if (daysUntilDue > 0) {
    return {
      label: `${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"} left`,
      detail: "Next payment is due in 30 days from the last payment.",
    };
  }

  if (daysUntilDue === 0) {
    return { label: "Due today", detail: "The 30-day cycle ends today." };
  }

  const overdueDays = Math.abs(daysUntilDue);
  const overdueMonths = overdueDays >= 30 ? Math.ceil(overdueDays / 30) : 0;

  return {
    label: "Overdue",
    detail:
      overdueMonths > 0
        ? `${overdueMonths} month${overdueMonths === 1 ? "" : "s"} overdue`
        : `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`,
  };
}

function DashboardGrid() {
  const { data, isLoading, error } = usePayments({
    search: "",
    status: "all",
    month: "all",
    page: 1,
  });

  const allPayments = data?.data || [];
  const payments = allPayments.slice(0, 5);
  const successfulPayments = allPayments.filter(
    (payment) => normalizeStatus(payment.status) === "successful",
  );
  const lastPayment = allPayments[0] || null;
  const latestSuccessfulPayment = successfulPayments[0] || null;
  const nextPaymentInfo = getNextPaymentInfo(latestSuccessfulPayment);
  const lastPeriod =
    lastPayment?.month && lastPayment?.year
      ? `${lastPayment.month.charAt(0).toUpperCase() + lastPayment.month.slice(1)}, ${lastPayment.year}`
      : "No period";
  const lastPaymentAmount = lastPayment?.amount ?? 0;

  const successfulPaymentsLast30Days = successfulPayments.filter((payment) => {
    const paymentDate = parsePaymentDate(payment);
    if (!paymentDate) return false;
    const daysSincePayment = differenceInCalendarDays(new Date(), paymentDate);
    return daysSincePayment >= 0 && daysSincePayment <= 30;
  }).length;

  return (
    <div className="bg-transparent py-6">
      <div className="mb-6 flex flex-wrap gap-6">
        <article
          className={`flex min-w-70 md:flex-none flex-1 flex-col justify-between border border-brand-accent/10 p-4 rounded-sm`}>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm text-brand-secondary bg-brand-secondary/8">
              <BanknoteArrowUp />
            </div>
          </div>

          <div className="mt-9">
            <p className="text-sm text-brand-accent/35">
              Last payment ({lastPeriod})
            </p>
            <h3 className="mt-3 text-xl font-medium text-brand-accent">
              {formatCurrency(lastPaymentAmount, "NGN")}
            </h3>
          </div>
        </article>

        <article
          className={`flex min-w-70 md:flex-none flex-1 flex-col justify-between border border-brand-accent/10 p-4 rounded-sm`}>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm text-brand-secondary bg-brand-secondary/8">
              <CalendarClock />
            </div>
            <Link to="/payment">
              <span className="px-2.5 py-1 text-sm text-brand-accent font-semibold flex items-center gap-0.5 cursor-pointer  ">
                Make payment <ArrowUpRight size={16} />
              </span>
            </Link>
          </div>

          <div className="mt-9">
            <p className="text-sm text-brand-accent/35">Next payment due</p>
            <h3 className="mt-3 text-xl font-medium text-brand-accent">
              {nextPaymentInfo.label}
            </h3>
            {nextPaymentInfo.detail ? (
              <p className="mt-1 text-xs text-brand-accent/45">
                {nextPaymentInfo.detail}
              </p>
            ) : null}
          </div>
        </article>

        <article
          className={`flex min-w-70 md:flex-none flex-1 flex-col justify-between border border-brand-accent/10 p-4 rounded-sm`}>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm text-brand-secondary bg-brand-secondary/8">
              <BanknoteArrowUp />
            </div>
            <span className="px-2.5 py-1 text-sm text-brand-accent font-semibold">
              {successfulPaymentsLast30Days} in 30 days
            </span>
          </div>

          <div className="mt-9">
            <p className="text-sm text-brand-accent/35">Successful payments</p>
            <h3 className="mt-3 text-xl font-medium text-brand-accent">
              {successfulPaymentsLast30Days}
            </h3>
            <p className="mt-1 text-xs text-brand-accent/45">
              Successful payments recorded in the last 30 days.
            </p>
          </div>
        </article>
      </div>

      {/* Table */}
      <Table
        data={payments}
        columns={DASHBOARD_HISTORY_COLUMNS}
        responsiveAt="md"
        title="Recent Transactions"
        subtitle="A quick view of your latest waste collection charges."
        renderRow={(row) => (
          <tr className="border-b border-brand-accent/8 transition-colors last:border-b-0 hover:bg-brand-accent/[0.018]">
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
                    : "N/A"}
                </p>
                <p className="text-xs text-brand-accent/50">{row.note}</p>
              </div>
            </td>

            <td className="px-6 py-4 text-right font-medium text-brand-accent">
              {formatCurrency(row.amount, "NGN")}
            </td>

            <td className="px-6 py-4">
              <span
                className={clsx(
                  "inline-flex rounded-full px-3 py-1 text-sm font-medium",
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
            : "N/A";

          return (
            <article className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand-accent">
                    Waste Collection Fee - {periodLabel}
                  </p>
                </div>

                <span
                  className={clsx(
                    "inline-flex shrink-0 rounded-full px-3 py-1 text-sm font-medium",
                    getDashboardStatusClasses(row.status),
                  )}>
                  {row.status}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="text-brand-accent/50">
                    {formatDate(row.createdat)}
                  </p>
                  <p className="mt-1 text-xs text-brand-accent/45">
                    {row.receiptid}
                  </p>
                </div>
                <p className="font-medium text-brand-accent">
                  {formatCurrency(row.amount, "NGN")}
                </p>
              </div>
            </article>
          );
        }}
        actions={
          <Link
            to="/history"
            className="inline-flex items-center gap-1 rounded-sm border border-brand-accent/10 px-3 py-2 text-sm font-medium text-brand-accent transition-colors hover:bg-brand-accent/4">
            View all
          </Link>
        }
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}

export default DashboardGrid;
