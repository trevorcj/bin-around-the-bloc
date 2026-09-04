import { useQuery } from "@tanstack/react-query";
import getPayments from "../api/getPayments";

export default function usePayments(filters) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: () => getPayments(filters),
    keepPreviousData: true,
  });
}

// TODO:
// 1. Connect receipt page to DB ✅
// 2. useSearchParams (filters), pagination ✅
// 3. Accept month, year, and dynamic amount inputs in '/payment'
// 5. Payment page inputs -> DB
// 6. Connect Paystack
// 7. Dashboard (last payment), days till next payment
// 8. Send mail: account creation, payment made, day of next payment
// 9. UI Refinements (too much space on mobile - login & pagination component, eye button on password input, support icon on mobile, support numbers, receipt viewing on mobile - turn to a modal)
// 10. Turn to a PWA
