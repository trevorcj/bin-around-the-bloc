import { parseISO, format } from "date-fns";

export default function formatDate(isoString, options = {}) {
  if (!isoString) return "";

  const { includeTime = false, shortMonth = false } = options;

  const date = parseISO(isoString);

  const monthToken = shortMonth ? "LLL" : "LLLL";

  let pattern = `${monthToken} d, yyyy`;

  if (includeTime) {
    pattern += " h:mm a";
  }

  return format(date, pattern);
}
