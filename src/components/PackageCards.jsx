import { useEffect, useState } from "react";
import { useApp } from "../context";
import { api, formatSar } from "../lib/api";

/** Loads the active packages once. */
export function usePackages() {
  const [packages, setPackages] = useState(null);
  const [paymentsOn, setPaymentsOn] = useState(true);
  useEffect(() => {
    api("GET", "/api/packages")
      .then((d) => {
        setPackages(d.packages);
        setPaymentsOn(d.payments !== false);
      })
      .catch(() => setPackages([]));
  }, []);
  return { packages, paymentsOn };
}

/** Buying a package: sign in if needed, create the order, go to the payment page. */
export function useBuy() {
  const { t, user, openAuth, toast, refreshUser } = useApp();
  const [buying, setBuying] = useState(null);
  const buy = async (pkg) => {
    let u = user;
    if (!u) u = await openAuth("signup", t.buyLoginReason);
    if (!u) return;
    setBuying(pkg.id);
    try {
      const { url } = await api("POST", "/api/orders", { packageId: pkg.id });
      if (url.startsWith("#")) {
        // demo backend: paid instantly
        await refreshUser();
        window.location.hash = url.slice(1);
      } else {
        window.location.href = url;
      }
    } catch (e) {
      toast(e.code === "payments_off" ? t.paymentsOff : t.paymentError);
    } finally {
      setBuying(null);
    }
  };
  return { buy, buying };
}

export default function PackageCards({ compact = false }) {
  const { t, lang } = useApp();
  const { packages, paymentsOn } = usePackages();
  const { buy, buying } = useBuy();

  if (!packages) {
    return (
      <div className="packages">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="package-card skeleton" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={`packages${compact ? " packages-compact" : ""}`}>
        {packages.map((p) => {
          const per = p.price / p.credits / 100;
          return (
            <div key={p.id} className={`package-card${p.badge[lang] ? " package-featured" : ""}`}>
              {p.badge[lang] && <span className="package-badge">{p.badge[lang]}</span>}
              <h3>{p.name[lang]}</h3>
              <p className="package-credits">
                <strong>{p.credits}</strong> {p.credits === 1 ? t.certOne : t.certMany}
              </p>
              <p className="package-price">{formatSar(p.price, lang)}</p>
              {p.credits > 1 && (
                <p className="package-per">
                  {t.perCertificate} {per.toFixed(2).replace(/\.?0+$/, "")} {lang === "ar" ? "ر.س" : "SAR"}
                </p>
              )}
              <button className="btn btn-primary" onClick={() => buy(p)} disabled={buying !== null || !paymentsOn}>
                {buying === p.id ? t.redirecting : t.buy}
              </button>
            </div>
          );
        })}
      </div>
      {!paymentsOn && <p className="hint">{t.paymentsOff}</p>}
    </>
  );
}
