#!/bin/bash

set -e  # exit on error

echo "[+] Installing dependencies..."
npm install

echo "[+] Compiling TypeScript..."
npx tsc

echo "[+] Creating output folder structure..."
OUT_DIR="out/pan-scraper-v1.0.0"
mkdir -p "$OUT_DIR"

echo "[+] Copying icons/"
cp -r icons "$OUT_DIR/"

echo "[+] Copying manifest.json and compiled scripts..."
cp manifest.json "$OUT_DIR/"
cp dist/background.js "$OUT_DIR/"
cp dist/content.js "$OUT_DIR/"
cp dist/popup.js "$OUT_DIR/"

echo "[+] Copying popup HTML..."
cp src/popup.html "$OUT_DIR/"

echo "[✓] Setup complete! Load '$OUT_DIR' in chrome://extensions"
