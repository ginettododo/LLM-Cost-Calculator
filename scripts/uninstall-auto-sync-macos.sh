#!/usr/bin/env bash

set -euo pipefail

PLIST_ID="com.llm-cost-calculator.autosync"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_ID.plist"

launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
rm -f "$PLIST_PATH"

echo "Uninstalled: $PLIST_PATH"
