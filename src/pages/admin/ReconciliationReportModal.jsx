import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Modal from "../../ui/Modal";
import DropdownUi from "../../ui/DropdownUi";
import { getEstateReconciliation } from "../../api/adminApi";
import {
  downloadReconciliationPdf,
  downloadReconciliationCsv,
} from "../../utils/reportUtils";
import formatCurrency from "../../utils/formatCurrency";
import showToast from "../../utils/showToast";

const MONTH_OPTIONS = [
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

const YEAR_OPTIONS = [
  { label: "2026", value: "2026" },
  { label: "2027", value: "2027" },
  { label: "2028", value: "2028" },
  { label: "2029", value: "2029" },
  { label: "2030", value: "2030" },
];

const STATUS_FILTER_OPTIONS = [
  { label: "All Payment Status", value: "all" },
  { label: "Paid Only", value: "paid" },
  { label: "Unpaid Only", value: "unpaid" },
];

function ReconciliationReportModal({ isOpen, onClose, estateId }) {
  const [month, setMonth] = useState(() => {
    const currentMonth = new Date().getMonth();
    return MONTH_OPTIONS[currentMonth]?.value || "january";
  });
  const [year, setYear] = useState(() => {
    return new Date().getFullYear().toString();
  });
  const [streetFilter, setStreetFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["estateReconciliation", estateId, month, year],
    queryFn: () => getEstateReconciliation(estateId, { month, year }),
    enabled: isOpen && !!estateId,
  });

  const { estate, streets = [], propertyTypes = [], records = [] } = data || {};

  const streetOptions = [
    { label: "All Streets", value: "all" },
    ...streets.map((s) => ({ label: s.name, value: s.id })),
  ];

  const propertyTypeOptions = [
    { label: "All Property Types", value: "all" },
    ...propertyTypes.map((pt) => ({ label: pt.name, value: pt.id })),
  ];

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (
        streetFilter !== "all" &&
        r.street_id !== streetFilter &&
        r.street_name !== streetFilter
      ) {
        return false;
      }
      if (statusFilter === "paid" && r.status !== "Paid") {
        return false;
      }
      if (statusFilter === "unpaid" && r.status !== "Unpaid") {
        return false;
      }
      if (
        propertyTypeFilter !== "all" &&
        r.property_type_id !== propertyTypeFilter &&
        r.property_type_name !== propertyTypeFilter
      ) {
        return false;
      }
      return true;
    });
  }, [records, streetFilter, statusFilter, propertyTypeFilter]);

  const summary = useMemo(() => {
    const totalResidents = filteredRecords.length;
    const paidCount = filteredRecords.filter((r) => r.status === "Paid").length;
    const unpaidCount = totalResidents - paidCount;
    const paidPercentage =
      totalResidents > 0 ? Math.round((paidCount / totalResidents) * 100) : 0;
    const unpaidPercentage =
      totalResidents > 0 ? Math.round((unpaidCount / totalResidents) * 100) : 0;
    const totalExpected = filteredRecords.reduce(
      (acc, r) => acc + (Number(r.expected_fee) || 0),
      0
    );
    const totalCollected = filteredRecords.reduce(
      (acc, r) => acc + (Number(r.paid_amount) || 0),
      0
    );
    const totalOutstanding = Math.max(0, totalExpected - totalCollected);

    return {
      totalResidents,
      paidCount,
      unpaidCount,
      paidPercentage,
      unpaidPercentage,
      totalExpected,
      totalCollected,
      totalOutstanding,
    };
  }, [filteredRecords]);

  const periodText = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;

  function getFilterDescription() {
    const parts = [];
    if (streetFilter !== "all") {
      const st = streets.find((s) => s.id === streetFilter);
      parts.push(`Street: ${st?.name || streetFilter}`);
    }
    if (statusFilter !== "all") {
      parts.push(`Status: ${statusFilter === "paid" ? "Paid Only" : "Unpaid Only"}`);
    }
    if (propertyTypeFilter !== "all") {
      const pt = propertyTypes.find((p) => p.id === propertyTypeFilter);
      parts.push(`Category: ${pt?.name || propertyTypeFilter}`);
    }
    return parts.length > 0 ? parts.join(" | ") : "All Estate Properties";
  }

  function handleExportFilteredPdf() {
    if (filteredRecords.length === 0) {
      showToast("error", "No records found matching current filters.");
      return;
    }
    downloadReconciliationPdf({
      estate,
      periodText,
      rows: filteredRecords,
      summary,
      filterDescription: getFilterDescription(),
    });
    showToast("success", "Reconciliation PDF generated successfully.");
  }

  function handleExportFilteredCsv() {
    if (filteredRecords.length === 0) {
      showToast("error", "No records found matching current filters.");
      return;
    }
    downloadReconciliationCsv({
      estate,
      periodText,
      rows: filteredRecords,
    });
    showToast("success", "Reconciliation CSV exported successfully.");
  }

  function handleExportUnpaid(format = "pdf") {
    const unpaidRows = records.filter((r) => r.status === "Unpaid");
    if (unpaidRows.length === 0) {
      showToast("info", "All residents have settled for this period! No unpaid records.");
      return;
    }

    const unpaidExpected = unpaidRows.reduce(
      (acc, r) => acc + (Number(r.expected_fee) || 0),
      0
    );

    const unpaidSummary = {
      totalResidents: unpaidRows.length,
      paidCount: 0,
      unpaidCount: unpaidRows.length,
      paidPercentage: 0,
      unpaidPercentage: 100,
      totalExpected: unpaidExpected,
      totalCollected: 0,
      totalOutstanding: unpaidExpected,
    };

    if (format === "pdf") {
      downloadReconciliationPdf({
        estate,
        periodText,
        rows: unpaidRows,
        summary: unpaidSummary,
        filterDescription: "Unpaid Residents (Collection Follow-up)",
      });
      showToast("success", "Unpaid residents PDF exported.");
    } else {
      downloadReconciliationCsv({
        estate,
        periodText: `${periodText} (Unpaid)`,
        rows: unpaidRows,
      });
      showToast("success", "Unpaid residents CSV exported.");
    }
  }

  function handleExportPaid(format = "pdf") {
    const paidRows = records.filter((r) => r.status === "Paid");
    if (paidRows.length === 0) {
      showToast("info", "No verified payments found for this period.");
      return;
    }

    const paidCollected = paidRows.reduce(
      (acc, r) => acc + (Number(r.paid_amount) || 0),
      0
    );

    const paidSummary = {
      totalResidents: paidRows.length,
      paidCount: paidRows.length,
      unpaidCount: 0,
      paidPercentage: 100,
      unpaidPercentage: 0,
      totalExpected: paidCollected,
      totalCollected: paidCollected,
      totalOutstanding: 0,
    };

    if (format === "pdf") {
      downloadReconciliationPdf({
        estate,
        periodText,
        rows: paidRows,
        summary: paidSummary,
        filterDescription: "Paid Residents (Waste Pickup Clearance)",
      });
      showToast("success", "Paid residents PDF exported.");
    } else {
      downloadReconciliationCsv({
        estate,
        periodText: `${periodText} (Paid)`,
        rows: paidRows,
      });
      showToast("success", "Paid residents CSV exported.");
    }
  }

  function handleFullReport(format = "pdf") {
    if (records.length === 0) {
      showToast("error", "No resident records found in this estate.");
      return;
    }

    const fullExpected = records.reduce(
      (acc, r) => acc + (Number(r.expected_fee) || 0),
      0
    );
    const fullCollected = records.reduce(
      (acc, r) => acc + (Number(r.paid_amount) || 0),
      0
    );
    const fullPaidCount = records.filter((r) => r.status === "Paid").length;
    const fullUnpaidCount = records.length - fullPaidCount;

    const fullSummary = {
      totalResidents: records.length,
      paidCount: fullPaidCount,
      unpaidCount: fullUnpaidCount,
      paidPercentage: Math.round((fullPaidCount / records.length) * 100),
      unpaidPercentage: Math.round((fullUnpaidCount / records.length) * 100),
      totalExpected: fullExpected,
      totalCollected: fullCollected,
      totalOutstanding: Math.max(0, fullExpected - fullCollected),
    };

    if (format === "pdf") {
      downloadReconciliationPdf({
        estate,
        periodText,
        rows: records,
        summary: fullSummary,
        filterDescription: "Full Estate Billing Report (All Streets & Properties)",
      });
      showToast("success", "Full reconciliation PDF exported.");
    } else {
      downloadReconciliationCsv({
        estate,
        periodText,
        rows: records,
      });
      showToast("success", "Full reconciliation CSV exported.");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
      title="Estate Reconciliation & Billing Reports">
      <div className="space-y-6">
        <p className="text-xs text-brand-accent/70 -mt-2">
          Generate comprehensive waste-collection reconciliation statements sorted by street and property number. Formatted for the estate administration and official waste management contractors.
        </p>

        <div className="rounded-sm border border-brand-accent/10 bg-brand-accent/[0.02] p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Billing Period & Reconciliation Filters
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-accent/80 mb-1">
                Month
              </label>
              <DropdownUi
                options={MONTH_OPTIONS}
                value={month}
                onChange={setMonth}
                buttonClassName="bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-accent/80 mb-1">
                Year
              </label>
              <DropdownUi
                options={YEAR_OPTIONS}
                value={year}
                onChange={setYear}
                buttonClassName="bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-accent/80 mb-1">
                Street
              </label>
              <DropdownUi
                options={streetOptions}
                value={streetFilter}
                onChange={setStreetFilter}
                buttonClassName="bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-accent/80 mb-1">
                Status
              </label>
              <DropdownUi
                options={STATUS_FILTER_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
                buttonClassName="bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-accent/80 mb-1">
                Category
              </label>
              <DropdownUi
                options={propertyTypeOptions}
                value={propertyTypeFilter}
                onChange={setPropertyTypeFilter}
                buttonClassName="bg-white"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-sm text-brand-accent/60 gap-2">
            <Loader2 className="size-4 animate-spin text-brand-primary" />
            Loading reconciliation records for {periodText}...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="rounded-sm border border-brand-accent/10 bg-white p-3">
                <div className="flex items-center gap-1.5 text-xs text-brand-accent/60">
                  <Users size={14} className="text-brand-primary shrink-0" />
                  <span>Residents</span>
                </div>
                <p className="mt-1 text-lg font-bold text-brand-accent">
                  {summary.totalResidents}
                </p>
                <p className="text-[10px] text-brand-accent/40">In current filter</p>
              </div>

              <div className="rounded-sm border border-emerald-200 bg-emerald-50/40 p-3">
                <div className="flex items-center gap-1.5 text-xs text-emerald-800">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Paid</span>
                </div>
                <p className="mt-1 text-lg font-bold text-emerald-700">
                  {summary.paidCount}
                </p>
                <p className="text-[10px] text-emerald-600/80">
                  {summary.paidPercentage}% compliance
                </p>
              </div>

              <div className="rounded-sm border border-rose-200 bg-rose-50/40 p-3">
                <div className="flex items-center gap-1.5 text-xs text-rose-800">
                  <XCircle size={14} className="text-rose-600 shrink-0" />
                  <span>Unpaid</span>
                </div>
                <p className="mt-1 text-lg font-bold text-rose-700">
                  {summary.unpaidCount}
                </p>
                <p className="text-[10px] text-rose-600/80">
                  {summary.unpaidPercentage}% pending
                </p>
              </div>

              <div className="rounded-sm border border-brand-accent/10 bg-white p-3">
                <div className="flex items-center gap-1.5 text-xs text-brand-accent/60">
                  <TrendingUp size={14} className="text-brand-accent/50 shrink-0" />
                  <span>Expected</span>
                </div>
                <p className="mt-1 text-base font-bold text-brand-accent truncate">
                  {formatCurrency(summary.totalExpected, "NGN")}
                </p>
                <p className="text-[10px] text-brand-accent/40">Total billed</p>
              </div>

              <div className="rounded-sm border border-emerald-200 bg-emerald-50/40 p-3">
                <div className="flex items-center gap-1.5 text-xs text-emerald-800">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Collected</span>
                </div>
                <p className="mt-1 text-base font-bold text-emerald-700 truncate">
                  {formatCurrency(summary.totalCollected, "NGN")}
                </p>
                <p className="text-[10px] text-emerald-600/80">Settled to estate</p>
              </div>

              <div className="rounded-sm border border-rose-200 bg-rose-50/40 p-3">
                <div className="flex items-center gap-1.5 text-xs text-rose-800">
                  <AlertCircle size={14} className="text-rose-600 shrink-0" />
                  <span>Outstanding</span>
                </div>
                <p className="mt-1 text-base font-bold text-rose-700 truncate">
                  {formatCurrency(summary.totalOutstanding, "NGN")}
                </p>
                <p className="text-[10px] text-rose-600/80">Uncollected fees</p>
              </div>
            </div>

            <div className="rounded-sm border border-brand-accent/10 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
                  Quick Actions (One-Click Exports)
                </h4>
                <span className="text-xs text-brand-accent/50">
                  {filteredRecords.length} properties matching filters
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-sm border border-brand-accent/10 bg-brand-accent/[0.02] p-3 space-y-2.5">
                  <div>
                    <p className="text-xs font-bold text-brand-accent">Full Billing Report</p>
                    <p className="text-[11px] text-brand-accent/60">
                      Complete report of all residents ({records.length}) with summary cards.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleFullReport("pdf")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm bg-brand-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-primary/95 cursor-pointer shadow-xs">
                      <FileText size={13} /> PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFullReport("csv")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm border border-brand-accent/15 bg-white px-2.5 py-1.5 text-xs font-medium text-brand-accent hover:bg-brand-accent/5 cursor-pointer">
                      <FileSpreadsheet size={13} /> CSV
                    </button>
                  </div>
                </div>

                <div className="rounded-sm border border-rose-200 bg-rose-50/30 p-3 space-y-2.5">
                  <div>
                    <p className="text-xs font-bold text-rose-800">Export Unpaid Residents</p>
                    <p className="text-[11px] text-rose-700/70">
                      Street-sorted list of defaulters for waste collection cutoff / enforcement.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleExportUnpaid("pdf")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer shadow-xs">
                      <FileText size={13} /> PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportUnpaid("csv")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm border border-rose-300 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-50 cursor-pointer">
                      <FileSpreadsheet size={13} /> CSV
                    </button>
                  </div>
                </div>

                <div className="rounded-sm border border-emerald-200 bg-emerald-50/30 p-3 space-y-2.5">
                  <div>
                    <p className="text-xs font-bold text-emerald-800">Export Paid Residents</p>
                    <p className="text-[11px] text-emerald-700/70">
                      Street-sorted manifest of cleared properties for pickup stickers.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleExportPaid("pdf")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer shadow-xs">
                      <FileText size={13} /> PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportPaid("csv")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 cursor-pointer">
                      <FileSpreadsheet size={13} /> CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-brand-accent/10 bg-white overflow-hidden">
              <div className="px-4 py-3 bg-brand-accent/[0.02] border-b border-brand-accent/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-accent">
                  Filtered Preview ({filteredRecords.length} properties)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportFilteredPdf}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-sm bg-brand-primary text-white hover:bg-brand-primary/95 cursor-pointer">
                    <Download size={13} /> Download Filtered PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportFilteredCsv}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-sm border border-brand-accent/15 hover:bg-brand-accent/5 cursor-pointer">
                    <FileSpreadsheet size={13} /> CSV
                  </button>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto">
                {filteredRecords.length === 0 ? (
                  <p className="p-6 text-center text-xs text-brand-accent/50">
                    No resident properties match the selected filters.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-50 border-b border-brand-accent/10 sticky top-0 text-[11px] font-semibold text-brand-accent/70">
                      <tr>
                        <th className="py-2 px-3">Street</th>
                        <th className="py-2 px-3">House #</th>
                        <th className="py-2 px-3">Resident</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Expected</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-right">Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent/8">
                      {filteredRecords.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-brand-accent/[0.015] transition-colors">
                          <td className="py-2 px-3 font-medium text-brand-accent">
                            {row.street_name}
                          </td>
                          <td className="py-2 px-3 text-brand-accent/70">
                            {row.house_number ? `House ${row.house_number}` : "-"}
                          </td>
                          <td className="py-2 px-3 text-brand-accent">
                            {row.fullname}
                          </td>
                          <td className="py-2 px-3 text-brand-accent/60">
                            {row.property_type_name}
                          </td>
                          <td className="py-2 px-3 text-right text-brand-accent font-medium">
                            {formatCurrency(row.expected_fee, "NGN")}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                row.status === "Paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            <span
                              className={
                                row.status === "Paid"
                                  ? "text-emerald-700"
                                  : "text-brand-accent/40"
                              }>
                              {formatCurrency(row.paid_amount, "NGN")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-brand-accent/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-sm border border-brand-accent/15 text-brand-accent hover:bg-brand-accent/5 cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ReconciliationReportModal;