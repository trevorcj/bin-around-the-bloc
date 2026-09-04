import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserRound,
  CreditCard,
  History,
  FileText,
  AlertCircle,
  Save,
} from "lucide-react";
import clsx from "clsx";
import Modal from "../../ui/Modal";
import { getResidentDetails, updateResidentOpeningBalance } from "../../api/adminApi";
import formatCurrency from "../../utils/formatCurrency";
import formatDate from "../../utils/formatDate";
import showToast from "../../utils/showToast";
import { downloadReceipt } from "../../utils/receiptUtils";

function AdminResidentDetailModal({ isOpen, onClose, residentId }) {
  const queryClient = useQueryClient();
  const [openingBalInput, setOpeningBalInput] = useState("");
  const [isEditingBal, setIsEditingBal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["residentDetails", residentId],
    queryFn: () => getResidentDetails(residentId),
    enabled: !!residentId && isOpen,
  });

  const resident = data?.profile;
  const bills = data?.bills || [];
  const payments = data?.payments || [];

  const updateBalanceMutation = useMutation({
    mutationFn: (newBal) => updateResidentOpeningBalance(residentId, newBal),
    onSuccess: () => {
      showToast("success", "Opening balance updated successfully.");
      setIsEditingBal(false);
      queryClient.invalidateQueries(["residentDetails", residentId]);
      queryClient.invalidateQueries(["adminResidents"]);
      queryClient.invalidateQueries(["adminOverview"]);
    },
    onError: (err) => {
      showToast("error", err.message || "Failed to update opening balance.");
    },
  });

  function handleSaveBalance() {
    const parsed = Number(openingBalInput);
    if (isNaN(parsed) || parsed < 0) {
      showToast("error", "Please enter a valid non-negative number.");
      return;
    }
    updateBalanceMutation.mutate(parsed);
  }

  if (!isOpen) return null;

  const unpaidBillsSum = bills
    .filter((b) => b.status === "Unpaid")
    .reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const currentOpeningBal = Number(resident?.opening_balance || 0);
  const totalBalanceDue = unpaidBillsSum + currentOpeningBal;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resident Profile & Ledgers">
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-accent/20 border-t-brand-primary mb-3" />
          <p className="text-sm font-medium text-brand-accent/60">
            Loading resident details...
          </p>
        </div>
      )}

      {!isLoading && error && (
        <div className="p-6 text-center text-status-error">
          Failed to load resident details.
        </div>
      )}

      {!isLoading && resident && (
        <div className="space-y-6">
          {/* Identity & Contact Card */}
          <div className="border border-brand-accent/10 rounded-sm p-4 bg-brand-accent/1.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-brand-primary text-white">
                <UserRound size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-accent">
                  {resident.fullname}
                </h3>
                <p className="text-sm text-brand-accent/60">{resident.email}</p>
                {resident.phone && (
                  <p className="text-xs text-brand-accent/50 mt-0.5">
                    {resident.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-accent/40 block">
                Total Outstanding
              </span>
              <span className="text-xl font-bold text-brand-secondary">
                {formatCurrency(totalBalanceDue, "NGN")}
              </span>
            </div>
          </div>

          {/* Property Identity Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-brand-accent/10 p-3 rounded-sm bg-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-accent/40">
                Property Number
              </p>
              <p className="text-sm font-medium text-brand-accent mt-1">
                {resident.housenumber || "N/A"}
              </p>
            </div>

            <div className="border border-brand-accent/10 p-3 rounded-sm bg-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-accent/40">
                Street
              </p>
              <p className="text-sm font-medium text-brand-accent mt-1 truncate">
                {resident.streetname || "N/A"}
              </p>
            </div>

            <div className="border border-brand-accent/10 p-3 rounded-sm bg-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-accent/40">
                Property Category
              </p>
              <p className="text-sm font-medium text-brand-accent mt-1">
                {resident.property_type_name || "House"}
              </p>
            </div>

            <div className="border border-brand-accent/10 p-3 rounded-sm bg-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-accent/40">
                Unit / Apt
              </p>
              <p className="text-sm font-medium text-brand-accent mt-1">
                {resident.apartment || "N/A"}
              </p>
            </div>
          </div>

          {/* Opening Balance (Pre-platform debt management) */}
          <div className="border border-brand-accent/10 rounded-sm p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-brand-accent flex items-center gap-1.5">
                  <AlertCircle size={16} className="text-brand-secondary" />
                  Historical Opening Balance
                </h4>
                <p className="text-xs text-brand-accent/55 mt-0.5">
                  Record historical unpaid waste dues prior to onboarding onto this platform.
                </p>
              </div>

              {!isEditingBal ? (
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-brand-accent text-base">
                    {formatCurrency(currentOpeningBal, "NGN")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpeningBalInput(String(currentOpeningBal));
                      setIsEditingBal(true);
                    }}
                    className="text-xs font-medium text-brand-primary hover:underline cursor-pointer">
                    Edit
                  </button>
                </div>
              ) : null}
            </div>

            {isEditingBal && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  value={openingBalInput}
                  onChange={(e) => setOpeningBalInput(e.target.value)}
                  placeholder="e.g. 10000"
                  className="h-10 w-44 rounded-sm border border-brand-accent/20 px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveBalance}
                  disabled={updateBalanceMutation.isPending}
                  className="h-10 px-4 rounded-sm bg-brand-primary text-white text-xs font-medium flex items-center gap-1 hover:bg-brand-primary/90 cursor-pointer">
                  <Save size={14} />
                  {updateBalanceMutation.isPending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBal(false)}
                  className="h-10 px-3 rounded-sm border border-brand-accent/10 text-xs text-brand-accent hover:bg-brand-accent/5 cursor-pointer">
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Bills Ledger (Snapshot Protection) */}
          <div className="border border-brand-accent/10 rounded-sm p-4 bg-white">
            <h4 className="text-sm font-semibold text-brand-accent mb-3 flex items-center gap-1.5">
              <CreditCard size={16} className="text-brand-primary" />
              Monthly Bills History
            </h4>

            {bills.length === 0 ? (
              <p className="text-xs text-brand-accent/45 py-2">
                No bills generated for this resident yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-brand-accent/10 text-brand-accent/50 uppercase tracking-wider">
                    <tr>
                      <th className="py-2">Period</th>
                      <th className="py-2">Description</th>
                      <th className="py-2 text-right">Amount</th>
                      <th className="py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-accent/5">
                    {bills.map((b) => (
                      <tr key={b.id} className="hover:bg-brand-accent/2">
                        <td className="py-2.5 font-medium text-brand-accent">
                          {b.month
                            ? `${b.month.charAt(0).toUpperCase() + b.month.slice(1)}, ${b.year}`
                            : "N/A"}
                        </td>
                        <td className="py-2.5 text-brand-accent/70">
                          {b.description}
                        </td>
                        <td className="py-2.5 text-right font-medium text-brand-accent">
                          {formatCurrency(b.amount, "NGN")}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={clsx(
                              "inline-flex rounded-full px-2 py-0.5 font-semibold text-[11px]",
                              b.status === "Paid"
                                ? "bg-status-success/10 text-status-success"
                                : "bg-status-warning/10 text-status-warning"
                            )}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="border border-brand-accent/10 rounded-sm p-4 bg-white">
            <h4 className="text-sm font-semibold text-brand-accent mb-3 flex items-center gap-1.5">
              <History size={16} className="text-brand-primary" />
              Settled Payments
            </h4>

            {payments.length === 0 ? (
              <p className="text-xs text-brand-accent/45 py-2">
                No payments recorded for this resident yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-brand-accent/10 text-brand-accent/50 uppercase tracking-wider">
                    <tr>
                      <th className="py-2">Date</th>
                      <th className="py-2">Period</th>
                      <th className="py-2">Method</th>
                      <th className="py-2">Reference</th>
                      <th className="py-2 text-right">Amount</th>
                      <th className="py-2 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-accent/5">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-brand-accent/2">
                        <td className="py-2.5 font-medium text-brand-accent">
                          {formatDate(p.createdat)}
                        </td>
                        <td className="py-2.5 text-brand-accent/70">
                          {p.month
                            ? `${p.month.charAt(0).toUpperCase() + p.month.slice(1)}, ${p.year}`
                            : "N/A"}
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-sm bg-brand-accent/5 text-[11px] font-medium text-brand-accent">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-brand-accent/60 truncate max-w-28">
                          {p.reference || p.receiptid}
                        </td>
                        <td className="py-2.5 text-right font-medium text-brand-accent">
                          {formatCurrency(p.amount, "NGN")}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => downloadReceipt(p)}
                            title="Download Receipt"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-primary hover:underline cursor-pointer">
                            <FileText size={13} /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default AdminResidentDetailModal;
