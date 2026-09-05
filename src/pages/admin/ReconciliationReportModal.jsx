import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  FileSpreadsheet,
  Loader2,
  Filter,
} from "lucide-react";
import clsx from "clsx";
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

  const allCount = records.length;
  const paidCountTotal = records.filter((r) => r.status === "Paid").length;
  const unpaidCountTotal = records.filter((r) => r.status === "Unpaid").length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-5xl"
      title="Estate Reconciliation & Billing Reports">
      <div className="space-y-5">
        <p className="text-xs text-brand-accent/70 -mt-2">
          Monthly statement of collection compliance and outstanding dues for estate management and waste disposal contractors.
        </p>

        <div className="rounded-sm border border-brand-accent/10 bg-white p-3.5 sm:p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-accent/60 uppercase tracking-wider mb-2.5">
            <Filter size={14} className="text-brand-primary" />
            <span>Select Billing Period & Scope</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-brand-accent/60 mb-1">
                Month
              </label>
              <DropdownUi
                options={MONTH_OPTIONS}
                value={month}
                onChange={setMonth}
                buttonClassName="bg-stone-50 border-brand-accent/10"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-brand-accent/60 mb-1">
                Year
              </label>
              <DropdownUi
                options={YEAR_OPTIONS}
                value={year}
                onChange={setYear}
                buttonClassName="bg-stone-50 border-brand-accent/10"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-brand-accent/60 mb-1">
                Street
              </label>
              <DropdownUi
                options={streetOptions}
                value={streetFilter}
                onChange={setStreetFilter}
                buttonClassName="bg-stone-50 border-brand-accent/10"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-brand-accent/60 mb-1">
                Property Category
              </label>
              <DropdownUi
                options={propertyTypeOptions}
                value={propertyTypeFilter}
                onChange={setPropertyTypeFilter}
                buttonClassName="bg-stone-50 border-brand-accent/10"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-brand-accent/60 gap-2">
            <Loader2 className="size-5 animate-spin text-brand-primary" />
            Loading reconciliation records for {periodText}...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-sm border border-brand-accent/10 bg-white p-3.5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-brand-accent/50">
                  Total Expected
                </p>
                <p className="mt-1 text-xl font-bold text-brand-accent truncate">
                  {formatCurrency(summary.totalExpected, "NGN")}
                </p>
                <p className="mt-0.5 text-[11px] text-brand-accent/50">
                  {summary.totalResidents} properties billed
                </p>
              </div>

              <div className="rounded-sm border border-brand-accent/10 bg-white p-3.5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">
                  Settled Collections
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-700 truncate">
                  {formatCurrency(summary.totalCollected, "NGN")}
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-700/80">
                  {summary.paidCount} properties paid
                </p>
              </div>

              <div className="rounded-sm border border-brand-accent/10 bg-white p-3.5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-rose-700">
                  Outstanding Dues
                </p>
                <p className="mt-1 text-xl font-bold text-rose-700 truncate">
                  {formatCurrency(summary.totalOutstanding, "NGN")}
                </p>
                <p className="mt-0.5 text-[11px] text-rose-700/80">
                  {summary.unpaidCount} properties unpaid
                </p>
              </div>

              <div className="rounded-sm border border-brand-accent/10 bg-white p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-brand-accent/50">
                    Collection Rate
                  </p>
                  <span className="text-xs font-bold text-brand-accent">
                    {summary.paidPercentage}%
                  </span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 mt-2.5 overflow-hidden">
                  <div
                    className="bg-brand-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${summary.paidPercentage}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-brand-accent/50">
                  {summary.paidCount} of {summary.totalResidents} settled
                </p>
              </div>
            </div>

            <div className="rounded-sm border border-brand-accent/10 bg-white overflow-hidden shadow-xs">
              <div className="p-3 bg-stone-50 border-b border-brand-accent/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-sm bg-brand-accent/5 p-0.5">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={clsx(
                      "px-3 py-1 text-xs font-semibold rounded-xs transition-all cursor-pointer",
                      statusFilter === "all"
                        ? "bg-white text-brand-accent shadow-xs"
                        : "text-brand-accent/60 hover:text-brand-accent"
                    )}>
                    All ({allCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("paid")}
                    className={clsx(
                      "px-3 py-1 text-xs font-semibold rounded-xs transition-all cursor-pointer",
                      statusFilter === "paid"
                        ? "bg-white text-emerald-800 shadow-xs"
                        : "text-brand-accent/60 hover:text-brand-accent"
                    )}>
                    Paid ({paidCountTotal})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("unpaid")}
                    className={clsx(
                      "px-3 py-1 text-xs font-semibold rounded-xs transition-all cursor-pointer",
                      statusFilter === "unpaid"
                        ? "bg-white text-rose-800 shadow-xs"
                        : "text-brand-accent/60 hover:text-brand-accent"
                    )}>
                    Unpaid ({unpaidCountTotal})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportFilteredPdf}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-sm bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors cursor-pointer shadow-xs">
                    <FileText size={14} />
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportFilteredCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-brand-accent/15 bg-white text-brand-accent hover:bg-brand-accent/5 transition-colors cursor-pointer">
                    <FileSpreadsheet size={14} />
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {filteredRecords.length === 0 ? (
                  <p className="p-8 text-center text-xs text-brand-accent/50">
                    No resident properties match the selected filters.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-50/80 border-b border-brand-accent/10 sticky top-0 text-[11px] font-semibold text-brand-accent/70">
                      <tr>
                        <th className="py-2.5 px-3.5">Street</th>
                        <th className="py-2.5 px-3">House / Plot</th>
                        <th className="py-2.5 px-3.5">Resident</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3.5 text-right">Expected</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3.5 text-right">Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent/8">
                      {filteredRecords.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-brand-accent/[0.015] transition-colors">
                          <td className="py-2.5 px-3.5 font-medium text-brand-accent">
                            {row.street_name}
                          </td>
                          <td className="py-2.5 px-3 text-brand-accent/70">
                            {row.house_number ? `House ${row.house_number}` : "-"}
                          </td>
                          <td className="py-2.5 px-3.5 text-brand-accent">
                            {row.fullname}
                          </td>
                          <td className="py-2.5 px-3 text-brand-accent/60">
                            {row.property_type_name}
                          </td>
                          <td className="py-2.5 px-3.5 text-right text-brand-accent font-medium">
                            {formatCurrency(row.expected_fee, "NGN")}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                row.status === "Paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-medium">
                            <span
                              className={
                                row.status === "Paid"
                                  ? "text-emerald-700 font-semibold"
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

        <div className="flex items-center justify-between pt-2 border-t border-brand-accent/10 text-xs text-brand-accent/50">
          <span>
            {periodText} • {summary.totalResidents} properties in current view
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-sm border border-brand-accent/15 text-brand-accent hover:bg-brand-accent/5 transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ReconciliationReportModal;