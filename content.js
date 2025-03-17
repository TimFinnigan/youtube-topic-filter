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

        // Create find words button if it doesn't exist
        let findWordsBtn = document.getElementById('myFindWordsButton');
        if (!findWordsBtn) {
            findWordsBtn = document.createElement('button');
            findWordsBtn.id = 'myFindWordsButton';
            findWordsBtn.innerText = 'Find Words';
            findWordsBtn.className = 'custom-yt-btn';
            btnContainer.appendChild(findWordsBtn);
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

        // Store the current element reference as a data attribute
        btnContainer.dataset.currentElementType = thumbnail ? 'thumbnail' : 'player';
        if (thumbnail) {
            btnContainer.dataset.thumbnailHref = thumbnail.href;
        }

        // Get video ID either from thumbnail or current page URL
        const getVideoId = () => {
            // Get fresh references instead of using closure variables
            if (btnContainer.dataset.currentElementType === 'thumbnail') {
                try {
                    const videoUrl = new URL(btnContainer.dataset.thumbnailHref);
                    return videoUrl.searchParams.get('v');
                } catch (e) {
                    console.error('Error parsing thumbnail URL:', e);
                    return null;
                }
            } else {
                // We're on a video page, get video ID from URL
                try {
                    const currentUrl = new URL(window.location.href);
                    return currentUrl.searchParams.get('v');
                } catch (e) {
                    console.error('Error parsing current URL:', e);
                    return null;
                }
            }
        };

        // Set up find words button click handler
        findWordsBtn.onclick = function () {
            const videoId = getVideoId();
            if (videoId) {
                const searchText = prompt('Enter words or phrases to find:');
                if (searchText && searchText.trim() !== '') {
                    // Send message to background script instead of opening Flask URL
                    chrome.runtime.sendMessage({
                        action: 'extractQuotes',
                        videoId: videoId,
                        filterText: searchText.trim()
                    }, function(response) {
                        if (!response || !response.success) {
                            alert('Error finding words: ' + (response?.error || 'Unknown error'));
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
