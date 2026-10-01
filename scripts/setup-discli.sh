#!/usr/bin/env bash
# Install the discli Discord CLI and verify it with `discli doctor`.
# The bot token is read from the environment or ~/.discli/config.json, never here.
# Usage: setup-discli.sh [--dry-run]
set -euo pipefail

package="discord-cli-agent"
dry_run=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    *)
      printf 'setup-discli: unknown argument: %s\n' "$arg" >&2
      exit 2
      ;;
  esac
done

installer=""
if command -v pipx >/dev/null 2>&1; then
  installer="pipx"
elif command -v python3 >/dev/null 2>&1; then
  installer="python3"
elif command -v pip >/dev/null 2>&1; then
  installer="pip"
fi

if [ -z "$installer" ]; then
  printf 'setup-discli: install Python 3.10 or newer, or pipx, first.\n' >&2
  exit 1
fi

case "$installer" in
  pipx)    install=(pipx install "$package") ;;
  python3) install=(python3 -m pip install --user "$package") ;;
  pip)     install=(pip install --user "$package") ;;
esac

if [ "$dry_run" -eq 1 ]; then
  printf 'dry-run: %s\n' "${install[*]}"
  printf 'dry-run: discli doctor\n'
  exit 0
fi

if ! "${install[@]}"; then
  printf 'setup-discli: install failed.\n' >&2
  exit 1
fi

if ! command -v discli >/dev/null 2>&1; then
  printf 'setup-discli: discli is not on PATH after install. Add the pip user bin directory to PATH.\n' >&2
  exit 1
fi

exec discli doctor
