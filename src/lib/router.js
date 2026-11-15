import { useEffect, useState } from "react";

// Hash routing works on GitHub Pages without any server rewrites:
//   #/                 home
//   #/o/<occasionId>   card editor
//   #/certificates     certificates (paid, issued with a serial number)
//   #/account          customer dashboard
//   #/admin            admin dashboard
//   #/v/<serial>       certificate verification (opened from the QR code)
//   #/m/<id>           image or audio behind a card's QR code

function readHash() {
  const path = window.location.hash.replace(/^#/, "") || "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function useRoute() {
  const [path, setPath] = useState(readHash);

  useEffect(() => {
    const onChange = () => {
      setPath(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const [pathname, qs] = path.split("?");
  const query = Object.fromEntries(new URLSearchParams(qs || ""));
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "o" && parts[1]) return { page: "editor", occasionId: decodeURIComponent(parts[1]), query };
  if (parts[0] === "certificates") return { page: "certificates", query };
  if (parts[0] === "account") return { page: "account", query };
  if (parts[0] === "admin") return { page: "admin", query };
  if (parts[0] === "v" && parts[1]) return { page: "verify", serial: decodeURIComponent(parts[1]), query };
  if (parts[0] === "m" && parts[1]) return { page: "media", mediaId: decodeURIComponent(parts[1]), query };
  return { page: "home", query };
}

export function navigate(path) {
  window.location.hash = path;
}
