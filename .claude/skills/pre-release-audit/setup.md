# Standing up the audit instance

Restore production data into a local stack running the images you are about to
ship. Takes about twenty minutes, most of it waiting on an image build.

## 1 — Dump production, read-only

```sh
ssh nas 'docker exec courseshelf-release-postgres-1 \
  pg_dump -U courseshelf -Fc courseshelf > /tmp/cs-audit.dump'
ssh nas 'cat /tmp/cs-audit.dump' > ~/audit-courseshelf/courseshelf.dump
```

`scp` has failed against this NAS; `ssh … cat` works. Nothing here writes to the
NAS.

## 2 — Bring across a handful of real media files

Most scenarios never play video, and the rows may point at absent files. Bring
enough for the ones that do: one Cyrillic-titled course, a few lessons, and that
course's whole `derived/` subtree so transcripts and thumbnails resolve.

```sh
ssh nas 'cd /volume3/Shared2/Courses && tar cf - "<course>/<lesson>.mp4"' \
  | tar xf - -C ~/audit-courseshelf/courses
ssh nas 'cd /volume2/docker/courseshelf/derived && tar cf - "<libraryId>/<course>"' \
  | tar xf - -C ~/audit-courseshelf/derived
```

Do not mix a `du` or an `echo` into the same command as `tar cf -` — both write
to stdout and the archive arrives corrupt.

**Copy `derived/<libraryId>/posters/` too**, or every poster request 404s and the
run fills with fixture artefacts that look like defects.

Host paths come from the running container, not from memory:

```sh
ssh nas 'docker inspect courseshelf-release-backend-1 \
  --format "{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}"'
```

## 3 — Build the images from the merge commit

```sh
docker build -f apps/backend/Dockerfile -t courseshelf-backend:audit .
docker build -f apps/web/Dockerfile     -t courseshelf-web:audit .
```

Audit what ships. A dev server differs from the release image in CSP, in
minification and in the rendered document — exactly where the document-level
defects live.

## 4 — Run the release bundle, not the repo compose

```sh
gh release download <tag> --pattern 'courseshelf-release-*.tar.gz'
tar xzf courseshelf-release-*.tar.gz
```

The repo's `docker/compose.release.yml` expects `./nginx-prod.conf` **beside
itself in the bundle**; the repo has `docker/nginx/prod.conf` and the proxy
fails to start. Unpacking the bundle is also closer to a real deployment.

Image tags in the bundle are **literal**, not `${RELEASE_TAG}` — rendering pins
them. Editing `RELEASE_TAG` in `.env` does nothing. Swap the two `image:` lines.

`.env` needs: `PROXY_PORT` (pick a free one — 8080, 3000 and 5432 are usually
taken), `PUBLIC_BASE_URL`, `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`,
`CENTRIFUGO_API_KEY`, `CENTRIFUGO_TOKEN_HMAC_SECRET`, `COURSES_PATH`,
`DERIVED_PATH`, and `AUTH_SELF_REGISTRATION=true` so personas can be created.

## 5 — Restore before the backend starts

```sh
docker compose -p csh-audit up -d postgres
docker cp courseshelf.dump csh-audit-postgres-1:/tmp/cs.dump
docker exec csh-audit-postgres-1 \
  pg_restore -U courseshelf -d courseshelf --clean --if-exists --no-owner /tmp/cs.dump
docker compose -p csh-audit up -d
```

The dump carries the schema and `_prisma_migrations`, so the backend finds
nothing pending. Starting it first makes it migrate an empty database and the
restore then fights it.

Check `rootPath` in the `library` table matches the container's mount, or every
relative `videoPath` resolves to nothing.

## 6 — Three personas

```sh
curl -X POST "$BASE/api/v1/auth/sign-up/email" -H 'Content-Type: application/json' \
  -d '{"email":"audit-admin@example.com","password":"…","name":"Admin"}'
```

Then promote one in the database. **Match the existing case** — production rows
carry `ADMIN`, Better Auth writes `admin`, and the guard compares exactly:

```sh
docker exec csh-audit-postgres-1 psql -U courseshelf -d courseshelf \
  -c "UPDATE \"user\" SET role='ADMIN' WHERE email='audit-admin@example.com';"
```

Grant the admin a library — **role does not imply content access**, and without
a grant it cannot stream:

```sh
curl -X POST "$BASE/api/v1/access/grants" -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":"…","target":{"kind":"library","libraryId":"…"},"level":"READ"}'
```

Leave the other two ungranted: a learner with one course and a learner with
nothing are separate personas, and the second is where the interesting failures
live.

Space the sign-ups. Five attempts per 15 minutes per IP, and a failed attempt
counts.

## Teardown

```sh
docker compose -p csh-audit down -v
```

Keep `report.json` and the screenshots — the next run compares against them.
