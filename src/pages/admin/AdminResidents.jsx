import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronRight, Download } from "lucide-react";
import clsx from "clsx";
import useAuth from "../../hooks/useAuth";
import {
  getEstateResidents,
  getEstateStreets,
  getEstatePropertyTypes,
} from "../../api/adminApi";
import { StyledH1 } from "../../styles/CommonStyles";
import Table from "../../ui/Table";
import DropdownUi from "../../ui/DropdownUi";
import Pagination from "../../ui/Pagination";
import AdminResidentDetailModal from "./AdminResidentDetailModal";
import formatCurrency from "../../utils/formatCurrency";
import useDebounce from "../../hooks/useDebounce";
import { downloadCsv } from "../../utils/receiptUtils";
import formatDate from "../../utils/formatDate";

const RESIDENT_COLUMNS = [
  { key: "resident", label: "Resident" },
  { key: "property", label: "Property Info" },
  { key: "category", label: "Category" },
  { key: "outstanding", label: "Balance", align: "right" },
  { key: "status", label: "Status" },
  { key: "action", label: "", className: "w-10 text-right" },
];

function AdminResidents() {
  const { user } = useAuth();
  const estateId = user?.estate_id;

  const [search, setSearch] = useState("");
  const [selectedStreetId, setSelectedStreetId] = useState("all");
  const [selectedPropertyTypeId, setSelectedPropertyTypeId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResidentId, setSelectedResidentId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  // Fetch streets and property types for filter dropdowns
  const { data: streets = [] } = useQuery({
    queryKey: ["estateStreets", estateId],
    queryFn: () => getEstateStreets(estateId, true),
    enabled: !!estateId,
  });

  const { data: propertyTypes = [] } = useQuery({
    queryKey: ["estatePropertyTypes", estateId],
    queryFn: () => getEstatePropertyTypes(estateId, true),
    enabled: !!estateId,
  });

  // Fetch residents list
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "adminResidents",
      estateId,
      debouncedSearch,
      selectedStreetId,
      selectedPropertyTypeId,
      currentPage,
    ],
    queryFn: () =>
      getEstateResidents(estateId, {
        search: debouncedSearch,
        streetId: selectedStreetId,
        propertyTypeId: selectedPropertyTypeId,
        page: currentPage,
        limit: 10,
      }),
    enabled: !!estateId,
  });

  const residents = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;
  const itemsPerPage = data?.itemsPerPage || 10;

  const streetOptions = [
    { label: "All Streets", value: "all" },
    ...streets.map((s) => ({ label: s.name, value: s.id })),
  ];

  const propertyTypeOptions = [
    { label: "All Property Types", value: "all" },
    ...propertyTypes.map((pt) => ({ label: pt.name, value: pt.id })),
  ];

  function handleExportCsv() {
    if (residents.length === 0) return;

    const exportData = residents.map((r) => ({
      name: r.fullname,
      email: r.email,
      phone: r.phone || "N/A",
      propertyNumber: r.housenumber || "N/A",
      street: r.streetname || "N/A",
      propertyType: r.property_type_name || "N/A",
      outstandingBalance: formatCurrency(r.totalOutstanding || 0, "NGN"),
      status: r.status,
      registeredDate: formatDate(r.created_at),
    }));

    downloadCsv(exportData, "estate_residents.csv", [
      { key: "name", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "propertyNumber", label: "Property Number" },
      { key: "street", label: "Street" },
      { key: "propertyType", label: "Property Type" },
      { key: "outstandingBalance", label: "Outstanding Balance" },
      { key: "status", label: "Status" },
      { key: "registeredDate", label: "Joined Date" },
    ]);
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <StyledH1>Estate Residents</StyledH1>
        <p className="text-brand-accent/80 mt-1">
          Directory of registered residents and their outstanding billing accounts.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-white p-4 border border-brand-accent/10 rounded-sm">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-accent/40"
          />
          <input
            type="search"
            placeholder="Search by name, email, or property number…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full rounded-sm border border-brand-accent/10 bg-brand-accent/3 px-3 pr-10 text-sm text-brand-accent placeholder:text-brand-accent/40 focus:border-brand-accent/25 focus:outline-none"
          />
        </div>

        <div className="w-full lg:w-48">
          <DropdownUi
            options={streetOptions}
            value={selectedStreetId}
            onChange={(val) => {
              setSelectedStreetId(val);
              setCurrentPage(1);
            }}
            buttonClassName="bg-white"
          />
        </div>

        <div className="w-full lg:w-48">
          <DropdownUi
            options={propertyTypeOptions}
            value={selectedPropertyTypeId}
            onChange={(val) => {
              setSelectedPropertyTypeId(val);
              setCurrentPage(1);
            }}
            buttonClassName="bg-white"
          />
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-brand-accent/10 px-4 text-sm font-medium text-brand-accent hover:bg-brand-accent/5 transition-colors cursor-pointer shrink-0">
          <Download size={16} /> Export
        </button>
      </div>

      {/* Residents Table */}
      <Table
        data={residents}
        columns={RESIDENT_COLUMNS}
        responsiveAt="md"
        emptyState="No residents found. Share your estate code to start onboarding residents."
        isLoading={isLoading}
        error={error}
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="residents"
          />
        }
        renderRow={(row) => (
          <tr
            key={row.id}
            tabIndex={0}
            role="button"
            onClick={() => setSelectedResidentId(row.id)}
            className="border-b border-brand-accent/8 transition-colors last:border-b-0 hover:bg-brand-accent/[0.018] cursor-pointer group">
            <td className="px-6 py-4">
              <div className="space-y-0.5">
                <p className="font-semibold text-brand-accent">{row.fullname}</p>
                <p className="text-xs text-brand-accent/50">{row.email}</p>
              </div>
            </td>

            <td className="px-6 py-4">
              <div className="space-y-0.5">
                <p className="font-medium text-brand-accent">
                  {row.housenumber ? `House ${row.housenumber}` : "No number"}
                  {row.apartment ? `, ${row.apartment}` : ""}
                </p>
                <p className="text-xs text-brand-accent/50">{row.streetname}</p>
              </div>
            </td>

            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-sm bg-brand-accent/5 text-brand-accent">
                {row.property_type_name || "House"}
              </span>
            </td>

            <td className="px-6 py-4 text-right">
              <span
                className={clsx(
                  "font-semibold text-sm",
                  row.totalOutstanding > 0
                    ? "text-brand-secondary"
                    : "text-status-success"
                )}>
                {formatCurrency(row.totalOutstanding || 0, "NGN")}
              </span>
            </td>

            <td className="px-6 py-4">
              <span
                className={clsx(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                  row.status === "Active"
                    ? "bg-status-success/10 text-status-success"
                    : "bg-brand-accent/10 text-brand-accent"
                )}>
                {row.status}
              </span>
            </td>

            <td className="px-6 py-4 text-right text-brand-accent/40 group-hover:text-brand-accent">
              <ChevronRight size={18} />
            </td>
          </tr>
        )}
        renderCard={(row) => (
          <article
            key={row.id}
            onClick={() => setSelectedResidentId(row.id)}
            className="p-4 space-y-3 cursor-pointer hover:bg-brand-accent/2 border-b border-brand-accent/8 last:border-b-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-brand-accent">{row.fullname}</p>
                <p className="text-xs text-brand-accent/50">{row.email}</p>
              </div>
              <span
                className={clsx(
                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                  row.status === "Active"
                    ? "bg-status-success/10 text-status-success"
                    : "bg-brand-accent/10 text-brand-accent"
                )}>
                {row.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-brand-accent/70 pt-2 border-t border-brand-accent/5">
              <span>
                {row.housenumber ? `House ${row.housenumber}` : ""}, {row.streetname} ({row.property_type_name || "House"})
              </span>
              <span
                className={clsx(
                  "font-bold text-sm",
                  row.totalOutstanding > 0
                    ? "text-brand-secondary"
                    : "text-status-success"
                )}>
                {formatCurrency(row.totalOutstanding || 0, "NGN")}
              </span>
            </div>
          </article>
        )}
      />

      {/* Detail Modal */}
      {selectedResidentId && (
        <AdminResidentDetailModal
          isOpen={!!selectedResidentId}
          onClose={() => setSelectedResidentId(null)}
          residentId={selectedResidentId}
        />
      )}
    </div>
  );
}

export default AdminResidents;
