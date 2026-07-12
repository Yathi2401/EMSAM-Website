import "./PageHero.css";

function PageHero({ eyebrow, title, description, image, children }) {
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
            <img src={image} alt="" className="page-hero-image" />
          </div>
        )}
      </div>
    </section>
  );
}

export default PageHero;
