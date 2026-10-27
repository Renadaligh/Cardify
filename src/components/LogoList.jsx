import { useEffect, useRef, useState } from "react";
import { useApp } from "../context";
import { readImageFile } from "../lib/files";
import { FileButton } from "./Controls";

export const MAX_LOGOS = 4;
const LONG_PRESS_MS = 300;

/**
 * Several logos, each with its own size. logos: [{ id, img, url, scale }]
 * Order matters (it decides where each logo goes), so logos can be reordered with
 * the arrows, by dragging the grip, or by a long press and drag anywhere on a row.
 */
export default function LogoList({ logos, onChange, onRemoved, describe, hint }) {
  const { t, toast } = useApp();
  const listRef = useRef(null);
  const rowRefs = useRef({});
  const press = useRef(null);
  const [dragId, setDragId] = useState(null);
  const dragRef = useRef(null);
  const logosRef = useRef(logos);
  logosRef.current = logos;

  const add = async (file) => {
    try {
      const img = await readImageFile(file);
      onChange([...logos, { id: `${Date.now()}`, img, url: img.src, scale: 1 }]);
    } catch {
      toast(t.fileError);
    }
  };

  const update = (id, patch) => onChange(logos.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const move = (from, to) => {
    const list = [...logosRef.current];
    if (to < 0 || to >= list.length || from === to) return;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    onChange(list);
  };

  const remove = (id) => {
    onChange(logos.filter((l) => l.id !== id));
    onRemoved?.();
  };

  // While dragging on a phone, stop the page from scrolling.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onTouchMove = (e) => {
      if (dragRef.current) e.preventDefault();
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  const startDrag = (id) => {
    dragRef.current = id;
    setDragId(id);
    navigator.vibrate?.(12);
  };

  // During a drag, follow the pointer anywhere on the page (rows move under it as they reorder).
  useEffect(() => {
    if (!dragId) return;
    window.addEventListener("pointermove", dragTo);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", dragTo);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId]);

  const onPointerDown = (e, id) => {
    if (logos.length < 2 || e.target.closest("button, input, label.file-button")) return;
    const onGrip = !!e.target.closest(".drag-grip");
    if (onGrip && e.pointerType === "mouse") {
      e.preventDefault();
      startDrag(id);
      return;
    }
    const timer = setTimeout(() => startDrag(id), LONG_PRESS_MS);
    press.current = { timer, x: e.clientX, y: e.clientY };
  };

  // Moving before the long press completes means the user is scrolling, not dragging.
  const onPointerMove = (e) => {
    if (press.current && !dragRef.current) {
      const moved = Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y);
      if (moved > 8) cancelPress();
    }
  };

  const dragTo = (e) => {
    const id = dragRef.current;
    if (!id) return;
    const list = logosRef.current;
    const from = list.findIndex((l) => l.id === id);
    let to = from;
    list.forEach((l, i) => {
      const rect = rowRefs.current[l.id]?.getBoundingClientRect();
      if (!rect || l.id === id) return;
      const mid = rect.top + rect.height / 2;
      if (i < from && e.clientY < mid) to = Math.min(to, i);
      if (i > from && e.clientY > mid) to = Math.max(to, i);
    });
    if (to !== from) move(from, to);
  };

  const cancelPress = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };

  const endDrag = () => {
    cancelPress();
    dragRef.current = null;
    setDragId(null);
  };

  return (
    <div className="logo-list" ref={listRef}>
      {logos.map((logo, i) => (
        <div
          key={logo.id}
          ref={(el) => (rowRefs.current[logo.id] = el)}
          className={`logo-item${dragId === logo.id ? " is-dragging" : ""}`}
          onPointerDown={(e) => onPointerDown(e, logo.id)}
          onPointerMove={onPointerMove}
          onPointerUp={() => !dragRef.current && cancelPress()}
          onPointerCancel={() => !dragRef.current && cancelPress()}
          onContextMenu={(e) => press.current && e.preventDefault()}
        >
          {logos.length > 1 && (
            <div className="reorder">
              <button
                type="button"
                className="arrow-button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                aria-label={t.moveUp}
                title={t.moveUp}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="drag-grip" title={t.dragToReorder} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24">
                  {[6, 12, 18].map((y) =>
                    [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill="currentColor" />)
                  )}
                </svg>
              </span>
              <button
                type="button"
                className="arrow-button"
                onClick={() => move(i, i + 1)}
                disabled={i === logos.length - 1}
                aria-label={t.moveDown}
                title={t.moveDown}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
          <img className="logo-preview" src={logo.url} alt="" draggable={false} />
          <div className="logo-item-body">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <label htmlFor={`logo-size-${logo.id}`} className="field-label" style={{ margin: 0 }}>
                {t.logoN(i + 1)} · {Math.round(logo.scale * 100)}%
                {describe && <span className="logo-role">{describe(i)}</span>}
              </label>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => remove(logo.id)}>
                {t.removeLogo}
              </button>
            </div>
            <input
              id={`logo-size-${logo.id}`}
              type="range"
              min="0.4"
              max="2.5"
              step="0.05"
              value={logo.scale}
              aria-label={t.logoSize}
              onChange={(e) => update(logo.id, { scale: Number(e.target.value) })}
            />
          </div>
        </div>
      ))}

      {logos.length < MAX_LOGOS && (
        <div>
          <FileButton
            label={logos.length ? t.addLogo : t.uploadLogo}
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            onFile={add}
          />
        </div>
      )}
      <p className="hint" style={{ margin: 0 }}>
        {hint || t.logosHint(MAX_LOGOS)} {logos.length > 1 && t.reorderHint} {t.logoPrivacy}
      </p>
    </div>
  );
}
