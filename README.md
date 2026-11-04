## Schema Decisions

**Why Book references Genre instead of embedding it.**
Each Book stores a `genreId` foreign key with a `@relation` to a single
Genre row, rather than copying genre data into every book. Genres are shared
by many books, so storing them once keeps one source of truth: renaming
"Sci-Fi" to "Science Fiction" is a single-row update instead of a rewrite of
every book. It also prevents typos and drift (`"Fantasy"` vs `"fantasy"`),
lets the database enforce referential integrity (a book cannot point to a
genre that doesn't exist), and makes queries like "all books in a genre" or
"book counts per genre" simple, indexed lookups. Embedding would duplicate
data and make those updates and queries harder.

**Other decisions**
- `Role` is an enum (`PATRON`, `LIBRARIAN`) so invalid roles can't be stored.
- `Genre.name` and `User.email` are unique; `Book.isbn` is optional but unique.
- `Review` has a composite unique on `(bookId, userId)`, so each patron can
  review a book only once. Deleting a book or user cascades to their reviews.

**Prisma vs. a document database**
In a document database I would have been tempted to nest the genre (or even
the reviews) inside each book document. Prisma pushed me to model each
entity as its own table and declare the relationships explicitly, which
meant thinking about foreign keys and cascade behavior up front instead of
deciding on a document shape per query.
