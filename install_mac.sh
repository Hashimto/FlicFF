#!/usr/bin/env bash

# FlicFF Audio/Video Converter macOS Installer and Builder script
# Installs system FFmpeg via Homebrew, builds Python virtual environment,
# compiling binary using PyInstaller and packages it into an elegant installable DMG disk image.

set -e

echo "===================================================="
echo "          FlicFF Audio/Video Converter              "
echo "            macOS Packaging Workflow                "
echo "===================================================="

# 1. Detection of Homebrew & Auto installation of FFmpeg
if ! command -v brew &>/dev/null; then
    echo "[-] Homebrew is not detected. We highly recommend installing it first."
    echo "    URL: https://brew.sh/"
else
    echo "[+] Homebrew detected. Checking FFmpeg status..."
    if ! command -v ffmpeg &>/dev/null; then
        echo "[*] Installing FFmpeg via Homebrew..."
        brew install ffmpeg
    else
        echo "[+] FFmpeg is already installed and configured in system PATH!"
    fi
fi

# 2. Virtual environment setup
echo "[*] Setting up Python Virtual Environment..."
python3 -m venv venv
source venv/bin/activate

echo "[*] Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# 3. Compiling binary using PyInstaller
echo "[*] Running PyInstaller compiler to generate macOS App Bundle..."
pyinstaller --noconsole \
            --onefile \
            --name="FlicFF" \
            --clean \
            flicff_converter.py

echo "[+] Standalone executable created: dist/FlicFF"

# 4. Packaging into a DMG Installer
echo "[*] Creating macOS mountable DMG image..."
# Create a temporary empty folder for DMG layout out-of-bounds from PyInstaller's dist
dmg_temp="dmg_temp"
rm -rf "$dmg_temp"
mkdir -p "$dmg_temp"

# If PyInstaller was run with --noconsole, it produces a .app bundle on macOS.
# Let's adjust based on whether FlicFF.app exists or FlicFF executable exists.
if [ -d "dist/FlicFF.app" ]; then
    echo "[+] Bundling FlicFF.app into DMG..."
    cp -R "dist/FlicFF.app" "$dmg_temp/"
else
    echo "[+] Standalone binary found. Creating a pseudo App directory structure..."
    # Build standard app bundle shell
    mkdir -p "$dmg_temp/FlicFF.app/Contents/MacOS"
    cp "dist/FlicFF" "$dmg_temp/FlicFF.app/Contents/MacOS/FlicFF"
    chmod +x "$dmg_temp/FlicFF.app/Contents/MacOS/FlicFF"
fi

# Add a symlink to Applications to support easy drag-and-drop installing
ln -s /Applications "$dmg_temp/Applications"

# Output DMG filename
dmg_name="FlicFF_Setup_macOS.dmg"
rm -f "dist/$dmg_name"
rm -f "$dmg_name"

# Flush filesystem buffers to resolve macOS resource locking (Resource busy errors)
sync
sleep 2

echo "[*] Compiling disk image using hdiutil..."
hdiutil create -volname "FlicFF Installer" \
               -srcfolder "$dmg_temp" \
               -ov \
               -format UDZO \
               "$dmg_name"

# Move generated DMG into dist folder cleanly
mv "$dmg_name" "dist/$dmg_name"

# Cleanup temporary files
rm -rf "$dmg_temp"

echo ""
echo "===================================================="
echo "[+] BUILD & BUNDLING SUCCESSFUL!"
echo "    App Bundle: dist/FlicFF.app"
echo "    DMG Installer: dist/$dmg_name"
echo "===================================================="
echo "To install FlicFF:"
echo "1. Double-click dist/$dmg_name to mount the disk image"
echo "2. Drag FlicFF.app to the Applications shortcut link!"
echo "===================================================="
