import {
  Building2,
  CalendarDays,
  CircleCheckBig,
  CreditCard,
  Download,
  MapPin,
  Share2,
  UserRound,
  X,
} from "lucide-react";
import { getReceiptStatusClasses } from "../features/receipts/receiptData";
import formatDate from "../utils/formatDate";
import formatCurrency from "../utils/formatCurrency";
import showToast from "../utils/showToast";
import { downloadReceipt, shareReceiptLink } from "../utils/receiptUtils";

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-sm bg-brand-accent/4 text-brand-accent/65">
        <Icon size={18} />
      </div>

      <div className="space-y-1">
        <p className="text-sm text-brand-accent/55">{label}</p>
        <p className="text-sm font-medium text-brand-accent">{value}</p>
      </div>
    </div>
  );
}

function getPaymentDateTime(receipt) {
  if (receipt.createdat) {
    return formatDate(receipt.createdat, { includeTime: true });
  }

  if (receipt.paymentDate && receipt.paymentTime) {
    return `${receipt.paymentDate} • ${receipt.paymentTime}`;
  }

  return receipt.paymentDate || "";
}

function normalizeCurrency(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "number") {
    return formatCurrency(value, "NGN");
  }

  if (typeof value === "string") {
    return value.includes("₦") ? value : formatCurrency(value, "NGN");
  }

  return String(value);
}

function ReceiptDetail({ receipt, onClose, variant = "sidebar" }) {
  if (!receipt) {
    return null;
  }

  const paymentDateTime = getPaymentDateTime(receipt);
  const paidBy = receipt.paidBy || receipt.email || "Unknown payer";
  const address = receipt.address || "N/A";
  const transactionReference =
    receipt.reference || receipt.receiptid || receipt.id || "N/A";
  const estateName = receipt.estates?.name || receipt.estate_name || "";
  const statusMessage =
    receipt.statusMessage || receipt.status || "Unknown status";
  const collectionFee = normalizeCurrency(
    receipt.collectionFee ?? receipt.amount ?? 0,
  );
  const transactionFee = normalizeCurrency(receipt.transactionFee ?? 0);
  const totalPaid = normalizeCurrency(receipt.totalPaid ?? receipt.amount ?? 0);

  const containerClass =
    variant === "modal"
      ? "w-full"
      : "h-fit rounded-sm bg-white p-5 sm:p-6 lg:sticky lg:top-4";

  return (
    <div className={containerClass}>
      {variant === "sidebar" && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-accent">
            Receipt Details
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-brand-accent/10 text-brand-accent/70 transition-colors hover:bg-brand-accent/4 cursor-pointer"
            aria-label="Close receipt detail">
            <X size={18} />
          </button>
        </div>
      )}

      <div className={variant === "sidebar" ? "mt-6" : "mt-0"}>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getReceiptStatusClasses(
            receipt.status,
          )}`}>
          {receipt.status}
        </span>

        <h3 className="mt-5 text-3xl font-semibold tracking-tight text-brand-accent sm:text-4xl">
          {receipt.receiptid || receipt.id}
        </h3>
        {receipt.subtitle ? (
          <p className="mt-2 text-base text-brand-accent/65">
            {receipt.subtitle}
          </p>
        ) : null}
      </div>

      <div className="my-8 border-t border-dashed border-brand-accent/10" />

      <div className="space-y-6">
        <DetailRow
          icon={CalendarDays}
          label="Payment Date"
          value={paymentDateTime}
        />
        <DetailRow icon={UserRound} label="Paid By" value={paidBy} />
        {estateName && (
          <DetailRow icon={Building2} label="Estate" value={estateName} />
        )}
        <DetailRow icon={MapPin} label="Address" value={address} />
        <DetailRow
          icon={CreditCard}
          label="Payment Method"
          value={receipt.paymentMethod || "Paystack"}
        />
        <DetailRow
          icon={CircleCheckBig}
          label="Transaction Reference"
          value={transactionReference}
        />
        <DetailRow icon={CircleCheckBig} label="Status" value={statusMessage} />
      </div>

      <div className="my-8 border-t border-dashed border-brand-accent/10" />

      <div>
        <h4 className="text-xl font-semibold text-brand-accent">
          Payment Summary
        </h4>

        <div className="mt-5 space-y-4 text-sm text-brand-accent/70">
          <div className="flex items-center justify-between gap-4">
            <span>Waste Collection Fee</span>
            <span className="font-medium text-brand-accent">
              {collectionFee}
            </span>
          </div>
          {receipt.transactionFee !== undefined ? (
            <div className="flex items-center justify-between gap-4">
              <span>Paystack fee</span>
              <span className="font-medium text-brand-accent">
                {transactionFee}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-brand-accent/10 pt-5">
          <span className="text-lg font-semibold text-brand-accent">
            Total Paid
          </span>
          <span className="text-2xl font-semibold text-brand-primary">
            {totalPaid}
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() => {
            downloadReceipt(receipt);
            showToast("success", "Receipt download started");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-brand-primary px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-95 cursor-pointer">
          <Download size={18} />
          Download Receipt
        </button>

        <button
          type="button"
          onClick={async () => {
            const result = await shareReceiptLink(
              receipt.receiptid || receipt.id,
            );
            if (result?.status === "shared") {
              showToast("success", "Receipt shared successfully");
              return;
            }
            if (result?.status === "copied") {
              showToast("success", "Receipt link copied to clipboard");
              return;
            }
            showToast("success", `Share link: ${result?.shareUrl}`);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-sm border border-brand-accent/10 px-4 py-3 text-sm font-medium text-brand-accent transition-colors hover:bg-brand-accent/4 cursor-pointer">
          <Share2 size={18} />
          Share Receipt
        </button>
      </div>
    </div>
  );
}

export default ReceiptDetail;
