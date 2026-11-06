#!/usr/bin/env bash
# ==========================================================================
# NexSwap end-to-end API test suite (phases 2-6 of the integration plan).
# - Uses two clearly-identifiable QA accounts; books are prefixed "[QA]".
# - Only QA-owned data is created or deleted; never touches other users.
# - Prints PASS/FAIL results; exit code 0 iff every check passed.
# - Auth tokens and passwords are read from files in /tmp/opencode; they
#   are never printed.
# ==========================================================================
set -u
BASE="http://localhost:8080"
QA_DIR="/tmp/opencode"
IMG="$QA_DIR/test-cover.png"
STAMP=$(date +%H%M%S)

AGENT_A_EMAIL="qa.student.a.${STAMP}@nexswap.test"
AGENT_B_EMAIL="qa.student.b.${STAMP}@nexswap.test"
PASSWORD='QaTest-Passw0rd-2026'
OUT="$QA_DIR/e2e-results.txt"

PASS=0; FAIL=0
: > "$OUT"

check() { # check <label> <expected> <actual>
  if [ "$2" = "$3" ]; then
    echo "PASS  $1" | tee -a "$OUT"; PASS=$((PASS+1))
  else
    echo "FAIL  $1  (expected: [$2], got: [$3])" | tee -a "$OUT"; FAIL=$((FAIL+1))
  fi
}

json() { # json <json-string> <dotted.path>
  echo "$1" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    for k in sys.argv[1].split("."):
        d = d[int(k)] if isinstance(d, list) else d.get(k) if isinstance(d, dict) else None
        if d is None:
            break
    print(d if d is not None else "")
except Exception:
    print("")' "$2"
}

req() { # req <curl-args…> -> echoes "code|body"
  local tmp; tmp=$(mktemp "$QA_DIR/req-XXXXXX")
  local code; code=$(curl -sS -o "$tmp" -w '%{http_code}' "$@" 2>/dev/null)
  echo "${code}|$(cat "$tmp")"
  rm -f "$tmp"
}

jsonitem() { # jsonitem <json-array-string> <id> <field> -> field value of item with id
  echo "$1" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
except Exception:
    data = []
if not sys.argv[1].isdigit():
    print("")
    sys.exit(0)
ident = int(sys.argv[1])
m = next((r for r in data if isinstance(r, dict) and r.get("id") == ident), None)
print(m.get(sys.argv[2], "") if m else "")' "$2" "$3"
}

auth() { echo "Authorization: Bearer $(cat "$1")"; }

echo "=== NexSwap E2E run $(date) | accounts: $AGENT_A_EMAIL / $AGENT_B_EMAIL ===" | tee -a "$OUT"

# ---------------- PHASE 2: AUTHENTICATION ----------------
echo "--- PHASE 2: authentication ---" | tee -a "$OUT"

R=$(req -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
  -d "{\"name\":\"QA Student Alpha\",\"email\":\"$AGENT_A_EMAIL\",\"password\":\"$PASSWORD\",\"collegeName\":\"QA College Central\",\"phone\":\"9000000001\"}")
check "register student A" "201" "${R%%|*}"
if [ "${R%%|*}" != "201" ]; then
  R=$(req -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$AGENT_A_EMAIL\",\"password\":\"$PASSWORD\"}")
fi
json "${R#*|}" token > "$QA_DIR/token_A"

R=$(req -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
  -d "{\"name\":\"QA Student Beta\",\"email\":\"$AGENT_B_EMAIL\",\"password\":\"$PASSWORD\",\"collegeName\":\"QA College Central\",\"phone\":\"9000000002\"}")
check "register student B" "201" "${R%%|*}"
if [ "${R%%|*}" != "201" ]; then
  R=$(req -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$AGENT_B_EMAIL\",\"password\":\"$PASSWORD\"}")
fi
json "${R#*|}" token > "$QA_DIR/token_B"
SANITY_A=$(json "$(curl -s "$BASE/api/users/me" -H "$(auth "$QA_DIR/token_A")")" name)
check "sanity: auth token valid for A" "QA Student Alpha" "$SANITY_A"

R=$(req -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$AGENT_A_EMAIL\",\"password\":\"$PASSWORD\"}")
check "login student A" "200" "${R%%|*}"

R=$(req -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$AGENT_A_EMAIL\",\"password\":\"wrong-password-123\"}")
check "invalid login rejected" "401" "${R%%|*}"

R=$(req -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
  -d "{\"name\":\"QA Student Alpha Duplicate\",\"email\":\"$AGENT_A_EMAIL\",\"password\":\"$PASSWORD\",\"collegeName\":\"QA College Central\",\"phone\":\"\"}")
check "duplicate registration rejected" "409" "${R%%|*}"

R=$(req -X GET "$BASE/api/users/me" -H "$(auth "$QA_DIR/token_A")")
check "get my profile" "200" "${R%%|*}"
check "profile name" "QA Student Alpha" "$(json "${R#*|}" name)"

# ---------------- PHASE 3: BOOK MANAGEMENT ----------------
echo "--- PHASE 3: book management ---" | tee -a "$OUT"

R=$(req -X POST "$BASE/api/books" -H "$(auth "$QA_DIR/token_A")" -H 'Content-Type: application/json' \
  -d '{"title":"[QA] Algorithms In Java — EXCH","author":"QA Author A","description":"[QA test data] A gently used textbook listed for exchange during integration testing.","category":"COMPUTER_SCIENCE","price":350,"condition":"GOOD","listingType":"EXCHANGE"}')
check "A creates EXCHANGE book" "201" "${R%%|*}"
EX_A=$(echo "${R#*|}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')

R=$(req -X POST "$BASE/api/books/$EX_A/image" -H "$(auth "$QA_DIR/token_A")" -F "file=@$IMG;type=image/png")
check "upload image to exchange book" "200" "${R%%|*}"
IMG_URL=$(json "${R#*|}" imageUrl)
check "imageUrl stored" "yes" "$([ -n "$IMG_URL" ] && echo yes || echo no)"

IMG_CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE$IMG_URL" 2>/dev/null)
check "image served via /uploads/" "200" "$IMG_CODE"

R=$(req -X PUT "$BASE/api/books/$EX_A" -H "$(auth "$QA_DIR/token_A")" -H 'Content-Type: application/json' \
  -d '{"title":"[QA] Algorithms In Java — EXCH v2","author":"QA Author A","description":"[QA test data] Edited during integration testing.","category":"COMPUTER_SCIENCE","price":380,"condition":"GOOD","listingType":"EXCHANGE"}')
check "edit listing details" "200" "${R%%|*}"
check "edit persisted (price 380)" "380" "$(json "${R#*|}" price)"

R=$(req -X PATCH "$BASE/api/books/$EX_A/status" -H "$(auth "$QA_DIR/token_A")" -H 'Content-Type: application/json' -d '{"status":"HIDDEN"}')
check "hide listing" "200" "${R%%|*}"
check "status now HIDDEN" "HIDDEN" "$(json "${R#*|}" status)"

R=$(req "$BASE/api/books/$EX_A" -H "$(auth "$QA_DIR/token_A")")
check "owner sees hidden listing" "200" "${R%%|*}"

R=$(req "$BASE/api/books/$EX_A")
check "anonymous gets 404 for hidden listing" "404" "${R%%|*}"

R=$(req -X PATCH "$BASE/api/books/$EX_A/status" -H "$(auth "$QA_DIR/token_A")" -H 'Content-Type: application/json' -d '{"status":"AVAILABLE"}')
check "show listing again" "200" "${R%%|*}"
check "status AVAILABLE again" "AVAILABLE" "$(json "${R#*|}" status)"

R=$(req -X PATCH "$BASE/api/books/$EX_A/status" -H "$(auth "$QA_DIR/token_B")" -H 'Content-Type: application/json' -d '{"status":"HIDDEN"}')
check "non-owner cannot hide listing" "403" "${R%%|*}"

R=$(req -X POST "$BASE/api/books" -H "$(auth "$QA_DIR/token_A")" -H 'Content-Type: application/json' \
  -d '{"title":"[QA] OS Concepts — SELL","author":"QA Author A","description":"[QA test data] Priced listing for sale-flow testing.","category":"COMPUTER_SCIENCE","price":250,"condition":"LIKE_NEW","listingType":"SELL"}')
check "A creates SELL book" "201" "${R%%|*}"
SELL_A=$(echo "${R#*|}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
SELL_A_IMG_URL=$(json "${R#*|}" imageUrl)

R=$(req -X POST "$BASE/api/books/$SELL_A/image" -H "$(auth "$QA_DIR/token_A")" -F "file=@$IMG;type=image/png")
check "upload image to sell book" "200" "${R%%|*}"

# safe-delete check on a QA-only throwaway listing
R=$(req -X POST "$BASE/api/books" -H "$(auth "$QA_DIR/token_A")" -H 'Content-Type: application/json' \
  -d '{"title":"[QA] Throwaway To Delete","author":"QA Author A","description":"[QA test data] Created only to test safe deletion.","category":"OTHER","price":100,"condition":"FAIR","listingType":"SELL"}')
DEL_ID=$(echo "${R#*|}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
R=$(req -X DELETE "$BASE/api/books/$DEL_ID" -H "$(auth "$QA_DIR/token_A")")
check "delete own throwaway listing" "204" "${R%%|*}"
R=$(req "$BASE/api/books/$DEL_ID")
check "deleted listing gone from catalogue" "404" "${R%%|*}"

# ---------------- PHASE 4: SEARCH AND FILTERS ----------------
echo "--- PHASE 4: search and filters ---" | tee -a "$OUT"

R=$(req "$BASE/api/books?q=Algorithms")
check "search by title finds QA book" "$EX_A" "$(json "${R#*|}" content.0.id)"
R=$(req "$BASE/api/books?q=QA%20Author%20B")
check "search by author (empty result ok)" "0" "$(json "${R#*|}" totalPages)"

R=$(req "$BASE/api/books?category=COMPUTER_SCIENCE&q=QA")
found=$(json "${R#*|}" totalElements)
check "category filter finds QA cs books" "yes" "$([ "$found" -ge 2 ] 2>/dev/null && echo yes || echo no)"

R=$(req "$BASE/api/books?condition=GOOD&q=QA")
check "condition filter (GOOD) finds exchange book" "$EX_A" "$(json "${R#*|}" content.0.id)"
R=$(req "$BASE/api/books?condition=LIKE_NEW&q=QA")
check "condition filter (LIKE_NEW) finds sell book" "$SELL_A" "$(json "${R#*|}" content.0.id)"

R=$(req "$BASE/api/books?listingType=EXCHANGE&q=QA")
check "EXCHANGE filter finds exchange book" "$EX_A" "$(json "${R#*|}" content.0.id)"
R=$(req "$BASE/api/books?listingType=SELL&q=QA")
check "SELL filter finds sell book" "$SELL_A" "$(json "${R#*|}" content.0.id)"

R=$(req "$BASE/api/books?minPrice=300&maxPrice=400&q=QA")
check "price range filter finds exchange book" "$EX_A" "$(json "${R#*|}" content.0.id)"
R=$(req "$BASE/api/books?minPrice=300&maxPrice=400&q=QA&listingType=SELL")
check "price range excludes 250 sell book (empty)" "0" "$(json "${R#*|}" totalElements)"

R=$(req "$BASE/api/books?sort=price_asc&q=QA")
P1=$(json "${R#*|}" content.0.price)
R=$(req "$BASE/api/books?sort=price_desc&q=QA")
P2=$(json "${R#*|}" content.0.price)
if [ -n "$P1" ] && [ -n "$P2" ] && [ "$P1" != "$P2" ]; then SORT_OK=yes; else SORT_OK=no; fi
check "sort ascending/descending differ" "yes" "$SORT_OK"

# ---------------- PHASE 5: EXCHANGE WORKFLOW ----------------
echo "--- PHASE 5: exchange workflow ---" | tee -a "$OUT"

R=$(req "$BASE/api/books/$EX_A/contact" -H "$(auth "$QA_DIR/token_B")")
check "B gets seller contact for A's listing" "200" "${R%%|*}"
check "contact is QA Student Alpha" "QA Student Alpha" "$(json "${R#*|}" name)"

R=$(req -X POST "$BASE/api/books" -H "$(auth "$QA_DIR/token_B")" -H 'Content-Type: application/json' \
  -d '{"title":"[QA] QA-B Offers This Book","author":"QA Author B","description":"[QA test data] Offered as the exchange consideration.","category":"MATHEMATICS","price":320,"condition":"GOOD","listingType":"EXCHANGE"}')
check "B creates their offer book" "201" "${R%%|*}"
OFFER_B=$(echo "${R#*|}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')

# negative: request own listing
R=$(req -X POST "$BASE/api/exchanges" -H "$(auth "$QA_DIR/token_A")" -H 'Content-Type: application/json' \
  -d "{\"bookId\":$EX_A,\"offeredBookId\":null,\"message\":\"self request should fail\"}")
check "requesting own listing rejected" "400" "${R%%|*}"

R=$(req -X POST "$BASE/api/exchanges" -H "$(auth "$QA_DIR/token_B")" -H 'Content-Type: application/json' \
  -d "{\"bookId\":$EX_A,\"offeredBookId\":$OFFER_B,\"message\":\"[QA test data] I would love to swap my book for Algorithms In Java.\"}")
check "B sends exchange request" "201" "${R%%|*}"
EX_REQ=$(echo "${R#*|}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')

R=$(req "$BASE/api/exchanges/received" -H "$(auth "$QA_DIR/token_A")")
check "A sees incoming pending request" "PENDING" "$(jsonitem "${R#*|}" "$EX_REQ" status)"

R=$(req -X PATCH "$BASE/api/exchanges/$EX_REQ/accept" -H "$(auth "$QA_DIR/token_A")")
check "A accepts request" "200" "${R%%|*}"
check "exchange status ACCEPTED" "ACCEPTED" "$(json "${R#*|}" status)"

R=$(req "$BASE/api/books/$EX_A")
check "requested book now RESERVED" "RESERVED" "$(json "${R#*|}" status)"
R=$(req "$BASE/api/books/$OFFER_B")
check "offered book now RESERVED" "RESERVED" "$(json "${R#*|}" status)"

R=$(req -X PATCH "$BASE/api/exchanges/$EX_REQ/cancel" -H "$(auth "$QA_DIR/token_B")")
check "accepted request cannot be cancelled" "409" "${R%%|*}"

R=$(req -X PATCH "$BASE/api/exchanges/$EX_REQ/complete" -H "$(auth "$QA_DIR/token_B")")
check "participant completes exchange" "200" "${R%%|*}"
check "exchange status COMPLETED" "COMPLETED" "$(json "${R#*|}" status)"

R=$(req "$BASE/api/books/$EX_A")
check "requested book now EXCHANGED" "EXCHANGED" "$(json "${R#*|}" status)"
R=$(req "$BASE/api/books/$OFFER_B")
check "offered book now EXCHANGED" "EXCHANGED" "$(json "${R#*|}" status)"

# sell flow: B wants to buy A's sell listing (no offered book)
R=$(req -X POST "$BASE/api/exchanges" -H "$(auth "$QA_DIR/token_B")" -H 'Content-Type: application/json' \
  -d "{\"bookId\":$SELL_A,\"offeredBookId\":null,\"message\":\"[QA test data] I want to buy this book.\"}")
check "B requests to buy SELL listing" "201" "${R%%|*}"
BUY_REQ=$(echo "${R#*|}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')

R=$(req -X PATCH "$BASE/api/exchanges/$BUY_REQ/accept" -H "$(auth "$QA_DIR/token_A")")
check "A accepts purchase request" "200" "${R%%|*}"
R=$(req -X PATCH "$BASE/api/exchanges/$BUY_REQ/reject" -H "$(auth "$QA_DIR/token_A")")
check "accepted purchase cannot be rejected" "409" "${R%%|*}"
R=$(req -X PATCH "$BASE/api/exchanges/$BUY_REQ/complete" -H "$(auth "$QA_DIR/token_A")")
check "A completes purchase exchange" "200" "${R%%|*}"
R=$(req "$BASE/api/books/$SELL_A")
check "sell book now EXCHANGED" "EXCHANGED" "$(json "${R#*|}" status)"

# delete protection: book in accepted/completed exchange cannot be deleted while open
R=$(req -X POST "$BASE/api/exchanges" -H "$(auth "$QA_DIR/token_B")" -H 'Content-Type: application/json' \
  -d "{\"bookId\":$EX_A,\"offeredBookId\":null,\"message\":\"must fail - not available\"}")
check "requesting unavailable book rejected" "409" "${R%%|*}"

# ---------------- PHASE 6: DASHBOARD ----------------
echo "--- PHASE 6: dashboard ---" | tee -a "$OUT"

R=$(req "$BASE/api/dashboard/stats" -H "$(auth "$QA_DIR/token_A")")
check "dashboard stats for A" "200" "${R%%|*}"
check "A totalBooksListed (2 QA books created)" "2" "$(json "${R#*|}" totalBooksListed)"
check "A activeListings (both exchanged now)" "0" "$(json "${R#*|}" activeListings)"
check "A completedExchanges (swap + buy flows)" "2" "$(json "${R#*|}" completedExchanges)"
check "A pendingIncomingRequests" "0" "$(json "${R#*|}" pendingIncomingRequests)"
RECENT=$(json "${R#*|}" recentListings.0.title)
check "A recentListings non-empty" "yes" "$([ -n "$RECENT" ] && echo yes || echo no)"

R=$(req "$BASE/api/dashboard/stats" -H "$(auth "$QA_DIR/token_B")")
check "dashboard stats for B" "200" "${R%%|*}"
check "B totalBooksListed" "1" "$(json "${R#*|}" totalBooksListed)"
check "B completedExchanges (swap + buy flows)" "2" "$(json "${R#*|}" completedExchanges)"
check "B sentPendingRequests" "0" "$(json "${R#*|}" sentPendingRequests)"

echo "--- PHASE 7: PUBLIC STATS + CATEGORIES (site data sanity) ---" | tee -a "$OUT"
R=$(req "$BASE/api/public/stats")
check "public stats endpoint" "200" "${R%%|*}"
R=$(req "$BASE/api/books/categories")
check "categories endpoint" "200" "${R%%|*}"
R=$(req "$BASE/api/books/featured")
check "featured endpoint" "200" "${R%%|*}"

echo "" | tee -a "$OUT"
echo "=== RESULTS: $PASS passed, $FAIL failed ===" | tee -a "$OUT"
echo "PASS_COUNT=$PASS"
if [ "$FAIL" -eq 0 ]; then
  echo "E2E_RESULT=ALL_PASS"
  exit 0
else
  echo "E2E_RESULT=FAILURES_DETECTED"
  exit 1
fi
