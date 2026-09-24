# MongoDB collection structure

The application uses independent Mongoose collections. There are no SQL tables or foreign keys in the active backend. Schemas are defined in `backend/models/index.js`.

| Collection | Important fields | Unique index |
|---|---|---|
| users | full_name, email, password_hash, role, is_active, stream | email |
| announcements | category, title, summary, event_date, image_url, is_published | _id |
| past_papers | title, subject, stream, exam_year, paper_type, file_name, file_url | file_name |
| exam_results | full_name, index_number, stream, three subject marks/grades, z_average, rank_number, exam_year | index_number + stream + exam_year |
| contact_messages | full_name, email, subject, message, status | _id |

MongoDB generates an ObjectId `_id` for every document. API responses expose it as a string `id` for compatibility with the React frontend. Mongoose maintains `created_at` and `updated_at` timestamps. Missing numeric results are stored as null. Password hashes are excluded from JSON responses.
