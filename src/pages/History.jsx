import { useState } from "react";
import { CircleCheckBig, Download, ReceiptText } from "lucide-react";
import clsx from "clsx";
import { StyledH1 } from "../styles/CommonStyles";
import Table from "../ui/Table";
import InputUi from "../ui/Input";
import DropdownUi from "../ui/DropdownUi";
import Pagination from "../ui/Pagination";

import usePayments from "../hooks/usePayments";

import formatDate from "../utils/formatDate";
import formatCurrency from "../utils/formatCurrency";
import useDebounce from "../hooks/useDebounce";
import { downloadCsv } from "../utils/receiptUtils";
import { useNavigate, useSearchParams } from "react-router-dom";

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Successful", value: "successful" },
  { label: "Failed", value: "failed" },
];

const MONTH_OPTIONS = [
  { label: "All Months", value: "all" },
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

const HISTORY_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "charge", label: "Charge" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "status", label: "Status" },
];

function HistoryStatusIcon({ status }) {
  const normalized = String(status).toLowerCase();

  if (normalized === "successful") {
    return <CircleCheckBig size={18} />;
  }

  return <ReceiptText size={18} />;
}

function getHistoryStatusClasses(status) {
  const normalized = String(status).toLowerCase();

  if (normalized === "successful") {
    return "bg-status-success/10 text-status-success";
  }

  if (normalized === "failed") {
    return "bg-status-error/10 text-status-error";
  }

  return "bg-brand-accent/10 text-brand-accent";
}

function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status") || "all";
  const month = searchParams.get("month") || "all";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 1000);

  const { data, isLoading, error, isPlaceholderData } = usePayments({
    search: debouncedSearch,
    status,
    month,
    page: currentPage,
  });

  const payments = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;
  const itemsPerPage = data?.itemsPerPage || 10;

  const hasFilters = status !== "all" || month !== "all" || search !== "";

  const getReceiptIdentifier = (row) => row.receiptid || row.id || null;

  function handleSearchChange(event) {
    const nextValue = event.target.value;
    setSearch(nextValue);

    if (nextValue) {
      searchParams.set("search", nextValue);
    } else {
      searchParams.delete("search");
    }

    searchParams.set("page", 1);
    setSearchParams(searchParams);
  }

  function handleStatusChange(selectedStatus) {
    if (selectedStatus !== "all") {
      searchParams.set("status", selectedStatus);
    } else {
      searchParams.delete("status");
    }

    searchParams.set("page", "1");
    setSearchParams(searchParams);
  }

  function handleMonthChange(selectedMonth) {
    if (selectedMonth !== "all") {
      searchParams.set("month", selectedMonth);
    } else {
      searchParams.delete("month");
    }

    searchParams.set("page", "1");
    setSearchParams(searchParams);
  }

  function handleRowClick(receiptId) {
    navigate(`/app/receipts/${receiptId}`);
  }

  function handleRowKeyDown(event, receiptId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRowClick(receiptId);
    }
  }

  function handlePageChange(targetPage) {
    searchParams.set("page", String(targetPage));
    setSearchParams(searchParams);
  }

  function handleExportCsv() {
    if (!payments || payments.length === 0) {
      return;
    }

    const exportRows = payments.map((payment) => ({
      date: formatDate(
        payment.createdat ?? payment.paymentDate ?? payment.date,
      ),
      charge: payment.charge || payment.description || "",
      amount: formatCurrency(payment.amount, "NGN"),
      status: payment.status || "",
      receiptId: payment.receiptid || payment.id || "",
      reference: payment.reference || "",
      paymentMethod: payment.paymentMethod || "Paystack",
    }));

    downloadCsv(exportRows, "bin_around_the_bloc_history.csv", [
      { key: "date", label: "Date" },
      { key: "charge", label: "Charge" },
      { key: "amount", label: "Amount" },
      { key: "status", label: "Status" },
      { key: "receiptId", label: "Receipt ID" },
      { key: "reference", label: "Reference" },
      { key: "paymentMethod", label: "Payment Method" },
    ]);
  }

  return (
    <>
      <StyledH1>Payment History</StyledH1>

      <p className="text-brand-accent/80 mt-2">
        View and manage all your payments.
      </p>

      <div className="py-6">
        <div className="mb-4 flex flex-col lg:flex-row lg:items-center gap-3 bg-white p-4 border border-brand-accent/10 rounded-sm w-full">
          <div className="w-full lg:flex-1">
            <InputUi
              type="search"
              placeholder="Search by receipt ID, reference or method..."
              className="w-full bg-white"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="w-full lg:w-40 lg:shrink-0 cursor-pointer">
            <DropdownUi
              buttonClassName="bg-white w-full"
              options={STATUS_OPTIONS}
              value={status}
              onChange={handleStatusChange}
            />
          </div>

          <div className="w-full lg:w-40 lg:shrink-0 cursor-pointer">
            <DropdownUi
              buttonClassName="bg-white w-full"
              options={MONTH_OPTIONS}
              value={month}
              onChange={handleMonthChange}
            />
          </div>

          <div className="self-start lg:self-auto lg:shrink-0 cursor-pointer">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center justify-center gap-2 rounded-sm border border-brand-accent/10 px-4 py-2 text-sm font-medium text-brand-accent hover:bg-brand-accent/5 cursor-pointer">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <Table
          data={payments}
          columns={HISTORY_COLUMNS}
          responsiveAt="md"
          emptyState={
            hasFilters
              ? "No payment history matches your current search or filters."
              : "No payment history found."
          }
          pagination={
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          }
          renderRow={(row) => {
            const receiptKey = getReceiptIdentifier(row);
            return (
              <tr
                tabIndex={0}
                role="button"
                aria-pressed="false"
                onClick={() => handleRowClick(receiptKey)}
                onKeyDown={(event) => handleRowKeyDown(event, receiptKey)}
                className="group border-b border-brand-accent/8 transition-colors last:border-b-0 hover:bg-brand-accent/[0.018] cursor-pointer">
                <th
                  scope="row"
                  className="px-6 py-5 text-left font-normal whitespace-nowrap">
                  <div className="space-y-1">
                    <p className="font-medium text-brand-accent">
                      {formatDate(row.createdat)}
                    </p>
                    <p className="text-xs text-brand-accent/45">
                      {row.receiptid}
                    </p>
                  </div>
                </th>

                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border",
                        String(row.status).toLowerCase() === "successful"
                          ? "border-status-success/20 bg-status-success/5"
                          : "border-brand-accent/10",
                      )}>
                      <HistoryStatusIcon status={row.status} />
                    </div>

                    <div>
                      <p className="font-medium text-brand-accent">
                        Waste Collection Fee -{" "}
                        {`${row.month.charAt(0).toUpperCase() + row.month?.slice(1)}, ${row.year}`}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5 text-right font-medium text-brand-accent">
                  {formatCurrency(row.amount, "NGN")}
                </td>

                <td className="px-6 py-5">
                  <span
                    className={clsx(
                      "inline-flex rounded-full px-3 py-1 text-sm font-medium",
                      getHistoryStatusClasses(row.status),
                    )}>
                    {row.status}
                  </span>
                </td>
              </tr>
            );
          }}
          renderCard={(row) => (
            <article className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand-accent">
                    Waste Collection Fee -{" "}
                    {`${row.month.charAt(0).toUpperCase() + row.month?.slice(1)}, ${row.year}`}
                  </p>
                </div>
                <span
                  className={clsx(
                    "inline-flex shrink-0 rounded-full px-3 py-1 text-sm font-medium",
                    getHistoryStatusClasses(row.status),
                  )}>
                  {row.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent/40">
                    Date
                  </p>
                  <p className="mt-1 text-sm font-medium text-brand-accent">
                    {formatDate(row.createdat)}
                  </p>
                  <p className="mt-1 text-xs text-brand-accent/45">
                    {row.receiptid}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent/40">
                    Amount
                  </p>
                  <p className="mt-1 text-sm font-medium text-brand-accent">
                    {formatCurrency(row.amount, "NGN")}
                  </p>
                </div>
              </div>
            </article>
          )}
          isLoading={isLoading}
          error={error}
          isPlaceholderData={isPlaceholderData}
        />
      </div>
    </>
  );
}

export default History;
