import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../context";
import { navigate } from "../lib/router";
import { GROUPS, OCCASIONS } from "../data/occasions";

/** Side menu (☰) to jump straight to any occasion or the certificates page. */
export default function MenuDrawer({ open, onClose, current }) {
  const { t, lang } = useApp();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const go = (path) => {
    onClose();
    navigate(path);
  };

  return createPortal(
    <div className="drawer-overlay" onClick={onClose} dir={lang === "ar" ? "rtl" : "ltr"}>
      <nav className="drawer" aria-label={t.menu} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <strong>{t.menu}</strong>
          <button className="icon-button" onClick={onClose} aria-label={t.close} autoFocus>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="drawer-links">
          <button className="drawer-link" aria-current={current === "home"} onClick={() => go("/")}>
            {t.home}
          </button>
          <button
            className="drawer-link"
            aria-current={current === "certificates"}
            onClick={() => go("/certificates")}
          >
            {t.certificatesCta}
          </button>
        </div>

        {GROUPS.map((group) => (
          <div key={group.id} className="drawer-group">
            <p className="drawer-group-title">{group.name[lang]}</p>
            {OCCASIONS.filter((o) => o.group === group.id).map((o) => (
              <button
                key={o.id}
                className="drawer-link"
                aria-current={current === o.id}
                onClick={() => go(`/o/${o.id}`)}
              >
                <span className="dot" style={{ background: o.theme.accent }} />
                {o.name[lang]}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </div>,
    document.body
  );
}
