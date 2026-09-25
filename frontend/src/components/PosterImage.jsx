import "./PosterImage.css";

export default function PosterImage({ src, alt, className }) {
  return (
    <a className="poster-link" href={src} target="_blank" rel="noopener noreferrer"
      aria-label={`View full image: ${alt} (opens in a new tab)`}>
      <img src={src} alt={alt} className={className} />
      <span className="poster-link-hint" aria-hidden="true">View full image ↗</span>
    </a>
  );
}
