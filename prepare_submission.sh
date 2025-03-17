#!/bin/bash

# Create a directory for the submission
mkdir -p submission

# Copy all necessary files
cp manifest.json submission/
cp content.js submission/
cp background.js submission/
cp styles.css submission/
cp popup.html submission/
cp quotes.html submission/
cp quotes.js submission/
cp transcript.html submission/
cp transcript.js submission/
cp privacy-policy.html submission/
cp -r images submission/

# Create a zip file
cd submission
zip -r ../transcript-pro-extension.zip *
cd ..

echo "Submission package created: transcript-pro-extension.zip"
echo ""
echo "Before submitting to the Chrome Web Store, please ensure:"
echo "1. You have created larger icon sizes (128x128 is required)"
echo "2. You have updated the manifest.json with these icon sizes"
echo "3. You have tested the extension thoroughly"
echo "4. You have prepared screenshots for the store listing"
echo ""
echo "Chrome Web Store submission checklist:"
echo "- Extension name: Transcript Pro"
echo "- Description: Find words and view transcripts from YouTube videos with ease."
echo "- Category: Productivity"
echo "- Language: English"
echo "- Privacy policy: Use the content from privacy-policy.txt"
echo "- Screenshots: At least one screenshot showing the extension in use"
echo "- Promotional images (optional): Small tile (440x280px), Large tile (920x680px)"
echo "- Price: Free" 