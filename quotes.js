document.addEventListener('DOMContentLoaded', function() {
    // Get the quotes result from storage
    chrome.storage.local.get(['lastQuotesResult'], function(result) {
        const quotesResult = result.lastQuotesResult;
        if (!quotesResult) {
            document.getElementById('content').innerHTML = `
                <h1>Error</h1>
                <p>No quotes data found. Please try again.</p>
                <button class="back-button" id="close-button">Close</button>
            `;
            document.getElementById('close-button').addEventListener('click', function() {
                window.close();
            });
            return;
        }

        // Update the page title
        document.title = `Quotes for "${quotesResult.filter_text}" - ${quotesResult.video_title}`;

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
            const videoId = quotesResult.video_id;
            window.open(`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(timestampSeconds)}s`, '_blank');
        }

        // Build the HTML content
        let html = `
            <h1>Quotes for "${quotesResult.filter_text}"</h1>
            
            <div class="video-info">
                <h2>${quotesResult.video_title}</h2>
                <p>Channel: ${quotesResult.channel_name}</p>
                <p>Total matches: ${quotesResult.total_matches}</p>
            </div>
        `;

        if (quotesResult.quotes.length === 0) {
            html += `
                <div class="no-results">
                    <p>No matches found for "${quotesResult.filter_text}" in this video.</p>
                </div>
            `;
        } else {
            html += `<h2>Results</h2>`;
            
            quotesResult.quotes.forEach(quote => {
                const highlightedContext = highlightText(quote.context, quotesResult.filter_text);
                
                html += `
                    <div class="quote">
                        <p class="timestamp" data-seconds="${quote.timestamp_seconds}">${quote.timestamp}</p>
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