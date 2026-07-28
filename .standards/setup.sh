#!/bin/bash

# mavutech-coding-standards setup script
# Run this on any new machine to apply global Copilot instructions
# Usage: bash setup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTRUCTIONS_SOURCE="$SCRIPT_DIR/copilot-instructions.md"

echo ""
echo "================================================"
echo "  Mavutech Standards — Machine Setup"
echo "================================================"
echo ""

# Verify source file exists
if [ ! -f "$INSTRUCTIONS_SOURCE" ]; then
  echo "ERROR: copilot-instructions.md not found at $SCRIPT_DIR"
  exit 1
fi

# Detect OS
OS="$(uname -s)"

# Locate VS Code settings path
if [ "$OS" = "Darwin" ]; then
  VSCODE_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"
elif [ "$OS" = "Linux" ]; then
  VSCODE_SETTINGS="$HOME/.config/Code/User/settings.json"
else
  echo "Windows detected. Please manually copy the contents of:"
  echo "  $INSTRUCTIONS_SOURCE"
  echo ""
  echo "Into VS Code settings under:"
  echo "  github.copilot.chat.codeGeneration.instructions"
  echo ""
  exit 0
fi

# Read instructions content
INSTRUCTIONS_CONTENT=$(cat "$INSTRUCTIONS_SOURCE")

echo "Source:  $INSTRUCTIONS_SOURCE"
echo "Target:  $VSCODE_SETTINGS"
echo ""

# Check if settings.json exists
if [ ! -f "$VSCODE_SETTINGS" ]; then
  echo "VS Code settings.json not found. Creating it..."
  mkdir -p "$(dirname "$VSCODE_SETTINGS")"
  echo "{}" > "$VSCODE_SETTINGS"
fi

# Inform user — automated JSON injection requires jq
if command -v jq &> /dev/null; then
  echo "Applying Copilot instructions to VS Code settings..."

  # Backup existing settings
  cp "$VSCODE_SETTINGS" "$VSCODE_SETTINGS.bak"
  echo "Backup saved: $VSCODE_SETTINGS.bak"

  # Inject instructions into settings
  jq --arg instructions "$INSTRUCTIONS_CONTENT" \
    '."github.copilot.chat.codeGeneration.instructions" = [{"text": $instructions}]' \
    "$VSCODE_SETTINGS" > /tmp/vscode_settings_tmp.json && \
    mv /tmp/vscode_settings_tmp.json "$VSCODE_SETTINGS"

  echo ""
  echo "Done. Copilot instructions applied successfully."
  echo ""
  echo "Restart VS Code to activate the new instructions."

else
  echo "jq not found — cannot auto-inject settings."
  echo ""
  echo "Manual setup required:"
  echo "  1. Open VS Code"
  echo "  2. Open Settings (CMD+, on Mac)"
  echo "  3. Search for: github.copilot.chat.codeGeneration.instructions"
  echo "  4. Paste the contents of: $INSTRUCTIONS_SOURCE"
  echo ""
  echo "Or install jq and re-run this script:"
  echo "  brew install jq"
fi

echo ""
echo "================================================"
echo "  Standards repo is your source of truth."
echo "  Pull latest before starting any new project."
echo "================================================"
echo ""
