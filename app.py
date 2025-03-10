from flask import Flask, request, render_template, Response, jsonify
from youtube_transcript_api import YouTubeTranscriptApi
from dotenv import load_dotenv
import os
import logging
import urllib.parse
from get_video_info import get_video_info
import json

# Initialize Flask app
app = Flask(__name__, static_folder='.', static_url_path='')

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Load environment variables
load_dotenv()

# Sanitize filenames to avoid issues with special characters
def sanitize_filename(filename):
    return filename.replace('/', '-').replace(':', '-')

# Function to extract quotes that match filter text
def extract_quotes(transcript_list, filter_text):
    quotes = []
    filter_text_lower = filter_text.lower()
    
    # Group transcript segments into context windows
    context_window_size = 5  # Number of segments before and after the matching segment
    
    for i, segment in enumerate(transcript_list):
        text = segment['text'].lower()
        if filter_text_lower in text:
            # Get timestamp in seconds
            timestamp = segment['start']
            
            # Format timestamp as MM:SS
            minutes = int(timestamp // 60)
            seconds = int(timestamp % 60)
            formatted_time = f"{minutes:02d}:{seconds:02d}"
            
            # Get context (segments before and after)
            start_idx = max(0, i - context_window_size)
            end_idx = min(len(transcript_list), i + context_window_size + 1)
            
            context_segments = transcript_list[start_idx:end_idx]
            context_text = ' '.join([seg['text'] for seg in context_segments])
            
            quotes.append({
                'timestamp': formatted_time,
                'timestamp_seconds': timestamp,
                'text': segment['text'],
                'context': context_text
            })
    
    return quotes

@app.route('/extract_quotes', methods=['GET', 'POST'])
def extract_video_quotes():
    if request.method == 'POST':
        data = request.json
        video_id = data.get('video_id')
        filter_text = data.get('filter_text')
    else:
        video_id = request.args.get('video_id')
        filter_text = request.args.get('filter_text')
    
    if not video_id:
        return jsonify({"error": "Video ID is required."}), 400
    
    if not filter_text:
        return jsonify({"error": "Filter text is required."}), 400

    try:
        # Fetch transcript
        logging.debug(f"Fetching transcript for video ID: {video_id}")
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        logging.debug(f"Transcript fetched successfully for video ID: {video_id}")
        
        # Extract quotes matching the filter text
        quotes = extract_quotes(transcript_list, filter_text)
        
        # Get YouTube API key
        youtube_api_key = os.getenv('YOUTUBE_API_KEY')
        if youtube_api_key:
            # Retrieve video info
            try:
                video_info = get_video_info(youtube_api_key, video_id)
                if video_info:
                    result = {
                        "video_title": video_info['title'],
                        "channel_name": video_info['channel'],
                        "quotes": quotes,
                        "filter_text": filter_text,
                        "total_matches": len(quotes)
                    }
                else:
                    result = {
                        "quotes": quotes,
                        "filter_text": filter_text,
                        "total_matches": len(quotes)
                    }
            except Exception as e:
                logging.error(f"Error retrieving video info: {e}", exc_info=True)
                result = {
                    "quotes": quotes,
                    "filter_text": filter_text,
                    "total_matches": len(quotes)
                }
        else:
            result = {
                "quotes": quotes,
                "filter_text": filter_text,
                "total_matches": len(quotes)
            }
        
        # Save the quotes to a file if requested
        save_to_file = request.args.get('save', 'false').lower() == 'true'
        if save_to_file:
            try:
                # Get video info for filename
                if youtube_api_key:
                    video_info = get_video_info(youtube_api_key, video_id)
                    if video_info:
                        channel_name = video_info['channel'].lower().replace(' ', '-')
                        video_title = video_info['title'].lower().replace(' ', '-')
                        
                        # Prepare directory and file paths
                        dir_path = os.path.join('./quotes/', urllib.parse.unquote(channel_name))
                        os.makedirs(dir_path, exist_ok=True)
                        filename = f"{sanitize_filename(urllib.parse.unquote(video_title))}_quotes.json"
                        filepath = os.path.join(dir_path, filename)
                        
                        with open(filepath, 'w') as f:
                            json.dump(result, f, indent=2)
                        
                        result["saved_to"] = filepath
            except Exception as e:
                logging.error(f"Error saving quotes to file: {e}", exc_info=True)
                result["error_saving"] = str(e)
        
        return jsonify(result)
    
    except Exception as e:
        logging.error(f"An error occurred: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/quotes_viewer', methods=['GET'])
def quotes_viewer():
    video_id = request.args.get('video_id')
    filter_text = request.args.get('filter_text')
    
    if not video_id or not filter_text:
        return "Both video_id and filter_text are required.", 400
    
    html = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Video Quotes</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
                color: #333;
            }}
            .container {{
                max-width: 800px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            h1 {{
                color: #1a73e8;
                margin-top: 0;
            }}
            .filter-info {{
                background-color: #e8f0fe;
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 20px;
            }}
            .quote-container {{
                margin-bottom: 20px;
                border-left: 4px solid #1a73e8;
                padding-left: 15px;
            }}
            .timestamp {{
                color: #d93025;
                font-weight: bold;
                cursor: pointer;
            }}
            .quote-text {{
                font-weight: bold;
                margin: 10px 0;
            }}
            .context {{
                background-color: #f8f9fa;
                padding: 10px;
                border-radius: 4px;
                font-size: 0.9em;
            }}
            .highlight {{
                background-color: #ffeb3b;
                padding: 0 2px;
            }}
            .loading {{
                text-align: center;
                padding: 20px;
                font-style: italic;
                color: #666;
            }}
            #video-info {{
                margin-bottom: 20px;
            }}
            .no-results {{
                text-align: center;
                padding: 20px;
                color: #666;
                font-style: italic;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Video Quotes</h1>
            <div id="video-info"></div>
            <div class="filter-info">
                <strong>Filter:</strong> <span id="filter-text">{filter_text}</span>
                <div><strong>Total matches:</strong> <span id="total-matches">Loading...</span></div>
            </div>
            <div id="quotes-container">
                <div class="loading">Loading quotes...</div>
            </div>
        </div>
        
        <script>
            const videoId = "{video_id}";
            const filterText = "{filter_text}";
            
            // Function to highlight filter text in a string
            function highlightText(text, filterText) {{
                const regex = new RegExp(filterText, 'gi');
                return text.replace(regex, match => `<span class="highlight">${{match}}</span>`);
            }}
            
            // Function to load quotes
            async function loadQuotes() {{
                try {{
                    const response = await fetch(`/extract_quotes?video_id=${{videoId}}&filter_text=${{encodeURIComponent(filterText)}}`);
                    const data = await response.json();
                    
                    // Update video info
                    const videoInfoElement = document.getElementById('video-info');
                    if (data.video_title && data.channel_name) {{
                        videoInfoElement.innerHTML = `
                            <h2>${{data.video_title}}</h2>
                            <p><strong>Channel:</strong> ${{data.channel_name}}</p>
                            <p><a href="https://www.youtube.com/watch?v=${{videoId}}" target="_blank">Watch on YouTube</a></p>
                        `;
                    }} else {{
                        videoInfoElement.innerHTML = `
                            <p><a href="https://www.youtube.com/watch?v=${{videoId}}" target="_blank">Watch on YouTube</a></p>
                        `;
                    }}
                    
                    // Update filter info
                    document.getElementById('total-matches').textContent = data.total_matches;
                    
                    // Update quotes container
                    const quotesContainer = document.getElementById('quotes-container');
                    
                    if (data.quotes.length === 0) {{
                        quotesContainer.innerHTML = '<div class="no-results">No matches found for this filter text.</div>';
                        return;
                    }}
                    
                    let quotesHTML = '';
                    data.quotes.forEach(quote => {{
                        quotesHTML += `
                            <div class="quote-container">
                                <div class="timestamp" onclick="window.open('https://www.youtube.com/watch?v=${{videoId}}&t=${{Math.floor(quote.timestamp_seconds)}}', '_blank')">
                                    🕒 ${{quote.timestamp}} (Click to watch at this timestamp)
                                </div>
                                <div class="quote-text">${{highlightText(quote.text, filterText)}}</div>
                                <div class="context">${{highlightText(quote.context, filterText)}}</div>
                            </div>
                        `;
                    }});
                    
                    quotesContainer.innerHTML = quotesHTML;
                    
                }} catch (error) {{
                    console.error('Error loading quotes:', error);
                    document.getElementById('quotes-container').innerHTML = `
                        <div class="error">
                            <p>Error loading quotes. Please try again.</p>
                            <p>Error details: ${{error.message}}</p>
                        </div>
                    `;
                }}
            }}
            
            // Load quotes when page loads
            window.addEventListener('DOMContentLoaded', loadQuotes);
        </script>
    </body>
    </html>
    '''
    
    return html

if __name__ == '__main__':
    app.run(debug=True, port=9000)
