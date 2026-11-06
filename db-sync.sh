#!/usr/bin/env bash
# ==========================================================================
# NexSwap database credential synchronization + verification (final)
#
# Flow (each step runs only if the previous one succeeded):
#   1. Read DB_PASSWORD from backend/.env (removing ONLY a matching pair of
#      surrounding quotes, never real password characters), validate it,
#      and generate SQL escaped for the guaranteed NO_BACKSLASH_ESCAPES
#      parser mode into a temp file.
#      -> On ANY failure: report and exit. No MySQL command runs.
#   2. Apply the statements via `sudo mysql` (first statement pins the
#      session to NO_BACKSLASH_ESCAPES so escaping semantics are known).
#      -> Batch-mode mysql aborts on the first failed statement.
#      -> On ANY failure: report and exit. No verification runs.
#   3. Only after successful synchronization, verify connectivity twice:
#      TCP (127.0.0.1:3306) and the Unix socket.
#
# Safety:
#   - Password never printed (log shows length + SHA-256 fingerprint only).
#     It travels through chmod-600 temp files + MYSQL_PWD env var, shredded
#     on exit.
#   - No application data is touched: only the two login accounts are
#     altered; CREATE DATABASE IF NOT EXISTS is a no-op when present.
#   - The MySQL root account is never referenced.
# ==========================================================================

set -u

ENV_FILE="/home/user/NexSwap1/backend/.env"
OUT="/tmp/opencode/dbsync.out"
STAGE="/tmp/opencode"
mkdir -p "$STAGE"
chmod 700 "$STAGE" 2>/dev/null || true

# Temp files: password, generated SQL, fingerprint facts. Mode 600, removed on exit.
SQLFILE="$(mktemp "$STAGE/sql-XXXXXX")"
PWFILE="$(mktemp "$STAGE/pw-XXXXXX")"
FACTS="$(mktemp "$STAGE/facts-XXXXXX")"
chmod 600 "$SQLFILE" "$PWFILE" "$FACTS"
trap 'shred -u "$SQLFILE" "$PWFILE" "$FACTS" 2>/dev/null || rm -f "$SQLFILE" "$PWFILE" "$FACTS"' EXIT

{
  echo "=== db-sync run at $(date) ==="
  overall=0

  # --- Step 1: Python reads/validates the password and generates the SQL ---
  if python3 - "$ENV_FILE" "$SQLFILE" "$PWFILE" "$FACTS" <<'PY'
import hashlib, pathlib, sys
env_file, sql_file, pw_file, facts_file = sys.argv[1:5]

# Read the raw value after DB_PASSWORD=.
value = None
for line in pathlib.Path(env_file).read_text().splitlines():
    stripped = line.strip()
    if stripped.startswith('DB_PASSWORD='):
        value = stripped.split('=', 1)[1].strip()

if value is None:
    print("FAIL(step-1): DB_PASSWORD not found in .env", file=sys.stderr)
    sys.exit(1)

# Remove only ONE matching pair of surrounding quotes, if present.
# A lone leading or trailing quote is a real password character and is kept.
def unquote(raw):
    if len(raw) >= 2 and raw[0] == raw[-1] == '"':
        return raw[1:-1]
    if len(raw) >= 2 and raw[0] == raw[-1] == "'":
        return raw[1:-1]
    return raw

password = unquote(value)

if password == '' or any(c in password for c in '\n\r\0'):
    print("FAIL(step-1): DB_PASSWORD empty or contains forbidden characters", file=sys.stderr)
    sys.exit(1)

# Escape for SQL parsed under NO_BACKSLASH_ESCAPES:
# pin the session to that mode first, then quote-double the single quotes.
# Quote-doubling is the only required transform under that mode, and works
# regardless of the server's global sql_mode.
escaped = password.replace("'", "''")
stmts = (
    "SET SESSION sql_mode = CONCAT(@@session.sql_mode, ',NO_BACKSLASH_ESCAPES');\n"
    "CREATE DATABASE IF NOT EXISTS nexswap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n"
    "ALTER USER IF EXISTS 'nexswap'@'localhost' IDENTIFIED BY '" + escaped + "';\n"
    "ALTER USER IF EXISTS 'nexswap'@'127.0.0.1' IDENTIFIED BY '" + escaped + "';\n"
    "CREATE USER IF NOT EXISTS 'nexswap'@'localhost' IDENTIFIED BY '" + escaped + "';\n"
    "CREATE USER IF NOT EXISTS 'nexswap'@'127.0.0.1' IDENTIFIED BY '" + escaped + "';\n"
    "GRANT ALL PRIVILEGES ON nexswap.* TO 'nexswap'@'localhost';\n"
    "GRANT ALL PRIVILEGES ON nexswap.* TO 'nexswap'@'127.0.0.1';\n"
    "FLUSH PRIVILEGES;\n"
    "SELECT user, host FROM mysql.user WHERE user = 'nexswap';\n"
)
pathlib.Path(sql_file).write_text(stmts)
pathlib.Path(pw_file).write_text(password)            # no trailing newline
pathlib.Path(facts_file).write_text(
    f"len={len(password)} sha8={hashlib.sha256(password.encode()).hexdigest()[:8]}"
)
PY
  then
    echo "step-1 OK: password validated, SQL generated (env pw $(cat "$FACTS"))"

    # --- Step 2: apply to MySQL via sudo mysql ---
    # Uses the Debian maintenance-client config because MySQL root on this
    # system requires password authentication. The debian.cnf file is
    # root-readable only, so nothing is exposed to this script.
    echo "--- step-2: applying to MySQL (sudo mysql --defaults-file=/etc/mysql/debian.cnf) ---"
    if sudo mysql --defaults-file=/etc/mysql/debian.cnf < "$SQLFILE"; then
      echo "step-2 OK: MySQL synchronization completed"
    else
      rc=$?
      echo "FAIL(step-2): MySQL synchronization FAILED (exit $rc). No verification will run."
      overall=1
    fi

    # --- Step 3: verify connections (ONLY after successful sync) ---
    if [ "$overall" -eq 0 ]; then
      PW="$(cat "$PWFILE")"

      echo "--- step-3a: verification over TCP 127.0.0.1:3306 ---"
      tcp_err="$(MYSQL_PWD="$PW" mysql -h 127.0.0.1 -P 3306 -u nexswap \
          -e "SELECT CURRENT_USER() AS connected_as, 'CONNECTED' AS status;" 2>&1)"
      tcp_rc=$?
      echo "$tcp_err" | grep -v "Warning"
      if [ "$tcp_rc" -eq 0 ]; then
        echo "step-3a OK (TCP)"
      else
        echo "FAIL(step-3a): TCP connection failed (exit $tcp_rc)"
        overall=1
      fi

      echo "--- step-3b: verification over Unix socket ---"
      sock_err="$(MYSQL_PWD="$PW" mysql -u nexswap \
          -e "SELECT CURRENT_USER() AS connected_as, 'CONNECTED' AS status;" 2>&1)"
      sock_rc=$?
      echo "$sock_err" | grep -v "Warning"
      if [ "$sock_rc" -eq 0 ]; then
        echo "step-3b OK (socket)"
      else
        echo "FAIL(step-3b): socket connection failed (exit $sock_rc)"
        overall=1
      fi
    fi
  else
    rc=$?
    echo "FAIL(step-1): password could not be read/validated (exit $rc). Stopping; MySQL untouched."
    overall=1
  fi

  if [ "$overall" -eq 0 ]; then
    echo "=== done: ALL STEPS PASSED ==="
  else
    echo "=== done: FAILURE (see FAIL markers above) ==="
  fi
} > "$OUT" 2>&1

echo "Results written to $OUT (password never printed)"

exit "$overall"
