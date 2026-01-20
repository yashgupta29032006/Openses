#!/bin/bash

# Openses Release Build Script
# Target: macOS arm64
# Output: build/yg-arm64

set -e # Exit on error

echo "========================================"
echo "🚀 Starting Openses Build Process"
echo "========================================"

# 1. Define Paths
BUILD_DIR="./build"
BINARY_NAME="yg-arm64"
OUTPUT_PATH="$BUILD_DIR/$BINARY_NAME"

# 2. Clean Build Directory
echo "🧹 Cleaning build directory..."
if [ -d "$BUILD_DIR" ]; then
    # Only remove files, be careful not to delete important subdirs if any (though build usually safe)
    rm -f "$BUILD_DIR"/*
    echo "   ✓ Removed old artifacts from $BUILD_DIR"
else
    mkdir -p "$BUILD_DIR"
    echo "   ✓ Created $BUILD_DIR"
fi

# 3. Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run build
echo "   ✓ TypeScript compilation complete"

# 4. Package Binary
echo "📦 Packaging for macOS arm64..."
# Using --output to force the exact filename "yg-arm64"
npx pkg . --targets node18-macos-arm64 --output "$OUTPUT_PATH" --compress GZip

if [ -f "$OUTPUT_PATH" ]; then
    echo "   ✓ Binary created at $OUTPUT_PATH"
else
    echo "   ❌ Failed to create binary"
    exit 1
fi

# 5. Verify Build
echo "========================================"
echo "🔍 Verifying Build..."
echo "========================================"

FILE_SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)
echo "   File Size: $FILE_SIZE"

echo "   Running smoke test (yg-arm64 --help)..."
echo "   ----------------------------------------"
"$OUTPUT_PATH" --help
echo "   ----------------------------------------"

echo "✅ Build Successful!"
echo "   Output: $OUTPUT_PATH"
