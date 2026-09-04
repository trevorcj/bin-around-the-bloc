import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import InputUi from "../../ui/Input";
import DropdownUi from "../../ui/DropdownUi";
import { getEstateResidents, recordManualPayment } from "../../api/adminApi";
import showToast from "../../utils/showToast";

const METHOD_OPTIONS = [
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "Cash", value: "Cash" },
  { label: "POS", value: "POS" },
  { label: "Cheque", value: "Cheque" },
  { label: "Other", value: "Other" },
];

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

function RecordPaymentModal({ isOpen, onClose, estateId }) {
  const queryClient = useQueryClient();

  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const [month, setMonth] = useState(() => {
    const cur = new Date().getMonth();
    return MONTH_OPTIONS[cur]?.value || "august";
  });
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data: residentsData } = useQuery({
    queryKey: ["allEstateResidents", estateId],
    queryFn: () => getEstateResidents(estateId, { limit: 100 }),
    enabled: !!estateId && isOpen,
  });

  const residents = residentsData?.data || [];

  const residentOptions = [
    { label: "-- Select Resident --", value: "" },
    ...residents.map((r) => ({
      label: `${r.fullname} (${r.housenumber ? `House ${r.housenumber}, ` : ""}${r.streetname || ""})`,
      value: r.id,
    })),
  ];

  const mutation = useMutation({
    mutationFn: recordManualPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPayments"] });
      queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
      queryClient.invalidateQueries({ queryKey: ["adminResidents"] });
      onClose();
      setAmount("");
      setReference("");
      setSelectedResidentId("");
    },
    onError: (err) => {
      showToast("error", err.message || "Failed to record payment.");
    },
  });

  function handleSubmit(e) {
    e.preventDefault();

    if (!selectedResidentId) {
      showToast("error", "Please select a resident.");
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast("error", "Please enter a valid payment amount.");
      return;
    }

    mutation.mutate({
      estateId,
      residentId: selectedResidentId,
      amount: numAmount,
      month,
      year,
      paymentMethod,
      reference,
      paymentDate: new Date(paymentDate).toISOString(),
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record External Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-brand-accent/65">
          Record a payment received outside the portal (e.g. direct bank transfer or cash)
          to reconcile resident bills and keep financial ledgers accurate.
        </p>

        <div>
          <label className="block text-sm font-medium text-brand-accent mb-1">
            Resident <span className="text-status-error">*</span>
          </label>
          <DropdownUi
            options={residentOptions}
            value={selectedResidentId}
            onChange={(val) => {
              setSelectedResidentId(val);
              const res = residents.find((r) => r.id === val);
              if (res && res.totalOutstanding > 0 && !amount) {
                setAmount(String(res.totalOutstanding));
              }
            }}
          />
        </div>

        <InputUi
          label="Amount (₦)"
          type="number"
          required
          placeholder="5000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-brand-accent mb-1">
              Payment Method <span className="text-status-error">*</span>
            </label>
            <DropdownUi
              options={METHOD_OPTIONS}
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </div>

          <InputUi
            label="Payment Date"
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-brand-accent mb-1">
              Billing Month
            </label>
            <DropdownUi
              options={MONTH_OPTIONS}
              value={month}
              onChange={setMonth}
            />
          </div>

          <InputUi
            label="Billing Year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>

        <InputUi
          label="Transaction Reference / Note (optional)"
          type="text"
          placeholder="e.g. GTB/TRF/0928372"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-sm border border-brand-accent/10 text-brand-accent hover:bg-brand-accent/5 cursor-pointer">
            Cancel
          </button>
          <Button
            type="submit"
            disabled={mutation.isPending || !selectedResidentId}
            size="small">
            {mutation.isPending ? "Recording…" : "Record Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default RecordPaymentModal;
