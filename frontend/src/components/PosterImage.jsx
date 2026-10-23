import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiZoomIn, FiX } from "react-icons/fi";
import "./PosterImage.css";

export default function PosterImage({ src, alt, className }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button className="poster-link" type="button" onClick={() => setOpen(true)}
        aria-label={`Enlarge image: ${alt}`} aria-haspopup="dialog">
        <img src={src} alt={alt} className={className} />
        <span className="poster-link-hint" aria-hidden="true"><FiZoomIn /></span>
      </button>
      {open && createPortal(
        <dialog ref={dialogRef} className="poster-dialog" aria-label={alt || "Image preview"}
          onClose={() => setOpen(false)}
          onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
          <button className="poster-dialog-close" type="button" aria-label="Close image" autoFocus onClick={() => setOpen(false)}><FiX aria-hidden="true" /></button>
          <img className="poster-dialog-image" src={src} alt={alt} />
        </dialog>, document.body
      )}
    </>
  );
}
