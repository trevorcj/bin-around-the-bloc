import { Fragment } from "react";
import clsx from "clsx";

const RESPONSIVE_CLASSES = {
  sm: {
    desktop: "hidden sm:block",
    mobile: "sm:hidden",
  },
  md: {
    desktop: "hidden md:block",
    mobile: "md:hidden",
  },
  lg: {
    desktop: "hidden lg:block",
    mobile: "lg:hidden",
  },
  xl: {
    desktop: "hidden xl:block",
    mobile: "xl:hidden",
  },
};

const DEFAULT_HEADER_CELL_CLASS =
  "px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent/45";

function getRowKey(row, index, keyExtractor) {
  if (keyExtractor) {
    return keyExtractor(row, index);
  }
  return row.id ?? row._id ?? index;
}

function Table({
  data = [],
  columns = [],
  renderRow,
  renderCard,
  keyExtractor,
  title,
  subtitle,
  actions,
  toolbar,
  footer,
  pagination,
  isLoading = false,
  error = null,
  emptyState = "No records found, make a payment.",
  responsiveAt = "md",
  sectionClassName,
  desktopContainerClassName,
  tableClassName,
  headerClassName,
  mobileContainerClassName,
  isPlaceholderData,
}) {
  const responsiveClasses =
    RESPONSIVE_CLASSES[responsiveAt] ?? RESPONSIVE_CLASSES.md;
  const hasData = Array.isArray(data) && data.length > 0;
  const showHeader = title || subtitle || actions;

  return (
    <section
      className={clsx(
        "rounded-sm border border-brand-accent/10 bg-white overflow-hidden",
        sectionClassName,
      )}>
      {/* Table Header Area */}
      {showHeader ? (
        <div className="flex flex-col gap-4 border-b border-brand-accent/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? (
              <h3 className="text-xl font-semibold text-brand-accent">
                {title}
              </h3>
            ) : null}

            {subtitle ? (
              <p className="mt-1 text-sm text-brand-accent/55">{subtitle}</p>
            ) : null}
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      {toolbar ? (
        <div className="border-b border-brand-accent/8 bg-brand-accent/1 py-3">
          {toolbar}
        </div>
      ) : null}

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          {/* Subtle spinning circular indicator */}
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-accent/20 border-t-brand-secondary mb-3" />
          <p className="text-sm font-medium text-brand-accent/60 animate-pulse">
            Fetching transaction history...
          </p>
        </div>
      )}

      {/* ─── 2. ERROR STATE ─── */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-status-error/2">
          <p className="text-sm font-medium text-status-error">
            Failed to load data
          </p>
          <p className="mt-1 text-xs text-brand-accent/45 max-w-sm">
            Please refresh the page or try again later
          </p>
        </div>
      )}

      {/* ─── 3. EMPTY STATE ─── */}
      {!isLoading && !error && !hasData && (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <p className="text-sm text-brand-accent/40 font-medium">
            {emptyState}
          </p>
        </div>
      )}

      {!isLoading && !error && hasData && (
        <div
          className={isPlaceholderData ? "opacity-50 pointer-events-none" : ""}>
          {/* desktop */}
          <div
            className={clsx(
              "overflow-x-auto",
              responsiveClasses.desktop,
              desktopContainerClassName,
            )}>
            <table
              className={clsx(
                "w-full table-auto border-collapse text-sm text-brand-accent",
                tableClassName,
              )}>
              <thead
                className={clsx(
                  "bg-brand-accent/1.5 border-b border-brand-accent/8",
                  headerClassName,
                )}>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={clsx(
                        DEFAULT_HEADER_CELL_CLASS,
                        col.align === "right" ? "text-right" : "text-left",
                      )}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-accent/8">
                {data.map((row, index) => (
                  <Fragment key={getRowKey(row, index, keyExtractor)}>
                    {renderRow(row, index)}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile */}
          <div
            className={clsx(
              "divide-y divide-brand-accent/8",
              responsiveClasses.mobile,
              mobileContainerClassName,
            )}>
            {data.map((row, index) => (
              <Fragment key={getRowKey(row, index, keyExtractor)}>
                {renderCard(row, index)}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {footer || pagination ? (
        <div className="border-t border-brand-accent/10 px-6 py-4 bg-brand-accent/1.5">
          {footer}
          {pagination}
        </div>
      ) : null}
    </section>
  );
}

export default Table;
