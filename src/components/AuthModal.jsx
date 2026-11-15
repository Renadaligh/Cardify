import { useState } from "react";
import { useApp } from "../context";
import { api } from "../lib/api";
import Modal from "./Modal";
import { Field, Segmented } from "./Controls";

/** Sign in / create account. onDone(user) after success. */
export default function AuthModal({ initialMode = "signup", reason, onDone, onClose }) {
  const { t } = useApp();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data =
        mode === "signup"
          ? await api("POST", "/api/auth/signup", { email, password, name, org })
          : await api("POST", "/api/auth/login", { email, password });
      onDone(data.user);
    } catch (err) {
      setError(t.authErrors[err.code] || t.authErrors.server_error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={mode === "signup" ? t.authSignupTitle : t.authLoginTitle} onClose={busy ? undefined : onClose}>
      {reason && <p>{reason}</p>}
      <Segmented
        label={t.authLoginTitle}
        value={mode}
        onChange={(v) => {
          setMode(v);
          setError("");
        }}
        options={[
          { value: "signup", label: t.authSignup },
          { value: "login", label: t.authLogin },
        ]}
      />
      <form className="auth-form" onSubmit={submit}>
        {mode === "signup" && (
          <div className="row-2">
            <Field label={t.authName} htmlFor="auth-name">
              <input id="auth-name" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t.authOrg} htmlFor="auth-org">
              <input
                id="auth-org"
                className="input"
                value={org}
                maxLength={120}
                placeholder={t.authOrgPlaceholder}
                onChange={(e) => setOrg(e.target.value)}
              />
            </Field>
          </div>
        )}
        <Field label={t.authEmail} htmlFor="auth-email">
          <input
            id="auth-email"
            className="input"
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={t.authPassword} htmlFor="auth-password" hint={mode === "signup" ? t.authPasswordHint : undefined}>
          <input
            id="auth-password"
            className="input"
            type="password"
            dir="ltr"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={mode === "signup" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {mode === "signup" ? t.authSignupButton : t.authLoginButton}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={busy}>
            {t.cancel}
          </button>
        </div>
        {mode === "signup" && <p className="hint">{t.authBonusNote}</p>}
      </form>
    </Modal>
  );
}
