#!/usr/bin/env bash
# Install the zlak-flow skill for Codex CLI.
#
#   ./install.sh [--project] [--target <dir>] [--force] [--dry-run]
#
# Copies skills/zlak-flow into a Codex skills directory:
#   default     $HOME/.agents/skills        (every project of this user)
#   --project   ./.agents/skills            (this repository only)
#   --target    <dir>                       (any skills directory)
# It never overwrites a file you changed without --force, and does nothing when the
# installed copy is already identical.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source_dir="$here/skills/zlak-flow"
target_root="$HOME/.agents/skills"
force=0
dry_run=0

usage() {
  sed -n '2,11p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --project) target_root="$PWD/.agents/skills" ;;
    --target)
      [ $# -ge 2 ] || { echo "--target needs a directory" >&2; exit 2; }
      target_root="$2"
      shift
      ;;
    --force) force=1 ;;
    --dry-run) dry_run=1 ;;
    -h | --help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

[ -f "$source_dir/SKILL.md" ] || { echo "missing $source_dir/SKILL.md" >&2; exit 1; }
dest="$target_root/zlak-flow"

if [ -d "$dest" ] && diff -r "$source_dir" "$dest" >/dev/null 2>&1; then
  echo "zlak-flow is already installed and up to date: $dest"
  exit 0
fi

if [ -e "$dest" ] && [ "$force" -ne 1 ]; then
  echo "refusing to overwrite $dest (it differs from this package); use --force" >&2
  exit 1
fi

if [ "$dry_run" -eq 1 ]; then
  echo "would install zlak-flow to $dest"
  exit 0
fi

mkdir -p "$target_root"
rm -rf "$dest"
cp -R "$source_dir" "$dest"
echo "installed zlak-flow to $dest"
echo "restart Codex if it is running, then invoke it as \$zlak-flow <task>"
