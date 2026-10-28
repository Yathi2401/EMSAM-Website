import PosterImage from "./PosterImage";
import "./PageHero.css";

function PageHero({ eyebrow, title, description, image, imageVariant = "poster", children }) {
  return (
    <section className="page-hero">
      <div className="page-hero-grid"></div>

      <div className="page-hero-inner">
        <div className="page-hero-copy">
          <p className="page-hero-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="page-hero-description">{description}</p>
          {children}
        </div>

        {image && (
          <div className="page-hero-image-wrap">
            {imageVariant === "logo" ? (
              <img
                src={image}
                alt="EMSAM logo"
                className="page-hero-image page-hero-image--logo"
                width="340"
                height="340"
              />
            ) : (
              <PosterImage src={image} alt={`${title} image`} className="page-hero-image" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default PageHero;
