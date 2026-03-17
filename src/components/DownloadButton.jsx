import html2canvas from "html2canvas";

export default function DownloadButton({
  targetRef,
  filename,
  name,
  onEmptyName,
  t,
}) {
  const download = async () => {
    if (!name || name.trim() === "") {
      onEmptyName?.();
      return;
    }

    if (!targetRef?.current) return;

    const canvas = await html2canvas(targetRef.current, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
    });

    const link = document.createElement("a");
    link.download = filename || "card.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <button onClick={download} style={btn}>
      {t.download}
    </button>
  );
}

const btn = {
  width: "100%",
  padding: "12px 14px",
  margin: "5px 0px",
  borderRadius: 12,
  border: "1px solid #800ed2",
  background: "#800ed2",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
};