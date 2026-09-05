import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Download, FileText } from "lucide-react";
import clsx from "clsx";
import useAuth from "../../hooks/useAuth";
import { getEstatePayments } from "../../api/adminApi";
import { StyledH1 } from "../../styles/CommonStyles";
import Table from "../../ui/Table";
import DropdownUi from "../../ui/DropdownUi";
import Pagination from "../../ui/Pagination";
import RecordPaymentModal from "./RecordPaymentModal";
import formatCurrency from "../../utils/formatCurrency";
import formatDate from "../../utils/formatDate";
import useDebounce from "../../hooks/useDebounce";
import { downloadReceipt, downloadCsv } from "../../utils/receiptUtils";
import ReconciliationReportModal from "./ReconciliationReportModal";

const PAYMENT_COLUMNS = [
  { key: "resident", label: "Resident / Address" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "date", label: "Date" },
  { key: "method", label: "Method" },
  { key: "reference", label: "Reference" },
  { key: "recordedBy", label: "Recorded By" },
  { key: "status", label: "Status" },
  { key: "receipt", label: "", className: "w-10 text-right" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Successful", value: "successful" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
];

const MONTH_OPTIONS = [
  { label: "All Months", value: "all" },
  { label: "January", value: "january" },
  { label: "February", value: "february" },
  { label: "March", value: "march" },
  { label: "April", value: "april" },
  { label: "May", value: "may" },
  { label: "June", value: "june" },
  { label: "July", value: "july" },
  { label: "August", value: "august" },
  { label: "September", value: "september" },
  { label: "October", value: "october" },
  { label: "November", value: "november" },
  { label: "December", value: "december" },
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

function AdminPayments() {
  const { user } = useAuth();
  const estateId = user?.estate_id;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [month, setMonth] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminPayments", estateId, debouncedSearch, status, month, currentPage],
    queryFn: () =>
      getEstatePayments(estateId, {
        search: debouncedSearch,
        status,
        month,
        page: currentPage,
        limit: 10,
      }),
    enabled: !!estateId,
  });

  const payments = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;
  const itemsPerPage = data?.itemsPerPage || 10;

  function handleExportCsv() {
    if (payments.length === 0) return;

    const exportData = payments.map((p) => ({
      receiptId: p.receiptid,
      resident: p.fullname,
      email: p.email,
      address: p.address,
      amount: formatCurrency(p.amount, "NGN"),
      date: formatDate(p.createdat),
      method: p.paymentMethod || "Paystack",
      reference: p.reference || p.receiptid,
      recordedBy: p.recorded_by || "resident",
      status: p.status,
    }));

    downloadCsv(exportData, "estate_payments_ledger.csv", [
      { key: "receiptId", label: "Receipt ID" },
      { key: "resident", label: "Resident Name" },
      { key: "email", label: "Email" },
      { key: "address", label: "Address" },
      { key: "amount", label: "Amount" },
      { key: "date", label: "Payment Date" },
      { key: "method", label: "Payment Method" },
      { key: "reference", label: "Reference" },
      { key: "recordedBy", label: "Recorded By" },
      { key: "status", label: "Status" },
    ]);
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <StyledH1>Estate Payments Ledger</StyledH1>
          <p className="text-brand-accent/80 mt-1">
            Monitor verified online Paystack payments and record manual external bank transfers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-brand-accent/15 bg-white px-4 py-2.5 text-sm font-semibold text-brand-accent shadow-xs hover:bg-brand-accent/5 transition-colors cursor-pointer">
            <FileText size={18} /> Reconciliation Reports
          </button>

          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-primary/95 transition-colors cursor-pointer">
            <Plus size={18} /> Record External Payment
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-white p-4 border border-brand-accent/10 rounded-sm">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-accent/40"
          />
          <input
            type="search"
            placeholder="Search by receipt ID, resident, address, or reference…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full rounded-sm border border-brand-accent/10 bg-brand-accent/3 px-3 pr-10 text-sm text-brand-accent placeholder:text-brand-accent/40 focus:border-brand-accent/25 focus:outline-none"
          />
        </div>

        <div className="w-full lg:w-44 min-w-0">
          <DropdownUi
            options={STATUS_OPTIONS}
            value={status}
            onChange={(val) => {
              setStatus(val);
              setCurrentPage(1);
            }}
            buttonClassName="bg-white"
          />
        </div>

        <div className="w-full lg:w-44 min-w-0">
          <DropdownUi
            options={MONTH_OPTIONS}
            value={month}
            onChange={(val) => {
              setMonth(val);
              setCurrentPage(1);
            }}
            buttonClassName="bg-white"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-brand-accent/10 px-4 text-sm font-medium text-brand-accent hover:bg-brand-accent/5 transition-colors cursor-pointer">
            <FileText size={16} /> Reports
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-brand-accent/10 px-4 text-sm font-medium text-brand-accent hover:bg-brand-accent/5 transition-colors cursor-pointer">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <Table
        data={payments}
        columns={PAYMENT_COLUMNS}
        responsiveAt="md"
        emptyState="No payments recorded yet."
        isLoading={isLoading}
        error={error}
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="payments"
          />
        }
        renderRow={(row) => (
          <tr
            key={row.id}
            className="border-b border-brand-accent/8 transition-colors last:border-b-0 hover:bg-brand-accent/[0.018]">
            <td className="px-6 py-4">
              <div className="space-y-0.5">
                <p className="font-semibold text-brand-accent">{row.fullname}</p>
                <p className="text-xs text-brand-accent/50">{row.address}</p>
              </div>
            </td>

            <td className="px-6 py-4 text-right font-semibold text-brand-accent">
              {formatCurrency(row.amount, "NGN")}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-accent/80">
              {formatDate(row.createdat)}
            </td>

            <td className="px-6 py-4">
              <span
                className={clsx(
                  "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-sm",
                  row.paymentMethod?.toLowerCase().includes("paystack")
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "bg-brand-secondary/10 text-brand-secondary"
                )}>
                {row.paymentMethod || "Paystack"}
              </span>
            </td>

            <td className="px-6 py-4 font-mono text-xs text-brand-accent/60 truncate max-w-36">
              {row.reference || row.receiptid}
            </td>

            <td className="px-6 py-4">
              <span className="text-xs font-medium text-brand-accent/70 capitalize">
                {row.recorded_by || "Resident"}
              </span>
            </td>

            <td className="px-6 py-4">
              <span
                className={clsx(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                  getStatusClasses(row.status)
                )}>
                {row.status}
              </span>
            </td>

            <td className="px-6 py-4 text-right">
              <button
                type="button"
                onClick={() => downloadReceipt(row)}
                title="Download Receipt"
                className="p-1.5 rounded-sm hover:bg-brand-accent/5 text-brand-accent/60 hover:text-brand-primary transition-colors cursor-pointer">
                <FileText size={16} />
              </button>
            </td>
          </tr>
        )}
        renderCard={(row) => (
          <article key={row.id} className="p-4 space-y-3 border-b border-brand-accent/8 last:border-b-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-brand-accent">{row.fullname}</p>
                <p className="text-xs text-brand-accent/50">{row.address}</p>
              </div>
              <span
                className={clsx(
                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                  getStatusClasses(row.status)
                )}>
                {row.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-brand-accent/60">
              <span>
                {formatDate(row.createdat)} • {row.paymentMethod} ({row.recorded_by || "resident"})
              </span>
              <span className="font-bold text-sm text-brand-accent">
                {formatCurrency(row.amount, "NGN")}
              </span>
            </div>
          </article>
        )}
      />

      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        estateId={estateId}
      />

      <ReconciliationReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        estateId={estateId}
      />
    </div>
  );
}

export default AdminPayments;
