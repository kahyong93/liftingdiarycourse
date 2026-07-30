#!/usr/bin/env bash
# PostToolUse hook: when a doc is written directly under /docs, ask Claude to
# resync the documentation list in my-clerk-next-app/CLAUDE.md.
#
# Reads the tool-call JSON on stdin and inspects tool_input.file_path.
# Emits JSON with additionalContext so the reminder reaches the model.

set -euo pipefail

payload=$(cat)

file_path=$(printf '%s' "$payload" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')

[ -n "$file_path" ] || exit 0

# Normalize Windows backslashes and separators to forward slashes.
normalized=${file_path//\\//}

# Only top-level docs/*.md — not docs/superpowers/** or other subdirectories.
case "$normalized" in
  */docs/*/*) exit 0 ;;
  */docs/*.md|docs/*.md) ;;
  *) exit 0 ;;
esac

# Skip if CLAUDE.md already references this file.
basename_md=${normalized##*/}
claude_md="my-clerk-next-app/CLAUDE.md"
if [ -f "$claude_md" ] && grep -qF "docs/$basename_md" "$claude_md"; then
  exit 0
fi

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "The documentation file docs/$basename_md was just created or modified and is not yet listed in my-clerk-next-app/CLAUDE.md. Use the Agent tool with subagent_type \"docs-indexer\" to sync the documentation list under the '### Code Generation Guidelines' section."
  }
}
EOF
