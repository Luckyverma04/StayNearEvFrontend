import { useLocation } from "react-router-dom";

/* Login ke baad wapas wahi page jahan se user aaya tha
   (jaise station detail par "Book" dabaya tha) */
export const useRedirectTarget = () => {
  const location = useLocation();
  const fromState = location.state?.from;
  const fromQuery = new URLSearchParams(location.search).get("redirect");
  const raw = fromState ? `${fromState.pathname}${fromState.search || ""}` : fromQuery || "/";
  // Sirf apni site ke andar ka path allow karo (open redirect se bachne ke liye)
  return raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/login") ? raw : "/";
};
