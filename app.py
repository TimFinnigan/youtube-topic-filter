import sys
import os

# Prevent the creation of __pycache__ directories
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'

from flask import Flask, request, render_template, Response, jsonify
from youtube_transcript_api import YouTubeTranscriptApi
from dotenv import load_dotenv
import logging
import urllib.parse
from get_video_info import get_video_info
import json
import re

# Initialize Flask app
app = Flask(__name__, static_folder='.', static_url_path='')

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Load environment variables
load_dotenv()

# Root route to handle the homepage
@app.route('/')
def index():
    html = '''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>YouTube Topic Filter</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
                color: #333;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 {
                color: #d93025;
                margin-top: 0;
            }
            .feature {
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
            }
            h2 {
                color: #1a73e8;
            }
            .button {
                display: inline-block;
                background-color: #1a73e8;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 4px;
                margin-top: 20px;
            }
            .button:hover {
                background-color: #1557b0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>YouTube Topic Filter</h1>
            <p>Welcome to the YouTube Topic Filter server. This server powers the browser extension that allows you to extract quotes and view transcripts from YouTube videos.</p>
            
            <div class="feature">
                <h2>How to Use</h2>
                <p>This is a backend server for the YouTube Topic Filter browser extension. To use it:</p>
                <ol>
                    <li>Make sure this server is running</li>
                    <li>Install the browser extension</li>
                    <li>Navigate to YouTube</li>
                    <li>Hover over any video thumbnail</li>
                    <li>Use the buttons that appear to extract quotes or view transcripts</li>
                </ol>
            </div>
            
            <div class="feature">
                <h2>Available Features</h2>
                <ul>
                    <li><strong>Extract Quotes</strong> - Find all mentions of specific words or phrases in a video</li>
                    <li><strong>View Full Transcript</strong> - See the complete transcript with clickable timestamps</li>
                    <li><strong>View Text Transcript</strong> - See just the text without timestamps</li>
                </ul>
            </div>
            
            <p>The server is running correctly. You can now use the browser extension.</p>
        </div>
    </body>
    </html>
    '''
    return html

# Sanitize filenames to avoid issues with special characters
def sanitize_filename(filename):
    return filename.replace('/', '-').replace(':', '-')

# Function to extract quotes that match filter text
def extract_quotes(transcript_list, filter_text):
    quotes = []
    filter_text_lower = filter_text.lower()
    
    # Group transcript segments into context windows
    context_window_size = 5  # Number of segments before and after the matching segment
    
    try:
        # Handle multi-word phrases and single words differently
        words = filter_text_lower.split()
        
        if len(words) > 1:
            # For phrases, use a simpler approach
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
        else:
            # For single words, use word boundary regex
            # Escape special regex characters in the filter text
            escaped_filter_text = re.escape(filter_text_lower)
            # Create pattern to match word boundaries
            pattern = re.compile(r'\b' + escaped_filter_text + r'\b', re.IGNORECASE)
            
            for i, segment in enumerate(transcript_list):
                text = segment['text'].lower()
                # Use regex search for single words
                if pattern.search(text):
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
    except Exception as e:
        logging.error(f"Error in extract_quotes: {e}", exc_info=True)
        # Fall back to simple substring matching if regex fails
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
    try:
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

        # Log the request parameters
        logging.info(f"Processing extract_quotes request: video_id={video_id}, filter_text={filter_text}")
        
        try:
            # Fetch transcript
            logging.debug(f"Fetching transcript for video ID: {video_id}")
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            logging.debug(f"Transcript fetched successfully for video ID: {video_id}")
            
            # Extract quotes matching the filter text
            quotes = extract_quotes(transcript_list, filter_text)
            logging.info(f"Found {len(quotes)} quotes matching filter text: {filter_text}")
            
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
            logging.error(f"Error processing transcript: {e}", exc_info=True)
            return jsonify({"error": f"Error processing transcript: {str(e)}"}), 500
    
    except Exception as e:
        logging.error(f"An error occurred in extract_video_quotes: {e}", exc_info=True)
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
            .button {{
                display: inline-block;
                background-color: #1a73e8;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                text-decoration: none;
                margin-top: 10px;
                cursor: pointer;
                border: none;
                font-size: 14px;
            }}
            .button:hover {{
                background-color: #1557b0;
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
                <button id="view-full-transcript" class="button" onclick="window.open('/full_transcript?video_id={video_id}', '_blank')">
                    View Full Transcript
                </button>
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
                try {{
                    // Check if it's a multi-word phrase
                    const words = filterText.split(/\\s+/);
                    
                    if (words.length > 1) {{
                        // For phrases, use simple string replacement with case insensitivity
                        const regex = new RegExp(filterText.replace(/[.*+?^${{}}()|[\\]\\\\]/g, '\\\\$&'), 'gi');
                        return text.replace(regex, match => `<span class="highlight">${{match}}</span>`);
                    }} else {{
                        // For single words, use word boundaries
                        const escapedFilterText = filterText.replace(/[.*+?^${{}}()|[\\]\\\\]/g, '\\\\$&');
                        const regex = new RegExp('\\\\b' + escapedFilterText + '\\\\b', 'gi');
                        return text.replace(regex, match => `<span class="highlight">${{match}}</span>`);
                    }}
                }} catch (error) {{
                    console.error('Error in highlightText:', error);
                    // Fallback to simple highlighting without regex
                    return text.replace(new RegExp(filterText.replace(/[.*+?^${{}}()|[\\]\\\\]/g, '\\\\$&'), 'gi'), match => 
                        `<span class="highlight">${{match}}</span>`
                    );
                }}
            }}
            
            // Function to load quotes
            async function loadQuotes() {{
                const quotesContainer = document.getElementById('quotes-container');
                const totalMatches = document.getElementById('total-matches');
                
                try {{
                    // Set a timeout to show an error message if the request takes too long
                    const timeoutPromise = new Promise((_, reject) => {{
                        setTimeout(() => reject(new Error('Request timed out')), 30000); // 30 second timeout
                    }});
                    
                    // Make the fetch request
                    const fetchPromise = fetch(`/extract_quotes?video_id=${{videoId}}&filter_text=${{encodeURIComponent(filterText)}}`);
                    
                    // Race between the fetch and the timeout
                    const response = await Promise.race([fetchPromise, timeoutPromise]);
                    
                    if (!response.ok) {{
                        throw new Error(`Server returned ${{response.status}}: ${{response.statusText}}`);
                    }}
                    
                    const data = await response.json();
                    
                    if (data.error) {{
                        throw new Error(data.error);
                    }}
                    
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
                    totalMatches.textContent = data.total_matches;
                    
                    // Update quotes container
                    if (!data.quotes || data.quotes.length === 0) {{
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
                    totalMatches.textContent = '0';
                    quotesContainer.innerHTML = `
                        <div class="error" style="color: #d93025; padding: 15px; background-color: #fce8e6; border-radius: 4px; margin-top: 15px;">
                            <h3 style="margin-top: 0;">Error loading quotes</h3>
                            <p>There was a problem processing your request. Please try again with a different search term.</p>
                            <p><strong>Error details:</strong> ${{error.message || 'Unknown error'}}</p>
                            <p style="margin-top: 15px;"><button onclick="location.reload()" style="padding: 8px 16px; background-color: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer;">Try Again</button></p>
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

@app.route('/full_transcript', methods=['GET'])
def full_transcript():
    video_id = request.args.get('video_id')
    
    if not video_id:
        return "Video ID is required.", 400
    
    try:
        # Fetch transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Get YouTube API key
        youtube_api_key = os.getenv('YOUTUBE_API_KEY')
        video_title = "YouTube Video"
        channel_name = ""
        
        if youtube_api_key:
            # Retrieve video info
            try:
                video_info = get_video_info(youtube_api_key, video_id)
                if video_info:
                    video_title = video_info['title']
                    channel_name = video_info['channel']
            except Exception as e:
                logging.error(f"Error retrieving video info: {e}", exc_info=True)
        
        html = f'''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Full Transcript - {video_title}</title>
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
                .transcript-segment {{
                    margin-bottom: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                }}
                .timestamp {{
                    color: #d93025;
                    font-weight: bold;
                    cursor: pointer;
                    margin-bottom: 5px;
                }}
                .segment-text {{
                    margin: 0;
                }}
                .back-button {{
                    display: inline-block;
                    background-color: #1a73e8;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    text-decoration: none;
                    margin-top: 20px;
                    cursor: pointer;
                }}
                .back-button:hover {{
                    background-color: #1557b0;
                }}
                .button-group {{
                    margin: 20px 0;
                    display: flex;
                    gap: 10px;
                }}
                .toggle-button {{
                    background-color: #1a73e8;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                }}
                .toggle-button:hover {{
                    background-color: #1557b0;
                }}
                .toggle-button.active {{
                    background-color: #34a853;
                }}
                #text-only-view {{
                    line-height: 1.8;
                    display: none;
                }}
                .text-paragraph {{
                    margin-bottom: 1em;
                }}
                .copy-button {{
                    background-color: #1a73e8;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    margin-bottom: 20px;
                }}
                .copy-button:hover {{
                    background-color: #1557b0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Full Transcript</h1>
                <div id="video-info">
                    <h2>{video_title}</h2>
                    {f'<p><strong>Channel:</strong> {channel_name}</p>' if channel_name else ''}
                    <p><a href="https://www.youtube.com/watch?v={video_id}" target="_blank">Watch on YouTube</a></p>
                </div>
                
                <div class="button-group">
                    <button id="timestamped-button" class="toggle-button active" onclick="showTimestamped()">With Timestamps</button>
                    <button id="text-only-button" class="toggle-button" onclick="showTextOnly()">Text Only</button>
                </div>
                
                <button id="copy-text-button" class="copy-button" onclick="copyTextToClipboard()" style="display: none;">
                    Copy Text to Clipboard
                </button>
                
                <div id="transcript-container">
        '''
        
        # Add each transcript segment
        for segment in transcript_list:
            timestamp = segment['start']
            minutes = int(timestamp // 60)
            seconds = int(timestamp % 60)
            formatted_time = f"{minutes:02d}:{seconds:02d}"
            
            html += f'''
                    <div class="transcript-segment">
                        <div class="timestamp" onclick="window.open('https://www.youtube.com/watch?v={video_id}&t={int(timestamp)}', '_blank')">
                            🕒 {formatted_time} (Click to watch at this timestamp)
                        </div>
                        <p class="segment-text">{segment['text']}</p>
                    </div>
            '''
        
        # Create text-only version with better formatting
        # Group segments into paragraphs (approximately every 5 segments)
        paragraphs = []
        current_paragraph = []
        
        for i, segment in enumerate(transcript_list):
            current_paragraph.append(segment['text'])
            
            # Start a new paragraph every ~5 segments or if the segment ends with a period, question mark, or exclamation point
            if (i + 1) % 5 == 0 or (segment['text'] and segment['text'][-1] in ['.', '?', '!']):
                paragraphs.append(' '.join(current_paragraph))
                current_paragraph = []
        
        # Add any remaining segments to the last paragraph
        if current_paragraph:
            paragraphs.append(' '.join(current_paragraph))
        
        # Create the text-only HTML
        text_only_html = ''
        for paragraph in paragraphs:
            text_only_html += f'<p class="text-paragraph">{paragraph}</p>'
        
        html += f'''
                </div>
                
                <div id="text-only-view">
                    {text_only_html}
                </div>
                
                <a href="javascript:history.back()" class="back-button">Back to Quotes</a>
            </div>
            
            <script>
                function showTimestamped() {{
                    document.getElementById('transcript-container').style.display = 'block';
                    document.getElementById('text-only-view').style.display = 'none';
                    document.getElementById('copy-text-button').style.display = 'none';
                    document.getElementById('timestamped-button').classList.add('active');
                    document.getElementById('text-only-button').classList.remove('active');
                }}
                
                function showTextOnly() {{
                    document.getElementById('transcript-container').style.display = 'none';
                    document.getElementById('text-only-view').style.display = 'block';
                    document.getElementById('copy-text-button').style.display = 'block';
                    document.getElementById('timestamped-button').classList.remove('active');
                    document.getElementById('text-only-button').classList.add('active');
                }}
                
                function copyTextToClipboard() {{
                    // Get all text from paragraphs
                    const paragraphs = document.querySelectorAll('.text-paragraph');
                    let fullText = '';
                    
                    paragraphs.forEach(paragraph => {{
                        fullText += paragraph.textContent + '\\n\\n';
                    }});
                    
                    // Create a temporary textarea element to copy from
                    const textarea = document.createElement('textarea');
                    textarea.value = fullText;
                    document.body.appendChild(textarea);
                    textarea.select();
                    
                    try {{
                        // Execute copy command
                        document.execCommand('copy');
                        alert('Transcript copied to clipboard!');
                    }} catch (err) {{
                        console.error('Failed to copy text: ', err);
                        alert('Failed to copy text. Please try again.');
                    }}
                    
                    // Remove the temporary textarea
                    document.body.removeChild(textarea);
                }}
            </script>
        </body>
        </html>
        '''
        
        return html
        
    except Exception as e:
        logging.error(f"Error fetching transcript: {e}", exc_info=True)
        return f"Error fetching transcript: {str(e)}", 500

if __name__ == '__main__':
    app.run(debug=True, port=9000)
