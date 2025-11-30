#!/bin/bash

# Script to install and setup act for testing GitHub Actions locally

set -e

echo "🔧 Setting up act (GitHub Actions local runner)"
echo "================================================"
echo ""

# Check if act is already installed
if command -v act &> /dev/null; then
    ACT_VERSION=$(act --version)
    echo "✅ act is already installed: $ACT_VERSION"
    exit 0
fi

echo "📦 Installing act..."
echo ""

# Try Homebrew first (macOS)
if command -v brew &> /dev/null; then
    echo "Attempting to install via Homebrew..."
    if brew install act 2>/dev/null; then
        echo "✅ act installed via Homebrew"
        exit 0
    else
        echo "⚠️  Homebrew installation failed, trying alternative method..."
    fi
fi

# Try direct download
echo "Downloading act binary..."
ARCH=$(uname -m)
OS=$(uname -s | tr '[:upper:]' '[:lower:]')

if [ "$OS" = "darwin" ]; then
    OS="macOS"
fi

# Download latest release
echo "Fetching latest act release..."
ACT_VERSION=$(curl -s https://api.github.com/repos/nektos/act/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$ACT_VERSION" ]; then
    echo "❌ Failed to fetch act version"
    exit 1
fi

echo "Latest version: $ACT_VERSION"

# Determine architecture
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    ACT_ARCH="arm64"
elif [ "$ARCH" = "x86_64" ]; then
    ACT_ARCH="x86_64"
else
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
fi

ACT_URL="https://github.com/nektos/act/releases/download/${ACT_VERSION}/act_${OS}_${ACT_ARCH}.tar.gz"

echo "Downloading from: $ACT_URL"
curl -L -o /tmp/act.tar.gz "$ACT_URL"

echo "Extracting..."
tar -xzf /tmp/act.tar.gz -C /tmp

# Install to /usr/local/bin (requires sudo) or ~/.local/bin
INSTALL_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"

if [ -w /usr/local/bin ]; then
    sudo mv /tmp/act /usr/local/bin/act
    sudo chmod +x /usr/local/bin/act
    echo "✅ act installed to /usr/local/bin/act"
elif [ -w "$INSTALL_DIR" ]; then
    mv /tmp/act "$INSTALL_DIR/act"
    chmod +x "$INSTALL_DIR/act"
    echo "✅ act installed to $INSTALL_DIR/act"
    echo ""
    echo "⚠️  Add to PATH: export PATH=\"\$PATH:$INSTALL_DIR\""
else
    echo "❌ Cannot install act (no write permissions)"
    echo "   Please install manually or run with sudo"
    exit 1
fi

# Verify installation
if command -v act &> /dev/null; then
    ACT_VERSION=$(act --version)
    echo ""
    echo "✅ act successfully installed: $ACT_VERSION"
    echo ""
    echo "Next steps:"
    echo "  1. Run: act -j test"
    echo "  2. Or: act -j build"
    echo "  3. Or: act (runs all jobs)"
else
    echo ""
    echo "⚠️  act installed but not in PATH"
    echo "   Add to PATH or use full path: $INSTALL_DIR/act"
fi

rm -f /tmp/act.tar.gz

