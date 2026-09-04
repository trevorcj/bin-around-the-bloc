import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import formatCurrency from "./formatCurrency";
import formatDate from "./formatDate";

function formatReceiptField(value, fallback = "N/A") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function getReceiptFilename(receipt, extension = "pdf") {
  const receiptIdentifier = receipt.receiptid || receipt.id || "receipt";
  const safeIdentifier = String(receiptIdentifier)
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toLowerCase();
  const monthPart = receipt.month ? `_${receipt.month.toLowerCase()}` : "";
  return `bin_around_the_bloc_${safeIdentifier}${monthPart}.${extension}`;
}

function getReceiptStatusLabel(status) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();

  if (!normalized) return "Unknown";
  if (normalized === "successful" || normalized === "completed")
    return "Successful";
  if (normalized === "pending") return "Pending";
  if (normalized === "failed") return "Failed";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getReceiptStatusClass(status) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();
  if (normalized === "successful" || normalized === "completed")
    return "status-success";
  if (normalized === "failed") return "status-failed";
  return "status-pending";
}

function getAddressValue(receipt) {
  if (receipt.address) return receipt.address;

  const parts = [receipt.housenumber, receipt.streetname].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }

  return "N/A";
}

function getStatusIcon(statusLabel) {
  if (statusLabel === "Successful") {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  }

  if (statusLabel === "Pending") {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="6"></circle>
        <path d="M12 8.5v3.5l2 1.5"></path>
      </svg>
    `;
  }

  if (statusLabel === "Failed") {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `;
  }

  return `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="9"></circle>
    </svg>
  `;
}

function getReceiptStyles() {
  return `
    * {
      box-sizing: border-box;
    }
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

    body {
      margin: 0;
      padding: 0;
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f4f5f7;
      color: #111827;
    }

    .receipt-shell {
      width: 440px;
      margin: 0 auto;
      padding: 32px 24px;
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
    }

    .receipt-status-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 0 8px;
      border-radius: 0;
      background: transparent;
      text-align: center;
      margin-bottom: 30px;
      border: none;
    }

    .status-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
    }
    .status-icon-successful {
      background: #22c55e;
      color: #ffffff;
    }
    .status-icon-pending {
      background: #fbbf24;
      color: #ffffff;
    }
    .status-icon-failed {
      background: #ef4444;
      color: #ffffff;
    }

    .status-heading {
      margin: 0;
      font-size: 15px;
      font-weight: 400;
      color: #111827;
      letter-spacing: -0.02em;
    }

    .status-label-text {
      display: none;
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
    }

    .receipt-amount {
      margin: 0;
      font-size: 40px;
      line-height: 1;
      font-weight: 600;
      letter-spacing: -0.04em;
      color: #111827;
    }

    .receipt-detail-card {
      padding: 0;
      border-radius: 0;
      background: transparent;
      margin-bottom: 24px;
    }

    .receipt-section-title {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin: 0 0 14px;
    }

    .detail-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }
    .detail-label {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }
    .detail-value {
      margin: 0;
      font-size: 14px;
      color: #0f172a;
      font-weight: 600;
      text-align: right;
      word-break: break-word;
    }

    .receipt-divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 0 0 18px;
    }

    .receipt-footer-note {
      text-align: center;
      margin: 0 0 18px;
      font-size: 13px;
      color: #64748b;
      line-height: 1.6;
      letter-spacing: 0.01em;
    }

    .receipt-logo-center {
      display: flex;
      justify-content: center;
      margin-top: 10px;
    }

    .receipt-logo-center img {
      width: 50px;
      max-width: 100%;
      object-fit: contain;
    }
  `;
}

function buildReceiptMarkup(receipt) {
  const statusLabel = getReceiptStatusLabel(receipt.status);
  const statusClass = getReceiptStatusClass(receipt.status);

  const paymentDate = formatDate(
    receipt.createdat || receipt.paymentDate || receipt.date,
    { includeTime: true, month: "short", day: "numeric", year: "numeric" },
  );

  const paidBy = formatReceiptField(
    receipt.email || receipt.fullname || receipt.paidBy,
  );
  const address = formatReceiptField(getAddressValue(receipt));
  const paymentMethod = formatReceiptField(receipt.paymentMethod || "Paystack");
  const reference = formatReceiptField(
    receipt.reference || receipt.receiptid || receipt.id,
  );
  const billingPeriod =
    receipt.month && receipt.year
      ? `${receipt.month.charAt(0).toUpperCase() + receipt.month.slice(1)} ${receipt.year}`
      : "N/A";

  const totalPaid = formatCurrency(
    receipt.totalPaid ?? receipt.amount ?? 0,
    "NGN",
  );
  const logoUrl = `${window.location.origin}/logo.svg`;
  const statusHeading =
    statusLabel === "Successful"
      ? "Payment Success!"
      : statusLabel === "Pending"
        ? "Payment Pending"
        : statusLabel === "Failed"
          ? "Payment Failed"
          : statusLabel;

  return `
    <div class="receipt-shell ${statusClass}">
      <div class="receipt-status-card">
        <div class="status-icon-wrapper status-icon-${statusLabel.toLowerCase()}">
          ${getStatusIcon(statusLabel)}
        </div>
        <p class="status-heading">${statusHeading}</p>
        <h1 class="receipt-amount">${totalPaid}</h1>
      </div>

      <div class="receipt-detail-card">
        <div class="detail-list">
          <div class="detail-row">
            <p class="detail-label">Payment Date</p>
            <p class="detail-value">${paymentDate}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Billing Period</p>
            <p class="detail-value">${billingPeriod}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Payment Method</p>
            <p class="detail-value">${paymentMethod}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Reference ID</p>
            <p class="detail-value">${reference}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Customer Name</p>
            <p class="detail-value">${paidBy}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Service Address</p>
            <p class="detail-value">${address}</p>
          </div>
        </div>
      </div>

      <hr class="receipt-divider" />
      <p class="receipt-footer-note">
        Pay waste management bills with Bin Around The Bloc
      </p>
      <div class="receipt-logo-center">
        <img src="${logoUrl}" alt="Logo" onerror="this.style.display='none';" />
      </div>
    </div>
  `;
}

function buildReceiptHtml(receipt) {
  const receiptIdentifier = formatReceiptField(receipt.receiptid || receipt.id);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Receipt ${receiptIdentifier}</title>
    <style>${getReceiptStyles()}</style>
  </head>
  <body>${buildReceiptMarkup(receipt)}</body>
</html>`;
}

function createReceiptElement(receipt) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "440px";
  container.style.zIndex = "0";
  container.innerHTML = `
    <style>${getReceiptStyles()}</style>
    ${buildReceiptMarkup(receipt)}
  `;

  document.body.appendChild(container);
  return container;
}

async function downloadReceiptHtml(receipt) {
  const html = buildReceiptHtml(receipt);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = getReceiptFilename(receipt, "html");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export async function downloadReceipt(receipt) {
  if (!receipt) return;

  const filename = getReceiptFilename(receipt, "pdf");
  const container = createReceiptElement(receipt);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error("Receipt render was empty.");
    }

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = canvas.width / 2;
    const imgHeight = canvas.height / 2;

    const pdf = new jsPDF({
      orientation: "p",
      unit: "px",
      format: [imgWidth, imgHeight],
    });

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error("Receipt PDF export failed, falling back to HTML", error);
    await downloadReceiptHtml(receipt);
  } finally {
    container.remove();
  }
}

function escapeCsvValue(value) {
  const stringValue =
    value === undefined || value === null ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function downloadCsv(
  records,
  filename = "bin_around_the_bloc_export.csv",
  headers = [],
) {
  if (!Array.isArray(records) || records.length === 0) return;

  const headerKeys = headers.length
    ? headers.map((header) =>
        typeof header === "string" ? header : header.key,
      )
    : Object.keys(records[0]);

  const headerLabels = headers.length
    ? headers.map((header) =>
        typeof header === "string" ? header : header.label || header.key,
      )
    : headerKeys;

  const rows = [headerLabels.map(escapeCsvValue).join(",")];

  for (const record of records) {
    const rowValues = headerKeys.map((key) => escapeCsvValue(record[key]));
    rows.push(rowValues.join(","));
  }

  const blob = new Blob([rows.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export async function shareReceiptLink(receiptId) {
  const shareUrl = `${window.location.origin}/receipts/${receiptId}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Receipt ${receiptId}`,
        text: "View your receipt",
        url: shareUrl,
      });
      return { status: "shared", shareUrl };
    } catch (e) {
      void e;
    }
  }

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return { status: "copied", shareUrl };
    } catch {
      return { status: "failed", shareUrl };
    }
  }

  return { status: "failed", shareUrl };
}
