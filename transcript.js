document.addEventListener('DOMContentLoaded', function() {
    // Get the transcript result from storage
    chrome.storage.local.get(['lastTranscriptResult'], function(result) {
        const transcriptResult = result.lastTranscriptResult;
        if (!transcriptResult) {
            document.getElementById('content').innerHTML = `
                <h1>Error</h1>
                <p>No transcript data found. Please try again.</p>
                <button class="back-button" id="close-button">Close</button>
            `;
            document.getElementById('close-button').addEventListener('click', function() {
                window.close();
            });
            return;
        }

        // Update the page title
        document.title = `Transcript - ${transcriptResult.video_title}`;

        // Function to format timestamp
        function formatTimestamp(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }

        // Function to handle timestamp clicks
        function handleTimestampClick(timestampSeconds) {
            const videoId = transcriptResult.video_id;
            window.open(`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(timestampSeconds)}s`, '_blank');
        }

        // Build the HTML content
        let html = `
            <h1>Transcript</h1>
            
            <div class="video-info">
                <h2>${transcriptResult.video_title}</h2>
                <p>Channel: ${transcriptResult.channel_name}</p>
            </div>

            <div class="view-toggle">
                <button id="full-view-button" class="toggle-button active">Full View</button>
                <button id="text-only-button" class="toggle-button">Text Only</button>
            </div>

            <div id="transcript-container">
        `;

        if (!transcriptResult.transcript || transcriptResult.transcript.length === 0) {
            html += `
                <div class="no-results">
                    <p>No transcript available for this video.</p>
                </div>
            `;
        } else {
            transcriptResult.transcript.forEach(segment => {
                const formattedTime = formatTimestamp(segment.start);
                
                html += `
                    <div class="transcript-segment">
                        <span class="timestamp" data-seconds="${segment.start}">${formattedTime}</span>
                        <span class="text">${segment.text}</span>
                    </div>
                `;
            });
        }

        html += `
            </div>
            <button class="back-button" id="close-button">Close</button>
        `;
        
        // Update the content
        document.getElementById('content').innerHTML = html;
        
        // Add event listener to close button
        document.getElementById('close-button').addEventListener('click', function() {
            window.close();
        });
        
        // Add event listeners to timestamps
        document.querySelectorAll('.timestamp').forEach(el => {
            el.addEventListener('click', function() {
                const seconds = parseFloat(this.getAttribute('data-seconds'));
                handleTimestampClick(seconds);
            });
        });

        // Add event listeners to toggle buttons
        document.getElementById('full-view-button').addEventListener('click', function() {
            document.getElementById('transcript-container').classList.remove('text-only');
            document.getElementById('full-view-button').classList.add('active');
            document.getElementById('text-only-button').classList.remove('active');
        });

        document.getElementById('text-only-button').addEventListener('click', function() {
            document.getElementById('transcript-container').classList.add('text-only');
            document.getElementById('text-only-button').classList.add('active');
            document.getElementById('full-view-button').classList.remove('active');
        });

        // If text-only was requested, switch to text-only view
        if (transcriptResult.textOnly) {
            document.getElementById('text-only-button').click();
        }
    });
}); 