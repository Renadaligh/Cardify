import { forwardRef, useEffect, useRef, useState } from "react";
import "../styles/card.css";

const CardPreview = forwardRef(function CardPreview(
  { template, name, t, exportMode = false },
  ref
) {
  const localRef = useRef(null);
  const [previewWidth, setPreviewWidth] = useState(0);

  if (!template) return null;

  const exportWidth = template.exportWidth || 1080;
  const exportFontSize = template.textStyle.exportFontSize || 30;

  useEffect(() => {
    if (exportMode || !localRef.current) return;

    const element = localRef.current;

    const updateWidth = () => {
      setPreviewWidth(element.offsetWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [exportMode]);

  const scale =
    !exportMode && previewWidth > 0 ? previewWidth / exportWidth : 1;

  const computedTextStyle = {
    ...template.textStyle,
    fontSize: `${exportFontSize * scale}px`,
  };

  const exportTextStyle = {
    ...template.textStyle,
    fontSize: `${exportFontSize}px`,
  };

  const wrapperStyle = exportMode
    ? {
        width: `${exportWidth}px`,
        maxWidth: "none",
      }
    : {};

  const imageStyle = exportMode
    ? {
        width: `${exportWidth}px`,
        maxWidth: "none",
      }
    : {};

  return (
    <div
      ref={(node) => {
        localRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className="cardWrap"
      style={wrapperStyle}
    >
      <img
        className="cardImg"
        src={template.src}
        alt={template.title}
        style={imageStyle}
      />

      <div
        className="cardText"
        style={exportMode ? exportTextStyle : computedTextStyle}
        dir="rtl"
      >
        {name || t.namePlaceholder}
      </div>
    </div>
  );
});

export default CardPreview;