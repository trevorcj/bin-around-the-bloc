export const PAYMENT_HISTORY_ROWS = [
  {
    id: "PMT-20393",
    date: "May 1, 2026",
    reference: "RCT-20393",
    description: "Waste collection fee - May 2026",
    note: "Auto-generated monthly charge",
    amount: "₦4,150",
    status: "Failed",
  },
  {
    id: "PMT-19876",
    date: "Apr 1, 2026",
    reference: "RCT-19876",
    description: "Waste collection fee - April 2026",
    note: "Paid with saved card via Paystack",
    amount: "₦4,150",
    status: "Successful",
  },
  {
    id: "PMT-19321",
    date: "Mar 1, 2026",
    reference: "RCT-19321",
    description: "Waste collection fee - March 2026",
    note: "Confirmed and receipt available",
    amount: "₦4,150",
    status: "Successful",
  },
  {
    id: "PMT-18765",
    date: "Feb 1, 2026",
    reference: "RCT-18765",
    description: "Waste collection fee - February 2026",
    note: "Confirmed and receipt available",
    amount: "₦4,150",
    status: "Successful",
  },
];

export function getPaymentStatusClasses(status) {
  if (status === "Successful") {
    return "bg-status-success/10 text-status-success";
  }

  if (status === "Pending") {
    return "bg-status-warning/10 text-status-warning";
  }

  if (status === "Failed") {
    return "bg-status-error/10 text-status-error";
  }

  return "bg-brand-accent/10 text-brand-accent";
}
