document.body.addEventListener('mouseover', function (e) {
    // Check for thumbnail hover
    const thumbnail = e.target.closest('a#thumbnail');
    
    // Check for video player hover (on video page)
    const videoPlayer = e.target.closest('.html5-video-container');
    
    // Proceed if either a thumbnail or video player is hovered
    if (thumbnail || videoPlayer) {
        console.log('Hovered over a thumbnail or video player');

        // Create container for buttons if it doesn't exist
        let btnContainer = document.getElementById('myCustomButtonContainer');
        if (!btnContainer) {
            btnContainer = document.createElement('div');
            btnContainer.id = 'myCustomButtonContainer';
            btnContainer.style.position = 'absolute';
            btnContainer.style.zIndex = '1000';
            btnContainer.style.display = 'flex';
            btnContainer.style.flexDirection = 'column';
            btnContainer.style.gap = '5px';
            document.body.appendChild(btnContainer);
        }

        // Create quotes button if it doesn't exist
        let quotesBtn = document.getElementById('myQuotesButton');
        if (!quotesBtn) {
            quotesBtn = document.createElement('button');
            quotesBtn.id = 'myQuotesButton';
            quotesBtn.innerText = 'Extract Quotes';
            quotesBtn.className = 'custom-yt-btn';
            btnContainer.appendChild(quotesBtn);
        }

        // Create transcript button if it doesn't exist
        let transcriptBtn = document.getElementById('myTranscriptButton');
        if (!transcriptBtn) {
            transcriptBtn = document.createElement('button');
            transcriptBtn.id = 'myTranscriptButton';
            transcriptBtn.innerText = 'View Transcript';
            transcriptBtn.className = 'custom-yt-btn';
            btnContainer.appendChild(transcriptBtn);
        }

        // Get video ID either from thumbnail or current page URL
        const getVideoId = () => {
            if (thumbnail) {
                const videoUrl = new URL(thumbnail.href);
                return videoUrl.searchParams.get('v');
            } else {
                // We're on a video page, get video ID from URL
                const currentUrl = new URL(window.location.href);
                return currentUrl.searchParams.get('v');
            }
        };

        // Set up quotes button click handler
        quotesBtn.onclick = function () {
            const videoId = getVideoId();
            if (videoId) {
                const filterText = prompt('Enter text to filter quotes by:');
                if (filterText && filterText.trim() !== '') {
                    // Send message to background script instead of opening Flask URL
                    chrome.runtime.sendMessage({
                        action: 'extractQuotes',
                        videoId: videoId,
                        filterText: filterText.trim()
                    }, function(response) {
                        if (!response || !response.success) {
                            alert('Error extracting quotes: ' + (response?.error || 'Unknown error'));
                        }
                    });
                }
            } else {
                alert('Could not extract video ID.');
            }
        };

        // Set up transcript button click handler
        transcriptBtn.onclick = function () {
            const videoId = getVideoId();
            if (videoId) {
                // Send message to background script instead of opening Flask URL
                chrome.runtime.sendMessage({
                    action: 'getFullTranscript',
                    videoId: videoId
                }, function(response) {
                    if (!response || !response.success) {
                        alert('Error getting transcript: ' + (response?.error || 'Unknown error'));
                    }
                });
            } else {
                alert('Could not extract video ID.');
            }
        };

        // Position the button container
        const rect = (thumbnail || videoPlayer).getBoundingClientRect();
        
        // Always position in the top-left corner for both thumbnails and video player
        btnContainer.style.top = `${rect.top + window.scrollY + 10}px`;
        btnContainer.style.left = `${rect.left + window.scrollX + 10}px`;
    }
}, false);

document.body.addEventListener('mouseout', function (e) {
    const relatedTarget = e.relatedTarget;
    const btnContainer = document.getElementById('myCustomButtonContainer');
    
    // Check if we're moving out from a thumbnail or video player
    const isLeavingThumbnail = e.target.closest('a#thumbnail') && !relatedTarget?.closest('a#thumbnail');
    const isLeavingVideoPlayer = e.target.closest('.html5-video-container') && !relatedTarget?.closest('.html5-video-container');
    
    if (btnContainer && (isLeavingThumbnail || isLeavingVideoPlayer) && 
        relatedTarget !== btnContainer && !btnContainer.contains(relatedTarget)) {
        setTimeout(() => {
            const currentContainer = document.getElementById('myCustomButtonContainer');
            if (currentContainer && 
                !document.querySelector('a#thumbnail:hover') && 
                !document.querySelector('.html5-video-container:hover')) {
                currentContainer.remove();
            }
        }, 50); // Short delay to catch quick movements
    }
}, false);
