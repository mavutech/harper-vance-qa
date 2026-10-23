import { useCallback, useEffect, useState } from "react";

/**
 * Controls the selected report and wraps previous/next navigation.
 * @param {number} count - Number of report previews.
 * @returns {{selected: number|null, open: Function, close: Function, previous: Function, next: Function}} Gallery controls.
 */
export default function useReportGallery(count) {
  const [selected, setSelected] = useState(null);
  const open = useCallback((index) => setSelected(index), []);
  const close = useCallback(() => setSelected(null), []);
  const previous = useCallback(() => setSelected((index) => index === null ? null : (index + count - 1) % count), [count]);
  const next = useCallback(() => setSelected((index) => index === null ? null : (index + 1) % count), [count]);
  const isOpen = selected !== null;
  useEffect(() => {
    if (!isOpen) return undefined;
    /** Changes reports while focus is trapped inside the open viewer. */
    function handleKeyDown(event) {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); previous(); }
      if (event.key === "ArrowRight") { event.preventDefault(); next(); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, previous, next]);
  return { selected, open, close, previous, next };
}
