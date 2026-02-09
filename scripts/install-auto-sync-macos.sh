#!/usr/bin/env bash

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="$REPO_DIR/scripts/auto-git-sync.sh"
PLIST_ID="com.llm-cost-calculator.autosync"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_ID.plist"
LOG_PATH="$REPO_DIR/.auto-sync.log"

if [ ! -f "$SCRIPT_PATH" ]; then
  echo "Script not found: $SCRIPT_PATH"
  exit 1
fi

chmod +x "$SCRIPT_PATH"

cat >"$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>$PLIST_ID</string>
    <key>ProgramArguments</key>
    <array>
      <string>/bin/zsh</string>
      <string>-lc</string>
      <string>$SCRIPT_PATH >> "$LOG_PATH" 2>&1</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$REPO_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>StartInterval</key>
    <integer>60</integer>
    <key>StandardOutPath</key>
    <string>$LOG_PATH</string>
    <key>StandardErrorPath</key>
    <string>$LOG_PATH</string>
  </dict>
</plist>
EOF

launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load "$PLIST_PATH"

echo "Installed and loaded: $PLIST_PATH"
echo "Logs: $LOG_PATH"
echo "Check status: launchctl list | rg $PLIST_ID"
