# Transcript Pro - Chrome Web Store Submission Guide

This document provides instructions for submitting the Transcript Pro extension to the Chrome Web Store.

## Pre-submission Checklist

Before submitting to the Chrome Web Store, ensure you have:

1. **Created all required icon sizes**
   - 16x16 (already exists)
   - 48x48 (needs to be created)
   - 128x128 (needs to be created - required for submission)

2. **Tested the extension thoroughly**
   - Test on different YouTube pages (home, search results, video pages)
   - Test the "Find Words" functionality
   - Test the "View Transcript" functionality
   - Ensure buttons appear correctly on hover
   - Verify all features work as expected

3. **Prepared screenshots for the store listing**
   - At least one screenshot showing the extension in use
   - Recommended: 3-5 screenshots showing different features
   - Screenshot dimensions: 1280x800 or 640x400

4. **Prepared promotional images (optional but recommended)**
   - Small promotional tile: 440x280px
   - Large promotional tile: 920x680px

## Submission Process

1. **Create the submission package**
   ```
   bash prepare_submission.sh
   ```
   This will create a file called `transcript-pro-extension.zip` with all necessary files.

2. **Go to the Chrome Web Store Developer Dashboard**
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Sign in with your Google account
   - Pay the one-time developer registration fee ($5) if you haven't already

3. **Create a new item**
   - Click "New Item"
   - Upload the `transcript-pro-extension.zip` file
   - Wait for the package to be processed

4. **Fill in the store listing information**
   - **Extension name**: Transcript Pro
   - **Summary**: Find words and view transcripts from YouTube videos with ease.
   - **Detailed description**: 
     ```
     Transcript Pro enhances your YouTube experience by allowing you to:
     
     • Find specific words or phrases in any YouTube video
     • View complete transcripts with clickable timestamps
     • Navigate videos more efficiently
     
     Simply hover over any video thumbnail or the video player, and use the buttons that appear to find words or view the transcript.
     
     Perfect for researchers, students, content creators, or anyone who wants to quickly find information in YouTube videos without watching the entire content.
     ```
   - **Category**: Productivity
   - **Language**: English

5. **Privacy practices**
   - Copy the content from `privacy-policy.txt` into the privacy policy field
   - Answer the data collection questions truthfully (the extension doesn't collect personal data)

6. **Upload screenshots and promotional images**
   - Upload the screenshots you prepared
   - Add promotional images if available

7. **Set distribution options**
   - Choose where your extension will be available (recommended: all regions)
   - Set visibility options (public or unlisted)

8. **Submit for review**
   - Review all information
   - Click "Submit for review"
   - The review process typically takes 1-3 business days

## After Submission

- Monitor your developer email for any questions from the Chrome Web Store team
- Be prepared to make changes if requested
- Once approved, your extension will be published to the Chrome Web Store

## Updating the Extension

To update the extension in the future:
1. Make your changes to the code
2. Increment the version number in `manifest.json`
3. Run the `prepare_submission.sh` script again
4. Upload the new zip file to the Chrome Web Store Developer Dashboard
5. Submit for review 