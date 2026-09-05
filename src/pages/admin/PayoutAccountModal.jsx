import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import InputUi from "../../ui/Input";
import DropdownUi from "../../ui/DropdownUi";
import {
  getNigerianBanks,
  resolveBankAccount,
  connectPayoutAccount,
} from "../../api/adminApi";
import showToast from "../../utils/showToast";

function PayoutAccountForm({
  estateId,
  currentPayoutAccount,
  isEditing,
  onClose,
}) {
  const queryClient = useQueryClient();

  const [selectedBankCode, setSelectedBankCode] = useState(
    isEditing && currentPayoutAccount ? currentPayoutAccount.payout_bank_code || "" : ""
  );
  const [accountNumber, setAccountNumber] = useState(
    isEditing && currentPayoutAccount ? currentPayoutAccount.payout_account_number || "" : ""
  );
  const [resolvedAccountName, setResolvedAccountName] = useState(
    isEditing && currentPayoutAccount ? currentPayoutAccount.payout_account_name || "" : ""
  );
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const { data: banks = [], isLoading: banksLoading } = useQuery({
    queryKey: ["nigerianBanks"],
    queryFn: getNigerianBanks,
    staleTime: 1000 * 60 * 60,
  });

  const bankOptions = [
    { label: "-- Select Bank --", value: "" },
    ...banks.map((b) => ({
      label: b.name,
      value: b.code,
    })),
  ];

  useEffect(() => {
    let active = true;

    async function handleResolve() {
      const cleanAcc = accountNumber.trim();
      if (!selectedBankCode || cleanAcc.length !== 10) {
        setResolvedAccountName("");
        setResolveError("");
        return;
      }

      setIsResolving(true);
      setResolveError("");
      setResolvedAccountName("");

      try {
        const result = await resolveBankAccount(cleanAcc, selectedBankCode);
        if (active && result?.account_name) {
          setResolvedAccountName(result.account_name);
        }
      } catch (err) {
        if (active) {
          setResolveError(
            err.message || "Could not resolve account name. Check parameters or try again."
          );
        }
      } finally {
        if (active) {
          setIsResolving(false);
        }
      }
    }

    const timer = setTimeout(handleResolve, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [accountNumber, selectedBankCode]);

  const mutation = useMutation({
    mutationFn: connectPayoutAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estatePayoutAccount", estateId] });
      queryClient.invalidateQueries({ queryKey: ["estateSettings", estateId] });
      queryClient.invalidateQueries({ queryKey: ["adminOverview", estateId] });

      showToast(
        "success",
        isEditing
          ? "Payout account updated successfully."
          : "Payout account connected successfully!"
      );
      onClose();
    },
    onError: (err) => {
      showToast("error", err.message || "Could not connect payout account.");
    },
  });

  function handleSubmit(e) {
    e.preventDefault();

    if (!selectedBankCode) {
      showToast("error", "Please select a bank.");
      return;
    }

    if (!accountNumber || accountNumber.trim().length !== 10) {
      showToast("error", "Please enter a valid 10-digit NUBAN account number.");
      return;
    }

    if (!resolvedAccountName) {
      showToast("error", "Please wait for the account name to resolve successfully.");
      return;
    }

    if (!confirmed) {
      showToast("error", "Please confirm that this is the estate's designated payout account.");
      return;
    }

    const matchedBank = banks.find((b) => b.code === selectedBankCode);

    mutation.mutate({
      estate_id: estateId,
      bank_code: selectedBankCode,
      bank_name: matchedBank?.name || "Bank",
      account_number: accountNumber.trim(),
      account_name: resolvedAccountName,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-brand-accent/70 leading-relaxed">
        Connect the estate&apos;s designated bank account to receive resident waste-collection
        payments directly via Paystack.
      </p>

      {isEditing && (
        <div className="flex items-start gap-2.5 rounded-sm border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-700" />
          <div>
            <p className="font-semibold">Important notice on changing payout accounts</p>
            <p className="mt-0.5 text-amber-800">
              Changing your payout account will update where future resident collections settle.
              Existing payment records will remain unchanged.
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-brand-accent mb-1">
          Bank <span className="text-status-error">*</span>
        </label>
        <DropdownUi
          options={bankOptions}
          value={selectedBankCode}
          onChange={(val) => {
            setSelectedBankCode(val);
            setConfirmed(false);
          }}
        />
        {banksLoading && (
          <p className="mt-1 text-xs text-brand-accent/50 flex items-center gap-1">
            <Loader2 className="size-3 animate-spin" /> Loading supported banks...
          </p>
        )}
      </div>

      <div>
        <InputUi
          label="Account Number"
          type="text"
          required
          maxLength={10}
          placeholder="e.g. 0123456789"
          value={accountNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
            setAccountNumber(val);
            setConfirmed(false);
          }}
        />
        <p className="mt-1 text-xs text-brand-accent/55">
          Use the bank account designated by your estate for waste-collection payments.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-accent mb-1">
          Account Name
        </label>
        <div className="relative flex h-11 w-full items-center rounded-sm border border-brand-accent/10 bg-brand-accent/5 px-3 py-2 text-sm text-brand-accent">
          {isResolving ? (
            <span className="flex items-center gap-2 text-xs font-medium text-brand-accent/60">
              <Loader2 className="size-4 animate-spin text-brand-primary" /> Verifying account with Paystack...
            </span>
          ) : resolvedAccountName ? (
            <span className="flex items-center gap-2 font-semibold text-brand-accent truncate">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span className="truncate">{resolvedAccountName}</span>
            </span>
          ) : (
            <span className="text-xs text-brand-accent/40">
              Enter 10-digit account number and select bank to resolve name.
            </span>
          )}
        </div>
        {resolveError && (
          <p className="mt-1 text-xs text-status-error">{resolveError}</p>
        )}
      </div>

      {resolvedAccountName && (
        <div className="rounded-sm border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
            <span>Account details verified</span>
          </div>
          <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded-xs border-brand-accent/20 text-brand-primary focus:ring-brand-primary"
            />
            <span className="font-medium text-brand-accent text-xs">
              I confirm this is the estate&apos;s designated payout account.
            </span>
          </label>
        </div>
      )}

      <div className="pt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-sm border border-brand-accent/10 text-brand-accent hover:bg-brand-accent/5 cursor-pointer">
          Cancel
        </button>
        <Button
          type="submit"
          disabled={
            mutation.isPending ||
            isResolving ||
            !resolvedAccountName ||
            !confirmed
          }
          size="small">
          {mutation.isPending
            ? "Connecting payout account..."
            : isEditing
            ? "Update Account"
            : "Connect Account"}
        </Button>
      </div>
    </form>
  );
}

function PayoutAccountModal({
  isOpen,
  onClose,
  estateId,
  currentPayoutAccount,
  isEditing = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Change Payout Account" : "Connect Your Payout Account"}>
      {isOpen && (
        <PayoutAccountForm
          key={`${isEditing}-${currentPayoutAccount?.payout_account_number || "empty"}`}
          estateId={estateId}
          currentPayoutAccount={currentPayoutAccount}
          isEditing={isEditing}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

export default PayoutAccountModal;
