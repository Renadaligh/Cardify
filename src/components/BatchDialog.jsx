import { useState } from "react";
import { useApp } from "../context";
import { namesFromFile, namesFromText } from "../lib/names";
import { downloadBlob } from "../lib/files";
import Modal from "./Modal";
import { FileButton } from "./Controls";

const MAX = 300;

/**
 * Collects a list of names (typed or from Excel/CSV) and builds one file for all of them.
 * build(names, onProgress) must return a Blob.
 */
export default function BatchDialog({ title, intro, onClose, validate, build, outputName }) {
  const { t, toast } = useApp();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);

  const names = namesFromText(text);

  const onFile = async (file) => {
    setError("");
    try {
      const list = await namesFromFile(file);
      if (!list.length) throw new Error("empty");
      setText(list.join("\n"));
    } catch {
      setError(t.fileError);
    }
  };

  const run = async () => {
    setError("");
    const problem = validate?.();
    if (problem) return setError(problem);
    if (!names.length) return setError(t.batchEmpty);
    if (names.length > MAX) return setError(t.batchTooMany(MAX));
    try {
      setProgress(0);
      const blob = await build(names, (i) => setProgress(i));
      downloadBlob(blob, outputName);
      toast(t.batchDone);
      onClose();
    } catch {
      setError(t.fileError);
      setProgress(null);
    }
  };

  const running = progress !== null;

  return (
    <Modal
      title={title || t.batchTitle}
      onClose={running ? undefined : onClose}
      actions={
        <>
          <button className="btn btn-primary" onClick={run} disabled={running}>
            {running ? t.generating(progress, names.length) : t.generate}
          </button>
          <button className="btn btn-ghost" onClick={onClose} disabled={running}>
            {t.cancel}
          </button>
        </>
      }
    >
      <p>{intro}</p>
      <textarea
        className="textarea"
        rows={7}
        value={text}
        placeholder={t.batchPlaceholder}
        onChange={(e) => setText(e.target.value)}
        disabled={running}
      />
      <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}>
        <FileButton label={t.uploadList} accept=".xlsx,.csv,.txt" onFile={onFile} />
        <span className="hint" style={{ margin: 0 }}>
          {t.namesCount(names.length)}
        </span>
      </div>
      {running && (
        <div className="progress" aria-hidden="true">
          <div style={{ width: `${(progress / Math.max(1, names.length)) * 100}%` }} />
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </Modal>
  );
}
