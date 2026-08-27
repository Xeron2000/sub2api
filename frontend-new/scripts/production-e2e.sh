#!/usr/bin/env bash
set -euo pipefail
# Production Artifact E2E — builds frontend-new, prepares Go embed dist, starts a
# minimal Go embed server (no DB), runs Playwright against it, then verifies SPA
# routing invariants via curl.
#
# Usage: ./scripts/production-e2e.sh [--no-build] [--port 18080]
#   --no-build  skip frontend build (reuse existing dist)
#   --port      Go test server port (default 18080)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
FRONTEND_DIR="${REPO_ROOT}/frontend-new"
BACKEND_DIR="${REPO_ROOT}/backend"
PORT=18787
DO_BUILD=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-build) DO_BUILD=0; shift ;;
    --port) PORT="$2"; shift 2 ;;
    *) echo "unknown arg $1"; exit 1 ;;
  esac
done

echo "== Production Artifact E2E =="

if [[ $DO_BUILD -eq 1 ]]; then
  echo "Building frontend-new..."
  pnpm --dir "${FRONTEND_DIR}" run build
  rm -rf "${BACKEND_DIR}/internal/web/dist"
  mkdir -p "${BACKEND_DIR}/internal/web/dist"
  cp -r "${FRONTEND_DIR}/dist/client/"* "${BACKEND_DIR}/internal/web/dist/"
  # TanStack Start SPA outputs _shell.html; Go expects index.html
  if [[ -f "${BACKEND_DIR}/internal/web/dist/_shell.html" && ! -f "${BACKEND_DIR}/internal/web/dist/index.html" ]]; then
    cp "${BACKEND_DIR}/internal/web/dist/_shell.html" "${BACKEND_DIR}/internal/web/dist/index.html"
  fi
  echo "Embed dist prepared: $(ls -1 "${BACKEND_DIR}/internal/web/dist" | head -20)"
fi

echo "Starting Go embed test server on :${PORT}..."
PORT=${PORT} go -C "${BACKEND_DIR}" run -tags embed ./internal/web/testserver &
SERVER_PID=$!
trap 'kill ${SERVER_PID} 2>/dev/null || true' EXIT

# Wait for server
echo "Waiting for server..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:${PORT}/health" >/dev/null 2>&1; then
    echo "Server ready"
    break
  fi
  sleep 0.5
  if ! kill -0 ${SERVER_PID} 2>/dev/null; then
    echo "Server died"
    wait ${SERVER_PID} || true
    exit 1
  fi
  if [[ $i -eq 30 ]]; then echo "Server failed to start"; exit 1; fi
done

echo "== Curl invariant checks =="
set +e
FAIL=0
check() {
  local path="$1" expect_code="$2" expect_ct="$3" label="$4"
  local out code ct
  out=$(curl -s -i "http://localhost:${PORT}${path}" 2>&1)
  code=$(echo "$out" | head -1 | grep -oE "[0-9]{3}" | head -1)
  ct=$(echo "$out" | grep -i "^content-type:" | head -1)
  if [[ "$code" != "$expect_code" ]]; then
    echo "FAIL $label: $path expected $expect_code got $code"
    echo "$out" | head -5
    FAIL=1
  elif [[ -n "$expect_ct" && "$ct" != *"$expect_ct"* ]]; then
    echo "FAIL $label: $path expected CT $expect_ct got $ct"
    FAIL=1
  else
    echo "PASS $label: $path -> $code $ct"
  fi
  # For SPA routes, ensure HTML shell, not JSON
  if [[ "$label" == "SPA" ]]; then
    if echo "$out" | grep -q '"code"'; then
      echo "FAIL $label: $path returned JSON instead of HTML shell"
      FAIL=1
    fi
    if ! echo "$out" | grep -iq "text/html"; then
      echo "FAIL $label: $path expected text/html"
      FAIL=1
    fi
  fi
  if [[ "$label" == "API" ]]; then
    if echo "$out" | grep -iq "text/html" && echo "$out" | grep -q "<html"; then
      echo "FAIL $label: $path returned HTML instead of JSON"
      FAIL=1
    fi
  fi
}

# SPA F5 direct — must 200 and HTML
for p in "/dashboard" "/keys" "/profile" "/admin/users" "/admin/settings" "/model-plaza" "/custom/__test" "/payment/result" "/auth/linuxdo/callback"; do
  check "$p" "200" "text/html" "SPA"
done
# Unknown frontend route fallback to SPA shell 200
check "/unknown-frontend-xyz" "200" "text/html" "SPA"
# API must not return HTML
check "/api/not-exists" "404" "application/json" "API"
check "/v1/not-exists" "404" "application/json" "API"
check "/health" "200" "application/json" "API"
# Hashed asset must be immutable with correct content-type
{
  hashed=$(ls "${FRONTEND_DIR}/dist/client/assets/"*.js 2>/dev/null | head -1 | xargs -n1 basename || true)
  if [[ -n "$hashed" ]]; then
    out=$(curl -s -i "http://localhost:${PORT}/assets/$hashed" 2>&1)
    if ! echo "$out" | grep -iq "immutable"; then
      echo "FAIL ASSET: /assets/$hashed expected immutable cache"
      echo "$out" | head -10
      FAIL=1
    else
      echo "PASS ASSET: /assets/$hashed -> immutable"
    fi
    if ! echo "$out" | grep -iq "application/javascript"; then
      echo "FAIL ASSET: $hashed content-type not javascript"
      echo "$out" | head -5
      FAIL=1
    fi
  else
    echo "WARN: no hashed asset found for immutable check"
  fi
  out=$(curl -s -i "http://localhost:${PORT}/" 2>&1)
  if ! echo "$out" | grep -iq "no-cache"; then
    echo "FAIL SHELL: / expected no-cache"
    echo "$out" | head -10
    FAIL=1
  else
    echo "PASS SHELL: / -> no-cache"
  fi
  if ! echo "$out" | grep -iq "etag"; then
    echo "WARN SHELL: / expected ETag but not found (non-fatal)"
  else
    echo "PASS SHELL: ETag present"
  fi
}

if [[ $FAIL -ne 0 ]]; then
  echo "Curl checks FAILED"
  exit 1
fi
echo "Curl checks OK"
set -e

echo "== Playwright production E2E (against Go server) =="
PLAYWRIGHT_BASE_URL="http://localhost:${PORT}" pnpm --dir "${FRONTEND_DIR}" exec playwright test --config=playwright.production.config.ts

echo "== Production E2E OK =="

kill ${SERVER_PID} 2>/dev/null || true
trap - EXIT
