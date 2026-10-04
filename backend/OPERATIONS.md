# Backend operations

This guide covers the local development stack. Production backup and restore must use the selected managed PostgreSQL provider's encrypted backups, point-in-time recovery, access controls, and documented recovery procedures.

## Local services

Run commands from `backend/`:

```sh
docker compose up -d postgres mailpit
docker compose ps
npm run db:migrate
npm run dev
```

Mailpit captures local account emails at `http://localhost:8025`. The Compose database is disposable development data and uses credentials that must never be reused in production.

Account email is written to `email_outbox` in the same database transaction as the verification or reset token. Message payloads are AES-256-GCM encrypted with `EMAIL_ENCRYPTION_KEY`; the worker retries delivery with capped exponential backoff and marks a message failed after eight attempts. Messages are never sent after their associated link expires. Sent payloads are deleted after 30 days; expired payloads are deleted after seven days, while unexpired failed rows are retained for operator review. Delivery is at least once: if the worker stops after SMTP accepts a message but before the database marks it sent, a retry can produce a duplicate email. Local recovery was verified by stopping Mailpit, queuing a message, restarting Mailpit, and confirming the message was sent from the outbox. In production, store this key in the deployment secret manager and keep it stable while encrypted messages remain pending. Drain the outbox before rotating the key.

To inspect delivery state without exposing message content:

```sh
docker compose exec -T postgres psql -U seatswap -d seatswap -c "SELECT status, count(*), sum(attempts), sum(manual_retry_count) FROM email_outbox GROUP BY status ORDER BY status;"
```

After correcting the SMTP failure, an operator with database access can requeue one unexpired terminal failure. Record the incident/ticket reference in the trusted job log; the script never prints the encrypted message content or recipient.

```sh
OPERATOR_TICKET=OPS-123 npm run email:retry-failed -- <outbox-uuid>
```

The command only updates a row that is still `FAILED` and whose link has not expired. Its manual retry count is stored on that row. If the message has expired, ask the user to request a new link instead of reusing its payload.

Auth and global rate limits use HMAC-keyed PostgreSQL counters shared across API processes. Raw client IPs are not stored; expired windows are cleaned up every 15 minutes while the API is running. A local check confirmed the five-attempt login limit is shared by two API processes. If cleanup is interrupted, expired counter rows remain inert and are removed on the next cleanup run.

Expired or revoked session rows and consumed or expired account-token rows are deleted in a startup sweep and once per day. This keeps one-time credentials and ended sessions out of the database after they stop being usable; account status and password-reset changes remain reflected on the user record.

Successful account creation, verification, session creation/revocation, profile changes, and password resets write an audit event in the same transaction as the corresponding state change. Events contain actor/object IDs, action, and request ID only; they do not copy passwords, email addresses, one-time tokens, IP addresses, or submitted profile values. Set and document an audit-event retention period for the launch country before production data is accepted.

## Local backup and isolated restore check

The custom-format dump is written to a private temporary path and ignored by Git. Do not place a database dump in the repository or send one through an unapproved channel; it can contain personal data and password hashes.

```sh
umask 077
BACKUP_FILE="/tmp/seatswap-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T postgres pg_dump -U seatswap -Fc seatswap > "$BACKUP_FILE"

docker compose exec -T postgres createdb -U seatswap seatswap_restore
docker compose exec -T postgres pg_restore -U seatswap --dbname=seatswap_restore --no-owner --no-privileges < "$BACKUP_FILE"
docker compose exec -T postgres psql -U seatswap -d seatswap_restore -c "SELECT count(*) AS users FROM users;"

docker compose exec -T postgres dropdb -U seatswap seatswap_restore
rm -f "$BACKUP_FILE"
```

Run the restore into a separate database first. For production recovery, validate schema and application behavior against that isolated restore before changing the application connection. Do not restore over the live database as an initial validation step.

## Migration and release rules

- Create schema changes through Prisma migrations and review the generated SQL before deployment.
- CI applies all committed migrations to an ephemeral PostgreSQL service, and the migration chain was also applied to a clean local database.
- Apply migrations as a controlled one-off release step with a database backup available; the API container deliberately does not migrate on startup.
- Set `APP_BASE_URL` to the public HTTPS URL of the auth application. Production startup rejects localhost or non-HTTPS links so verification and recovery messages cannot silently point to a developer machine.
- Exercise backup restoration and application readiness in staging before production data is accepted.
- Use TLS, managed secrets, least-privilege database roles, monitoring, and a named recovery owner in the chosen deployment environment.

Local restore validation does not prove the managed provider's backup retention, point-in-time recovery, or disaster recovery objectives. Those require a staging environment and an agreed recovery-time and recovery-point target.
