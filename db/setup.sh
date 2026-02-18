#!/usr/bin/env bash
# Creates the 'homie' database (if needed), applies schema, and seeds data.
# Usage: bash db/setup.sh

set -euo pipefail

DB_NAME="homie"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Checking if database '$DB_NAME' exists..."
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo "    Database '$DB_NAME' already exists."
else
  echo "    Creating database '$DB_NAME'..."
  createdb "$DB_NAME"
fi

echo "==> Applying schema..."
psql -d "$DB_NAME" -f "$SCRIPT_DIR/schema.sql"

echo "==> Applying seed data..."
psql -d "$DB_NAME" -f "$SCRIPT_DIR/seed.sql"

echo "==> Done! Database '$DB_NAME' is ready."
echo "    Seeded users: jdoe/password123, asmith/securepass456, bwilson/mypassword789"
