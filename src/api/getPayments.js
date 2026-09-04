import supabase from "../services/supabase";

const itemsPerPage = 5;

export default async function getPayments({
  search = "",
  status = "all",
  month = "all",
  page = 1,
}) {
  const userEmail = sessionStorage.getItem("userEmail");

  if (!userEmail) {
    return {
      data: [],
      totalPages: 1,
      total: 0,
      itemsPerPage,
    };
  }

  let query = supabase
    .from("payments")
    .select("*", { count: "exact" })
    .ilike("email", userEmail);

  if (status !== "all") {
    query = query.ilike("status", status);
  }

  if (month !== "all") {
    query = query.ilike("month", month);
  }

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(
      `receiptid.ilike.%${term}%,month.ilike.%${term}%,year.ilike.%${term}%,reference.ilike.%${term}%`
    );
  }

  const from = (page - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  query = query.order("createdat", { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching payments from Supabase:", error);
    throw new Error(error.message);
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return {
    data: data || [],
    totalPages,
    total,
    itemsPerPage,
  };
}

