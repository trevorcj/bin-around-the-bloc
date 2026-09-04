import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  className,
  itemLabel = "results",
}) {
  const numericCurrentPage = Number(currentPage) || 1;
  const numericTotalPages = Number(totalPages) || 1;
  const numericTotalItems = Number(totalItems) || 0;
  const numericItemsPerPage = Number(itemsPerPage) || 10;

  const safeCurrentPage = Math.max(1, numericCurrentPage);
  const safeTotalPages = Math.max(1, numericTotalPages);

  const canGoBack = safeCurrentPage > 1;
  const canGoForward = safeCurrentPage < safeTotalPages;

  const startItem =
    numericTotalItems === 0
      ? 0
      : (safeCurrentPage - 1) * numericItemsPerPage + 1;

  const endItem = Math.min(
    safeCurrentPage * numericItemsPerPage,
    numericTotalItems,
  );

  const pages = Array.from({ length: safeTotalPages }, (_, index) => index + 1);

  function handlePageChange(page) {
    if (page < 1 || page > safeTotalPages) {
      return;
    }

    if (page === safeCurrentPage) {
      return;
    }

    onPageChange(page);
  }

  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-4  px-6 py-4",
        className,
      )}>
      <div className="flex flex-1 flex-col gap-4 sm:hidden">
        <p className="text-sm text-brand-accent/60">
          Showing{" "}
          <span className="font-medium text-brand-accent">{startItem}</span> to{" "}
          <span className="font-medium text-brand-accent">{endItem}</span> of{" "}
          <span className="font-medium text-brand-accent">{totalItems}</span>{" "}
          {itemLabel}
        </p>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => handlePageChange(safeCurrentPage - 1)}
            disabled={!canGoBack}
            className="relative inline-flex cursor-pointer items-center rounded-sm border border-brand-accent/10 bg-brand-accent/5 px-4 py-2 text-sm font-medium text-brand-accent hover:bg-brand-accent/10 disabled:cursor-not-allowed disabled:opacity-30">
            Previous
          </button>

          <button
            type="button"
            onClick={() => handlePageChange(safeCurrentPage + 1)}
            disabled={!canGoForward}
            className="relative ml-3 inline-flex cursor-pointer items-center rounded-sm border border-brand-accent/10 bg-brand-accent/5 px-4 py-2 text-sm font-medium text-brand-accent hover:bg-brand-accent/10 disabled:cursor-not-allowed disabled:opacity-30">
            Next
          </button>
        </div>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-brand-accent/60">
            Showing{" "}
            <span className="font-medium text-brand-accent">{startItem}</span>{" "}
            to <span className="font-medium text-brand-accent">{endItem}</span>{" "}
            of{" "}
            <span className="font-medium text-brand-accent">{totalItems}</span>{" "}
            {itemLabel}
          </p>
        </div>

        <div>
          <nav
            className="isolate inline-flex -space-x-px gap-1"
            aria-label="Pagination">
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={!canGoBack}
              className="relative inline-flex items-center rounded-sm px-2 py-2 text-brand-accent/60 ring-1 ring-inset ring-brand-accent/10 hover:bg-brand-accent/5 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-30">
              <ChevronLeft size={18} />
            </button>

            {pages.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={clsx(
                  "relative inline-flex cursor-pointer items-center rounded-sm px-4 py-2 text-sm font-semibold focus:z-0",
                  page === safeCurrentPage
                    ? "z-0 bg-brand-accent text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                    : "text-brand-accent ring-1 ring-inset ring-brand-accent/10 hover:bg-brand-accent/5 focus:outline-offset-0",
                )}>
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={!canGoForward}
              className="relative inline-flex items-center rounded-sm px-2 py-2 text-brand-accent/60 ring-1 ring-inset ring-brand-accent/10 hover:bg-brand-accent/5 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-30">
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default Pagination;
