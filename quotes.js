document.addEventListener('DOMContentLoaded', function() {
    // Get the quotes result from storage
    chrome.storage.local.get(['lastQuotesResult'], function(result) {
        const searchResult = result.lastQuotesResult;
        if (!searchResult) {
            document.getElementById('content').innerHTML = `
                <h1>Error</h1>
                <p>No search results found. Please try again.</p>
                <button class="back-button" id="close-button">Close</button>
            `;
            document.getElementById('close-button').addEventListener('click', function() {
                window.close();
            });
            return;
        }

        // Update the page title
        document.title = `Search Results for "${searchResult.filter_text}" - ${searchResult.video_title}`;

        // Function to highlight the filter text in a string
        function highlightText(text, filterText) {
            if (!filterText) return text;
            
            // For multi-word phrases
            if (filterText.includes(' ')) {
                const regex = new RegExp(filterText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
                return text.replace(regex, match => `<span class="highlight">${match}</span>`);
            } 
            // For single words, use word boundary
            else {
                const regex = new RegExp(`\\b${filterText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
                return text.replace(regex, match => `<span class="highlight">${match}</span>`);
            }
        }

        // Function to handle timestamp clicks
        function handleTimestampClick(timestampSeconds) {
            const videoId = searchResult.video_id;
            window.open(`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(timestampSeconds)}s`, '_blank');
        }

        // Build the HTML content
        let html = `
            <h1>Search Results for "${searchResult.filter_text}"</h1>
            
            <div class="video-info">
                <h2>${searchResult.video_title}</h2>
                <p>Channel: ${searchResult.channel_name}</p>
                <p>Total matches: ${searchResult.total_matches}</p>
            </div>
        `;

        if (searchResult.quotes.length === 0) {
            html += `
                <div class="no-results">
                    <p>No matches found for "${searchResult.filter_text}" in this video.</p>
                </div>
            `;
        } else {
            html += `<h2>Results</h2>`;
            
            searchResult.quotes.forEach(item => {
                const highlightedContext = highlightText(item.context, searchResult.filter_text);
                
                html += `
                    <div class="result-item">
                        <p class="timestamp" data-seconds="${item.timestamp_seconds}">${item.timestamp}</p>
                        <p>${highlightedContext}</p>
                    </div>
                `;
            });
        }

        html += `<button class="back-button" id="close-button">Close</button>`;
        
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
    });
}); 