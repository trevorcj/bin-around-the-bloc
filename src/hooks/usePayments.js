import { useQuery } from "@tanstack/react-query";
import getPayments from "../api/getPayments";

export default function usePayments(filters) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: () => getPayments(filters),
    keepPreviousData: true,
  });
}
