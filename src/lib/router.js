import { useEffect, useState } from "react";

// Hash routing works on GitHub Pages without any server rewrites:
//   #/                 home
//   #/o/<occasionId>   card editor
//   #/certificates     teacher certificates

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

  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "o" && parts[1]) return { page: "editor", occasionId: decodeURIComponent(parts[1]) };
  if (parts[0] === "certificates") return { page: "certificates" };
  return { page: "home" };
}

export function navigate(path) {
  window.location.hash = path;
}
