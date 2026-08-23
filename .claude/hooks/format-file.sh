#!/usr/bin/env bash
# PostToolUse hook: runs prettier --write then eslint --fix on files
# created/edited by Write/Edit/MultiEdit. Confined to files inside the
# project; unfixable ESLint errors are surfaced back to Claude (exit 2).
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

input="$(cat)"
file_path="$(echo "$input" | node -e '
  let data = "";
  process.stdin.on("data", c => data += c);
  process.stdin.on("end", () => {
    try {
      const json = JSON.parse(data);
      const fp = json.tool_input && json.tool_input.file_path;
      if (fp) process.stdout.write(fp);
    } catch {}
  });
')"

if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

# Only ever touch files inside this project (resolve symlinks on both sides).
project_root="$(pwd -P)"
resolved="$(cd "$(dirname "$file_path")" && pwd -P)/$(basename "$file_path")"
case "$resolved" in
  "$project_root"/*) ;;
  *) exit 0 ;;
esac

case "$file_path" in
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.css|*.json|*.md)
    ;;
  *)
    exit 0
    ;;
esac

npx prettier --write "$file_path" >/dev/null 2>&1 || true

case "$file_path" in
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs)
    if ! eslint_out="$(npx eslint --fix --max-warnings=0 "$file_path" 2>&1)"; then
      echo "$eslint_out" >&2
      exit 2
    fi
    ;;
esac

exit 0
