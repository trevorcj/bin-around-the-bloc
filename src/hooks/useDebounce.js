import { useEffect, useState } from "react";

export default function useDebounce(query, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    const intervalId = setTimeout(() => setDebouncedValue(query), delay);

    return () => {
      clearInterval(intervalId);
    };
  }, [query, delay]);

  return debouncedValue;
}
