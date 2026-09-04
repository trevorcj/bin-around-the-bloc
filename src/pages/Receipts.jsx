import {
  ChevronRight,
  Download,
  FileText,
  MoreHorizontal,
  Search,
  WalletCards,
} from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getReceiptStatusClasses } from "../features/receipts/receiptData";
import { StyledH1 } from "../styles/CommonStyles";
import DropdownUi from "../ui/DropdownUi";
import Pagination from "../ui/Pagination";
import ReceiptDetail from "../ui/ReceiptDetail";
import Table from "../ui/Table";
import Modal from "../ui/Modal";
import usePayments from "../hooks/usePayments";
import formatDate from "../utils/formatDate";
import formatCurrency from "../utils/formatCurrency";
import showToast from "../utils/showToast";
import { downloadReceipt, shareReceiptLink } from "../utils/receiptUtils";
import useDebounce from "../hooks/useDebounce";
import { downloadCsv } from "../utils/receiptUtils";
import getReceipt from "../api/getReceipt";

const RECEIPT_COLUMNS = [
  { key: "open", label: "", className: "w-12 sm:px-6" },
  { key: "date", label: "Date", className: "sm:px-6" },
  { key: "receiptId", label: "Receipt ID" },
  { key: "period", label: "Period" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "status", label: "Status" },
  { key: "paymentMethod", label: "Payment Method" },
  { key: "receipt", label: "Receipt" },
  { key: "more", label: "", className: "w-12 text-right sm:px-6" },
];

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

const RECEIPTS_PER_PAGE = 5;

function PaymentMethodBadge({ method }) {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary">
        <WalletCards size={16} />
      </div>
      <span className="font-medium text-brand-accent">{method}</span>
    </div>
  );
}

function Receipts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id } = useParams();
  const status = searchParams.get("status") || "all";
  const month = searchParams.get("month") || "all";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeOptionsReceipt, setActiveOptionsReceipt] = useState(null);
  const debouncedSearch = useDebounce(search, 1000);

  const { data, isLoading, error, isPlaceholderData } = usePayments({
    search: debouncedSearch,
    status,
    month,
    page: currentPage,
  });

  const receipts = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;
  const itemsPerPage = data?.itemsPerPage || RECEIPTS_PER_PAGE;
  const hasFilters = search !== "" || status !== "all" || month !== "all";

  const getReceiptIdentifier = (receipt) =>
    receipt.receiptid || receipt.id || null;
  const selectedReceiptFromList = id
    ? (receipts.find((receipt) => getReceiptIdentifier(receipt) === id) ?? null)
    : null;
  const selectedReceiptQuery = useQuery({
    queryKey: ["receipt", id],
    queryFn: () => getReceipt(id),
    enabled: !!id && !selectedReceiptFromList,
  });
  const selectedReceipt = selectedReceiptFromList || selectedReceiptQuery.data;

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  function openReceipt(receiptId) {
    navigate(`/receipts/${receiptId}`);
  }

  function closeReceipt() {
    navigate("/receipts");
  }

  function toggleReceiptOptions(event, receiptId) {
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();

    setMenuPosition({
      top: rect.bottom + 8,
      left: rect.right - 176,
    });

    setActiveOptionsReceipt((current) =>
      current === receiptId ? null : receiptId,
    );
  }

  function handleDownloadReceipt(receiptId) {
    const receipt = receipts.find(
      (item) => getReceiptIdentifier(item) === receiptId,
    );
    setActiveOptionsReceipt(null);

    if (!receipt) {
      showToast("error", "Receipt not found.");
      return;
    }

    downloadReceipt(receipt);
    showToast("success", "Receipt download started.");
  }

  async function handleShareReceipt(receiptId) {
    const receipt = receipts.find(
      (item) => getReceiptIdentifier(item) === receiptId,
    );
    setActiveOptionsReceipt(null);

    if (!receipt) {
      showToast("error", "Receipt not found.");
      return;
    }

    const result = await shareReceiptLink(receipt.receiptid || receipt.id);

    if (result?.status === "shared") {
      showToast("success", "Receipt shared successfully.");
      return;
    }

    if (result?.status === "copied") {
      showToast("success", "Receipt link copied to clipboard.");
      return;
    }

    showToast("success", `Share link: ${result?.shareUrl}`);
  }

  function handleSearchChange(event) {
    const nextValue = event.target.value;
    setSearch(nextValue);

    if (nextValue) {
      searchParams.set("search", nextValue);
    } else {
      searchParams.delete("search");
    }

    searchParams.set("page", "1");
    setSearchParams(searchParams);
  }

  function handleStatusChange(nextStatus) {
    if (nextStatus !== "all") {
      searchParams.set("status", nextStatus);
    } else {
      searchParams.delete("status");
    }

    searchParams.set("page", "1");
    setSearchParams(searchParams);
  }

  function handleMonthChange(nextMonth) {
    if (nextMonth !== "all") {
      searchParams.set("month", nextMonth);
    } else {
      searchParams.delete("month");
    }

    searchParams.set("page", "1");
    setSearchParams(searchParams);
  }

  function handlePageChange(nextPage) {
    searchParams.set("page", String(nextPage));
    setSearchParams(searchParams);
  }

  function handleExportCsv() {
    if (!receipts || receipts.length === 0) {
      return;
    }

    const exportRows = receipts.map((receipt) => ({
      date: formatDate(
        receipt.createdat ?? receipt.paymentDate ?? receipt.date,
      ),
      receiptId: receipt.receiptid || receipt.id || "",
      period:
        receipt.period ||
        (receipt.month
          ? `${receipt.month.charAt(0).toUpperCase() + receipt.month.slice(1)}, ${receipt.year}`
          : ""),
      amount: formatCurrency(receipt.amount, "NGN"),
      status: receipt.status || "",
      paymentMethod: receipt.paymentMethod || "Paystack",
    }));

    downloadCsv(exportRows, "bin_around_the_bloc_receipts.csv", [
      { key: "date", label: "Date" },
      { key: "receiptId", label: "Receipt ID" },
      { key: "period", label: "Period" },
      { key: "amount", label: "Amount" },
      { key: "status", label: "Status" },
      { key: "paymentMethod", label: "Payment Method" },
    ]);
  }

  function handleRowKeyDown(event, receiptId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openReceipt(receiptId);
    }
  }

  useEffect(() => {
    if (!activeOptionsReceipt) return undefined;

    function handlePointerDown(event) {
      const target = event.target;

      if (
        target instanceof Element &&
        !target.closest("[data-receipt-options]")
      ) {
        setActiveOptionsReceipt(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [activeOptionsReceipt]);

  return (
    <div className={clsx("space-y-6 pb-8", selectedReceipt && "lg:pr-96")}>
      <div>
        <StyledH1>Receipts</StyledH1>
        <p className="mt-2 text-brand-accent/80">
          View and manage all your payments and receipts.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="min-w-0 space-y-6">
          <Table
            data={receipts}
            columns={RECEIPT_COLUMNS}
            responsiveAt="lg"
            tableClassName="min-w-[980px]"
            emptyState={
              hasFilters
                ? "No receipts match your current search or filters."
                : "No receipts found."
            }
            isLoading={isLoading}
            error={error}
            isPlaceholderData={isPlaceholderData}
            renderRow={(receipt) => {
              const receiptKey = getReceiptIdentifier(receipt);
              const selectedId = selectedReceipt
                ? getReceiptIdentifier(selectedReceipt)
                : null;
              const period =
                receipt.period ||
                (receipt.month
                  ? `${receipt.month.charAt(0).toUpperCase() + receipt.month.slice(1)}, ${receipt.year}`
                  : "");
              const isSelected = receiptKey === selectedId;

              return (
                <tr
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  onClick={() => openReceipt(receiptKey)}
                  onKeyDown={(event) => handleRowKeyDown(event, receiptKey)}
                  className={clsx(
                    "group border-b border-brand-accent/8 transition-colors last:border-b-0 focus:bg-brand-primary/5 focus:outline-none",
                    isSelected
                      ? "bg-brand-primary/[0.07]"
                      : "hover:bg-brand-accent/[0.018]",
                  )}>
                  <td className="px-4 py-4 align-middle text-brand-accent/50 sm:px-6">
                    <div
                      className={clsx(
                        "flex h-9 w-9 items-center justify-center rounded-sm border transition-colors cursor-pointer",
                        isSelected
                          ? "border-brand-primary/20 bg-brand-primary/10 text-brand-primary"
                          : "border-brand-accent/10 bg-brand-accent/3 text-brand-accent/50 group-hover:border-brand-primary/15 group-hover:text-brand-primary",
                      )}>
                      <ChevronRight size={18} />
                    </div>
                  </td>

                  <td className="px-4 py-4 align-middle sm:px-6">
                    {formatDate(
                      receipt.createdat ?? receipt.paymentDate ?? receipt.date,
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle font-medium">
                    {receipt.receiptid || receipt.id}
                  </td>
                  <td className="px-4 py-4 align-middle">{period}</td>
                  <td className="px-4 py-4 align-middle text-right font-medium">
                    {formatCurrency(receipt.amount, "NGN")}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getReceiptStatusClasses(
                        receipt.status,
                      )}`}>
                      {receipt.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <PaymentMethodBadge method="Paystack" />
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openReceipt(receiptKey);
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-brand-accent/10 text-brand-accent/70 transition-colors hover:border-brand-primary/20 hover:bg-brand-primary/6 hover:text-brand-primary cursor-pointer"
                      aria-label={`View ${receipt.receiptid || receipt.id}`}>
                      <FileText size={18} />
                    </button>
                  </td>
                  <td className="px-4 py-4 align-middle text-right text-brand-accent/55 sm:px-6">
                    <div
                      className="relative inline-block"
                      data-receipt-options>
                      <button
                        type="button"
                        onClick={(event) => {
                          toggleReceiptOptions(event, receiptKey);
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-brand-accent/55 transition-colors hover:bg-brand-accent/4 hover:text-brand-accent cursor-pointer"
                        aria-label={`More actions for ${receipt.receiptid || receipt.id}`}>
                        <MoreHorizontal size={18} />
                      </button>

                      {activeOptionsReceipt === receiptKey ? (
                        <div
                          className="fixed z-9999 w-44 rounded-sm border border-brand-accent/10 bg-white shadow-lg"
                          style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                          }}>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDownloadReceipt(receiptKey);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-brand-accent transition-colors hover:bg-brand-accent/5 cursor-pointer">
                            Download receipt
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleShareReceipt(receiptKey);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-brand-accent transition-colors hover:bg-brand-accent/5 cursor-pointer">
                            Share receipt
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            }}
            renderCard={(receipt) => {
              const receiptKey = getReceiptIdentifier(receipt);
              const selectedId = selectedReceipt
                ? getReceiptIdentifier(selectedReceipt)
                : null;
              const isSelected = receiptKey === selectedId;

              return (
                <article
                  className={clsx(
                    "space-y-4 p-4 transition-colors",
                    isSelected && "bg-brand-primary/5",
                  )}>
                <button
                  type="button"
                  onClick={() => openReceipt(receiptKey)}
                    className="block w-full text-left">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-brand-accent">
                          {receipt.receiptid || receipt.id}
                        </p>
                        <p className="mt-1 text-sm text-brand-accent/60">
                          {formatDate(
                            receipt.createdat ??
                              receipt.paymentDate ??
                              receipt.date,
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-brand-accent">
                          {formatCurrency(receipt.amount, "NGN")}
                        </p>
                        <p className="mt-1 text-xs text-brand-accent/45">
                          {formatDate(
                            receipt.createdat ??
                              receipt.paymentDate ??
                              receipt.date,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getReceiptStatusClasses(
                          receipt.status,
                        )}`}>
                        {receipt.status}
                      </span>
                      <PaymentMethodBadge method="Paystack" />
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-brand-accent/8 pt-4 text-sm text-brand-accent/55">
                      <span>Open receipt details</span>
                      <div
                        className={clsx(
                          "flex h-9 w-9 items-center justify-center rounded-sm border",
                          isSelected
                            ? "border-brand-primary/20 bg-brand-primary/10 text-brand-primary"
                            : "border-brand-accent/10 bg-brand-accent/3 text-brand-accent/55",
                        )}>
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </button>
                </article>
              );
            }}
            toolbar={
              <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
                <label className="relative min-w-65 flex-1">
                  <span className="sr-only">Search receipts</span>
                  <Search
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-accent/45"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search by receipt ID, reference or method..."
                    className="h-11 w-full rounded-sm border border-brand-accent/10 bg-white px-4 pr-11 text-sm text-brand-accent placeholder:text-brand-accent/40 focus:border-brand-accent/20 focus:outline-none"
                  />
                </label>

                <DropdownUi
                  className="w-full sm:w-40"
                  buttonClassName="bg-white"
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={handleStatusChange}
                />

                <DropdownUi
                  className="w-full sm:w-40"
                  buttonClassName="bg-white"
                  options={MONTH_OPTIONS}
                  value={month}
                  onChange={handleMonthChange}
                />

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex h-11 items-center gap-2 rounded-sm border border-brand-accent/10 bg-white px-4 text-sm font-medium text-brand-accent transition-colors hover:bg-brand-accent/4 cursor-pointer">
                  <Download size={18} className="text-brand-accent/60" />
                  <span>Export</span>
                </button>
              </div>
            }
            pagination={
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemLabel="receipts"
              />
            }
          />
        </div>
      </div>

      {/* Receipt Detail Modal - Mobile Only */}
      {selectedReceipt && (
        <div className="lg:hidden">
          <Modal
            isOpen={!!selectedReceipt}
            onClose={closeReceipt}
            title="Receipt Details">
            <ReceiptDetail
              receipt={selectedReceipt}
              onClose={closeReceipt}
              variant="modal"
            />
          </Modal>
        </div>
      )}

      {/* Receipt Detail Sidebar - Desktop Only */}
      {selectedReceipt && (
        <div className="hidden lg:block fixed right-0 top-0 h-screen w-96 border-l border-brand-accent/10 bg-white overflow-y-auto">
          <ReceiptDetail
            receipt={selectedReceipt}
            onClose={closeReceipt}
            variant="sidebar"
          />
        </div>
      )}
    </div>
  );
}

export default Receipts;
