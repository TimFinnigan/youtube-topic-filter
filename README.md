# YouTube Topic Filter

A browser extension that allows you to extract quotes from YouTube videos based on specific topics or keywords.

## Features

### Quote Extraction
Hover over any YouTube video thumbnail and click "Extract Quotes" to find all mentions of specific words or phrases in the video. Enter your search term when prompted, and the extension will:
- Extract all segments of the video that mention your search term
  - For single words: matches whole words only (e.g., "cat" won't match "category")
  - For phrases: matches the exact phrase
- Show the timestamp for each mention
- Provide context around each mention
- Allow you to click on timestamps to jump directly to that point in the video
- Highlight the search terms in the results
- Save the results as JSON files for future reference

## Installation

### Prerequisites
- Python 3.8 or higher
- Flask
- YouTube Data API key

### Setup

1. Clone this repository:
```
git clone https://github.com/yourusername/youtube-topic-filter.git
cd youtube-topic-filter
```

2. Install the required Python packages:
```
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory with your API key:
```
YOUTUBE_API_KEY=your_youtube_api_key
```

4. Install the browser extension:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory

5. Start the Flask server:
```
python app.py
```

## Usage

1. Navigate to YouTube
2. Hover over any video thumbnail
3. Click "Extract Quotes"
4. Enter the text you want to search for:
   - For single words (e.g., "climate"): Will match only the exact word
   - For phrases (e.g., "climate change"): Will match the exact phrase
5. View the results in your browser
6. Click on timestamps to jump to specific points in the video

## Directory Structure

- `quotes/` - Contains extracted quotes saved as JSON files
- `app.py` - Flask server for processing video content
- `content.js` - Browser extension content script
- `manifest.json` - Browser extension configuration
- `popup.html` - Browser extension popup
- `styles.css` - Styles for the browser extension
- `get_video_info.py` - Helper script for retrieving video metadata

## License

MIT

## Acknowledgements

- [YouTube Transcript API](https://github.com/jdepoix/youtube-transcript-api)
- [Flask](https://flask.palletsprojects.com/) 