#!/usr/bin/env bash
# NexSwap DB verification. Prints no passwords anywhere.
OUT=/tmp/opencode/dbtest.out
{
  echo "=== run at $(date) ==="
  echo "whoami : $(id)"
  echo "mysql  : $(which mysql)"
  echo "version: $(mysql --version 2>/dev/null)"
  cd /home/user/NexSwap1/backend || { echo "backend dir missing"; exit 1; }

  PW=$(python3 - <<'PY'
import pathlib
print(next(l for l in pathlib.Path('.env').read_text().splitlines() if l.startswith('DB_PASSWORD=')).strip().split('=',1)[1].strip('"'))
PY
  )
  echo "env pw length: ${#PW}  sha8: $(printf '%s' "$PW" | sha256sum | cut -c1-8)"

  echo "--- TCP 127.0.0.1:3306 ---"
  MYSQL_PWD="$PW" mysql -h 127.0.0.1 -P 3306 -u nexswap -e "SELECT CURRENT_USER() AS connected_as, 'CONNECTED' AS status;" 2>&1 | grep -v Warning
  echo "exit: $?"

  echo "--- Unix socket (localhost) ---"
  MYSQL_PWD="$PW" mysql -u nexswap -e "SELECT CURRENT_USER() AS connected_as, 'CONNECTED' AS status;" 2>&1 | grep -v Warning
  echo "exit: $?"

  echo "=== done ==="
} > "$OUT" 2>&1
rm -f /tmp/opencode/pw.txt
echo "Results written to $OUT (no password printed)"
