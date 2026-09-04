import manta from "../services/manta";

const itemsPerPage = 5;

export default async function getPayments({
  search = "",
  status = "all",
  month = "all",
  page = 1,
}) {
  const userEmail = sessionStorage.getItem("userEmail");

  const filters = {};

  if (status !== "all") {
    filters.status = status.charAt(0).toUpperCase() + status.slice(1);
  }

  if (month !== "all") {
    filters.month = month;
  }

  const payments = await manta.fetchAllRecords({
    table: "batb-payments",
    where: { ...filters, email: userEmail },
    page,
    list: itemsPerPage,
    orderBy: "createdat",
    order: "desc",
    search: {
      columns: ["receiptid", "month", "year"],
      query: search,
    },
  });

  return {
    data: payments?.data,
    totalPages: payments?.meta?.totalPages,
    total: payments?.meta?.total,
    itemsPerPage,
  };
}
