import { useState } from "react";
import { serverFileUrl } from "../services/api";

const PAGE_SIZE = 5;

export default function AnnouncementManager({ items, loading, disabled, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  // Keep the selected category visible if its last record is deleted or recategorized.
  const categories = [
    ...new Set([...items.map((item) => item.category), category].filter(Boolean)),
  ].sort();
  const query = search.trim().toLowerCase();
  const filtered = items
    .filter(
      (item) =>
        (!category || item.category === category) &&
        `${item.title} ${item.summary}`.toLowerCase().includes(query),
    )
    .sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
      const order =
        (a.created_at || a.id).localeCompare(b.created_at || b.id) || a.id.localeCompare(b.id);
      return sort === "oldest" ? order : -order;
    });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);

  function resetFilters() {
    setSearch("");
    setCategory("");
    setSort("newest");
    setPage(1);
  }

  return (
    <section className="messages-card announcement-manager" aria-labelledby="manage-announcements">
      <h2 id="manage-announcements">Manage Announcements</h2>
      <div className="announcement-filters">
        <label htmlFor="announcement-search">
          Search title or summary
          <input
            id="announcement-search"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label htmlFor="announcement-filter">
          Filter by category
          <select
            id="announcement-filter"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label htmlFor="announcement-sort">
          Sort announcements
          <select
            id="announcement-sort"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A–Z</option>
          </select>
        </label>
        <button type="button" onClick={resetFilters}>
          Reset filters
        </button>
      </div>
      <p role="status">
        {loading ? "Loading announcements..." : `${filtered.length} matching announcements`}
      </p>
      <div className="admin-record-list">
        {filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((item) => (
          <article className="admin-record" key={item.id}>
            <div className="announcement-record-content">
              <h3>{item.title}</h3>
              <p>
                {item.category} · {item.is_published ? "Published" : "Unpublished"}
              </p>
              <details>
                <summary>
                  View details<span className="sr-only"> for {item.title}</span>
                </summary>
                <p className="announcement-record-summary">{item.summary}</p>
                <p>Event date: {item.event_date ? item.event_date.slice(0, 10) : "Not set"}</p>
                {item.image_url && (
                  <img
                    className="announcement-record-image"
                    src={serverFileUrl(item.image_url)}
                    alt={`Photo for ${item.title}`}
                    loading="lazy"
                  />
                )}
              </details>
            </div>
            <div className="admin-record-actions">
              <button
                className="edit-record"
                type="button"
                disabled={disabled}
                onClick={() => onEdit(item)}
                aria-label={`Edit ${item.title}`}
              >
                Edit
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDelete("announcements", item)}
                aria-label={`Delete ${item.title}`}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
        {!loading && filtered.length === 0 && (
          <p>
            {items.length
              ? "No announcements match these filters. Try another search or reset the filters."
              : "No announcements yet. Publish your first announcement using the form above."}
          </p>
        )}
      </div>
      {pages > 1 && (
        <nav className="user-pagination" aria-label="Announcement pages">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {pages}
          </span>
          <button
            type="button"
            disabled={currentPage === pages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
