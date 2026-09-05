import { jsPDF } from "jspdf";
import formatDate from "./formatDate";

function escapeCsvValue(value) {
  const stringValue = value === undefined || value === null ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function downloadReconciliationCsv({ estate, periodText, rows }) {
  if (!rows || rows.length === 0) return;

  const headers = [
    "Street Name",
    "House Number",
    "Resident Name",
    "Phone Number",
    "Email Address",
    "Property Category",
    "Expected Fee (NGN)",
    "Payment Status",
    "Amount Paid (NGN)",
    "Payment Method",
    "Payment Reference",
    "Payment Date",
    "Billing Period",
  ];

  const csvRows = [headers.map(escapeCsvValue).join(",")];

  for (const r of rows) {
    const rowValues = [
      r.street_name,
      r.house_number ? `House ${r.house_number}` : "-",
      r.fullname,
      r.phone || "-",
      r.email || "-",
      r.property_type_name || "-",
      r.expected_fee,
      r.status,
      r.paid_amount,
      r.payment_method || "-",
      r.reference || "-",
      r.paid_at ? formatDate(r.paid_at) : "-",
      periodText,
    ].map(escapeCsvValue);

    csvRows.push(rowValues.join(","));
  }

  const blob = new Blob([csvRows.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const safeEstate = (estate?.name || "estate")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();
  const safePeriod = periodText.trim().replace(/\s+/g, "_").toLowerCase();
  link.download = `${safeEstate}_reconciliation_${safePeriod}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export function downloadReconciliationPdf({
  estate,
  periodText,
  rows,
  summary,
  filterDescription = "All Records",
}) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 40;
  const marginRight = 40;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const estateName = estate?.name || "Estate Waste Management";
  const estateCode = estate?.code ? ` (${estate.code})` : "";
  const reportDate = formatDate(new Date().toISOString(), {
    includeTime: true,
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function drawHeader(isFirstPage) {
    doc.setFillColor(27, 56, 43);
    doc.rect(marginLeft, 30, contentWidth, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(27, 56, 43);
    doc.text(`${estateName}${estateCode}`, marginLeft, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${reportDate}`, pageWidth - marginRight, 52, {
      align: "right",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `WASTE COLLECTION RECONCILIATION REPORT • ${periodText.toUpperCase()}`,
      marginLeft,
      70
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Filter Scope: ${filterDescription}`, marginLeft, 84);

    if (isFirstPage && summary) {
      const cardWidth = (contentWidth - 50) / 6;
      const cardHeight = 44;
      const cardY = 96;

      const metrics = [
        { label: "TOTAL RESIDENTS", val: String(summary.totalResidents || 0) },
        {
          label: "PAID RESIDENTS",
          val: `${summary.paidCount || 0} (${summary.paidPercentage || 0}%)`,
          color: [22, 163, 74],
        },
        {
          label: "UNPAID RESIDENTS",
          val: `${summary.unpaidCount || 0} (${summary.unpaidPercentage || 0}%)`,
          color: [220, 38, 38],
        },
        {
          label: "EXPECTED REVENUE",
          val: `₦${Number(summary.totalExpected || 0).toLocaleString()}`,
        },
        {
          label: "COLLECTED",
          val: `₦${Number(summary.totalCollected || 0).toLocaleString()}`,
          color: [22, 163, 74],
        },
        {
          label: "OUTSTANDING",
          val: `₦${Number(summary.totalOutstanding || 0).toLocaleString()}`,
          color: [220, 38, 38],
        },
      ];

      metrics.forEach((m, idx) => {
        const cx = marginLeft + idx * (cardWidth + 10);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(cx, cardY, cardWidth, cardHeight, "FD");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(m.label, cx + 8, cardY + 14);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        if (m.color) {
          doc.setTextColor(m.color[0], m.color[1], m.color[2]);
        } else {
          doc.setTextColor(15, 23, 42);
        }
        doc.text(m.val, cx + 8, cardY + 32);
      });

      return 152;
    }

    return 98;
  }

  const columns = [
    { label: "STREET", width: 130, align: "left" },
    { label: "HOUSE #", width: 65, align: "left" },
    { label: "RESIDENT NAME", width: 140, align: "left" },
    { label: "CATEGORY", width: 95, align: "left" },
    { label: "EXPECTED", width: 75, align: "right" },
    { label: "STATUS", width: 65, align: "center" },
    { label: "PAID", width: 75, align: "right" },
    { label: "METHOD / REF", width: 115, align: "left" },
  ];

  function drawTableHeaders(startY) {
    doc.setFillColor(241, 245, 249);
    doc.rect(marginLeft, startY, contentWidth, 20, "F");
    doc.setDrawColor(203, 213, 225);
    doc.line(marginLeft, startY + 20, marginLeft + contentWidth, startY + 20);

    let colX = marginLeft;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    columns.forEach((col) => {
      const textX =
        col.align === "right"
          ? colX + col.width - 6
          : col.align === "center"
          ? colX + col.width / 2
          : colX + 6;
      doc.text(col.label, textX, startY + 13, { align: col.align });
      colX += col.width;
    });

    return startY + 20;
  }

  let currentY = drawHeader(true);
  currentY = drawTableHeaders(currentY);

  const rowHeight = 18;

  rows.forEach((r, idx) => {
    if (currentY + rowHeight > pageHeight - 45) {
      doc.addPage();
      currentY = drawHeader(false);
      currentY = drawTableHeaders(currentY);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginLeft, currentY, contentWidth, rowHeight, "F");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(
      marginLeft,
      currentY + rowHeight,
      marginLeft + contentWidth,
      currentY + rowHeight
    );

    let colX = marginLeft;

    const values = [
      { text: r.street_name || "-", align: "left", width: 130 },
      {
        text: r.house_number ? `House ${r.house_number}` : "-",
        align: "left",
        width: 65,
      },
      { text: r.fullname || "Resident", align: "left", width: 140 },
      { text: r.property_type_name || "Standard", align: "left", width: 95 },
      {
        text: `₦${Number(r.expected_fee || 0).toLocaleString()}`,
        align: "right",
        width: 75,
      },
      {
        text: r.status,
        align: "center",
        width: 65,
        isStatus: true,
      },
      {
        text:
          r.status === "Paid"
            ? `₦${Number(r.paid_amount || 0).toLocaleString()}`
            : "₦0",
        align: "right",
        width: 75,
        color: r.status === "Paid" ? [22, 163, 74] : [100, 116, 139],
      },
      {
        text:
          r.status === "Paid"
            ? `${r.payment_method || "Online"} (${String(r.reference || "").slice(0, 10)})`
            : "-",
        align: "left",
        width: 115,
      },
    ];

    values.forEach((v) => {
      const textX =
        v.align === "right"
          ? colX + v.width - 6
          : v.align === "center"
          ? colX + v.width / 2
          : colX + 6;

      doc.setFont("helvetica", v.isStatus ? "bold" : "normal");
      doc.setFontSize(8);

      if (v.isStatus) {
        if (v.text === "Paid") {
          doc.setTextColor(22, 163, 74);
        } else {
          doc.setTextColor(220, 38, 38);
        }
      } else if (v.color) {
        doc.setTextColor(v.color[0], v.color[1], v.color[2]);
      } else {
        doc.setTextColor(30, 41, 59);
      }

      const truncated = doc.splitTextToSize(String(v.text), v.width - 10);
      doc.text(truncated[0] || "", textX, currentY + 12, { align: v.align });

      colX += v.width;
    });

    currentY += rowHeight;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    doc.text(
      "Estate Waste Management Reconciliation • Bin Around The Bloc Platform",
      marginLeft,
      pageHeight - 20
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - marginRight,
      pageHeight - 20,
      { align: "right" }
    );
  }

  const safeEstate = (estate?.name || "estate")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();
  const safePeriod = periodText.trim().replace(/\s+/g, "_").toLowerCase();
  doc.save(`${safeEstate}_reconciliation_${safePeriod}.pdf`);
}