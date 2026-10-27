import { useCallback, useEffect, useState } from "react";
import { useApp } from "../context";
import { navigate } from "../lib/router";
import MenuDrawer from "./MenuDrawer";
import { GROUPS } from "../data/occasions";

export default function TopBar({ current }) {
  const isHome = current === "home";
  const [scrolled, setScrolled] = useState(false);
  const [moved, setMoved] = useState(false);

  // Transparent over the home sky; a frosted bar once the page scrolls.
  useEffect(() => {
    const onScroll = () => {
      const hero = isHome ? document.querySelector(".hero-sky") : null;
      const limit = hero ? hero.offsetHeight - 120 : 8;
      setScrolled(window.scrollY > limit);
      setMoved(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isHome]);

  const onSky = isHome && !scrolled;

  // The bar is fixed, so other pages get a spacer with its resting height (no jump when it shrinks).
  const { t, lang, setLang, showCategory, occasionFilter } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const base = import.meta.env.BASE_URL;

  return (
    <>
    {!isHome && <div className="topbar-spacer" aria-hidden="true" />}
    <header dir="ltr" className={`topbar${onSky ? " topbar-on-sky" : ""}${onSky && moved ? " topbar-sky-glass" : ""}${scrolled ? " topbar-scrolled" : ""}${moved ? " topbar-floating" : ""}`}>
      {/* Fixed sides in both languages: logo on the left, categories in the middle (desktop),
          language (and ☰ on smaller screens) on the right. */}
      <button className="logo-button" onClick={() => navigate("/")} aria-label={t.home}>
        <img className="hero-logo" src={`${base}logos/Mylogo.png`} alt="Logo" />
      </button>

      <nav className="topbar-nav" dir={lang === "ar" ? "rtl" : "ltr"} aria-label={t.occasionsTitle}>
        {GROUPS.map((g) => (
          <button
            key={g.id}
            className="nav-link"
            aria-current={isHome && occasionFilter === g.id ? "true" : undefined}
            onClick={() => showCategory(g.id)}
          >
            {g.name[lang]}
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <button className="pill-toggle" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
          <img src={`${base}logos/LanguageDark.png`} alt="" />
          <span>{lang === "ar" ? t.english : t.arabic}</span>
        </button>
        <button
          className="icon-button menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label={t.menu}
          aria-expanded={menuOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <MenuDrawer open={menuOpen} onClose={closeMenu} current={current} />
    </header>
    </>
  );
}
