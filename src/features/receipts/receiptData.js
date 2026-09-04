export const RECEIPTS = [
  {
    id: "RCT-20393",
    date: "May 1, 2026",
    period: "May 2026",
    amount: "₦4,000",
    status: "Successful",
    paymentMethod: "Paystack",
    subtitle: "Receipt for May 2026",
    paymentDate: "May 1, 2026",
    paymentTime: "10:24 AM",
    paidBy: "Mo Bankole",
    address: "12 Green Avenue, Maple Estate",
    reference: "PS_6839473839KDLS",
    statusMessage: "Payment approved on May 1, 2026",
    collectionFee: "₦4,000",
    processingFee: "₦100",
    totalPaid: "₦4,100",
  },
  {
    id: "RCT-19876",
    date: "Apr 1, 2026",
    period: "Apr 2026",
    amount: "₦4,000",
    status: "Successful",
    paymentMethod: "Paystack",
    subtitle: "Receipt for April 2026",
    paymentDate: "Apr 1, 2026",
    paymentTime: "09:12 AM",
    paidBy: "Mo Bankole",
    address: "12 Green Avenue, Maple Estate",
    reference: "PS_5472819045DJQS",
    statusMessage: "Payment approved on Apr 1, 2026",
    collectionFee: "₦4,000",
    processingFee: "₦100",
    totalPaid: "₦4,100",
  },
  {
    id: "RCT-19321",
    date: "Mar 1, 2026",
    period: "Mar 2026",
    amount: "₦4,000",
    status: "Successful",
    paymentMethod: "Paystack",
    subtitle: "Receipt for March 2026",
    paymentDate: "Mar 1, 2026",
    paymentTime: "11:08 AM",
    paidBy: "Mo Bankole",
    address: "12 Green Avenue, Maple Estate",
    reference: "PS_6102847763HPNX",
    statusMessage: "Payment approved on Mar 1, 2026",
    collectionFee: "₦4,000",
    processingFee: "₦100",
    totalPaid: "₦4,100",
  },
  {
    id: "RCT-18765",
    date: "Feb 1, 2026",
    period: "Feb 2026",
    amount: "₦4,000",
    status: "Successful",
    paymentMethod: "Paystack",
    subtitle: "Receipt for February 2026",
    paymentDate: "Feb 1, 2026",
    paymentTime: "08:46 AM",
    paidBy: "Mo Bankole",
    address: "12 Green Avenue, Maple Estate",
    reference: "PS_2468193704LKJP",
    statusMessage: "Payment approved on Feb 1, 2026",
    collectionFee: "₦4,000",
    processingFee: "₦100",
    totalPaid: "₦4,100",
  },
  {
    id: "RCT-18109",
    date: "Jan 1, 2026",
    period: "Jan 2026",
    amount: "₦4,000",
    status: "Successful",
    paymentMethod: "Paystack",
    subtitle: "Receipt for January 2026",
    paymentDate: "Jan 1, 2026",
    paymentTime: "10:31 AM",
    paidBy: "Mo Bankole",
    address: "12 Green Avenue, Maple Estate",
    reference: "PS_1459832671TQRE",
    statusMessage: "Payment approved on Jan 1, 2026",
    collectionFee: "₦4,000",
    processingFee: "₦100",
    totalPaid: "₦4,100",
  },
  {
    id: "RCT-17532",
    date: "Dec 1, 2025",
    period: "Dec 2025",
    amount: "₦4,000",
    status: "Failed",
    paymentMethod: "Paystack",
    subtitle: "Receipt for December 2025",
    paymentDate: "Dec 1, 2025",
    paymentTime: "04:18 PM",
    paidBy: "Mo Bankole",
    address: "12 Green Avenue, Maple Estate",
    reference: "PS_9081745562MVKD",
    statusMessage: "Payment is being reviewed",
    collectionFee: "₦4,000",
    processingFee: "₦100",
    totalPaid: "₦4,100",
  },
];

export function getReceiptStatusClasses(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "successful" || normalized === "approved") {
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
