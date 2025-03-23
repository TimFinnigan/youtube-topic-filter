document.body.addEventListener('mouseover', function (e) {
    // Check for various thumbnail types (covers more YouTube page variations including Shorts)
    const thumbnail = e.target.closest('a#thumbnail') || 
                      e.target.closest('a.ytd-thumbnail') || 
                      e.target.closest('a.yt-simple-endpoint[href*="/watch?v="]') ||
                      e.target.closest('a.yt-simple-endpoint[href*="/shorts/"]') ||
                      e.target.closest('a[href*="/shorts/"]');
    
    // Check for video player hover (on video page)
    const videoPlayer = e.target.closest('.html5-video-container');
    
    // Proceed if either a thumbnail or video player is hovered
    if (thumbnail || videoPlayer) {
        console.log('Hovered over a thumbnail or video player');
        // Debug information for Shorts thumbnails
        if (thumbnail && thumbnail.href && thumbnail.href.includes('/shorts/')) {
            console.log('Shorts thumbnail detected:', thumbnail.href);
        }

        // Remove any old containers that might have gotten stuck
        const oldContainers = document.querySelectorAll('#myCustomButtonContainer[data-pending-removal="true"]');
        oldContainers.forEach(container => container.remove());

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

        // Clear any pending removal when actively hovering
        delete btnContainer.dataset.pendingRemoval;

        // Store the current element reference as a data attribute
        btnContainer.dataset.currentElementType = thumbnail ? 'thumbnail' : 'player';
        if (thumbnail) {
            // Extract video ID directly from href
            try {
                if (thumbnail.href && thumbnail.href.trim() !== '') {
                    btnContainer.dataset.thumbnailHref = thumbnail.href;
                    
                    // Create a backup of the thumbnailHref for immediate reference
                    btnContainer.setAttribute('data-backup-href', thumbnail.href);
                    
                    // Try to extract and store the video ID directly
                    const videoUrl = new URL(thumbnail.href);
                    const extractedVideoId = videoUrl.searchParams.get('v');
                    if (extractedVideoId) {
                        btnContainer.dataset.videoId = extractedVideoId;
                        console.log('Extracted video ID:', extractedVideoId);
                    }
                } else {
                    // Try alternative methods for getting the href
                    const parentThumbnail = thumbnail.closest('ytd-thumbnail');
                    if (parentThumbnail) {
                        const nestedLink = parentThumbnail.querySelector('a[href*="/watch?v="]');
                        if (nestedLink && nestedLink.href) {
                            btnContainer.dataset.thumbnailHref = nestedLink.href;
                            btnContainer.setAttribute('data-backup-href', nestedLink.href);
                            
                            // Extract video ID
                            try {
                                const videoUrl = new URL(nestedLink.href);
                                const extractedVideoId = videoUrl.searchParams.get('v');
                                if (extractedVideoId) {
                                    btnContainer.dataset.videoId = extractedVideoId;
                                    console.log('Extracted video ID from nested link:', extractedVideoId);
                                }
                            } catch (e) {
                                console.error('Error extracting video ID from nested link:', e);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Error processing thumbnail href:', e);
            }
        }

        // Get video ID either from thumbnail or current page URL
        const getVideoId = () => {
            // Always try to get fresh references
            const currentBtnContainer = document.getElementById('myCustomButtonContainer');
            
            // First check if we've already extracted and stored the video ID
            if (currentBtnContainer && currentBtnContainer.dataset.videoId) {
                const precomputedId = currentBtnContainer.dataset.videoId;
                console.log('Using precomputed video ID:', precomputedId);
                return precomputedId;
            }
            
            if (currentBtnContainer && currentBtnContainer.dataset.currentElementType === 'thumbnail') {
                try {
                    // Make sure we have a valid URL in thumbnailHref
                    if (currentBtnContainer.dataset.thumbnailHref) {
                        const href = currentBtnContainer.dataset.thumbnailHref;
                        
                        // Check if it's a shorts URL
                        if (href.includes('/shorts/')) {
                            // Extract the video ID from shorts URL
                            const shortsMatch = href.match(/\/shorts\/([^/?&#]+)/);
                            if (shortsMatch && shortsMatch[1]) {
                                const videoId = shortsMatch[1];
                                currentBtnContainer.dataset.videoId = videoId;
                                console.log('Extracted video ID from shorts URL:', videoId);
                                return videoId;
                            }
                        }
                        
                        // Regular video URL
                        const videoUrl = new URL(href);
                        const videoId = videoUrl.searchParams.get('v');
                        if (videoId) {
                            // Store it for future use
                            currentBtnContainer.dataset.videoId = videoId;
                            return videoId;
                        }
                    }
                    
                    // Try using the backup href attribute if the main one failed
                    if (currentBtnContainer.getAttribute('data-backup-href')) {
                        const backupHref = currentBtnContainer.getAttribute('data-backup-href');
                        
                        // Check if it's a shorts URL
                        if (backupHref.includes('/shorts/')) {
                            // Extract the video ID from shorts URL
                            const shortsMatch = backupHref.match(/\/shorts\/([^/?&#]+)/);
                            if (shortsMatch && shortsMatch[1]) {
                                const videoId = shortsMatch[1];
                                currentBtnContainer.dataset.videoId = videoId;
                                console.log('Extracted video ID from backup shorts URL:', videoId);
                                return videoId;
                            }
                        }
                        
                        try {
                            const videoUrl = new URL(backupHref);
                            const videoId = videoUrl.searchParams.get('v');
                            if (videoId) {
                                // Store it for future use
                                currentBtnContainer.dataset.videoId = videoId;
                                return videoId;
                            }
                        } catch (e) {
                            console.error('Error parsing backup thumbnail URL:', e);
                        }
                    }
                    
                    // If we couldn't get the video ID from the data attributes, try the DOM again
                    // Try different selectors to find the thumbnail
                    const possibleThumbnails = [
                        document.querySelector('a#thumbnail:hover'),
                        document.querySelector('a.ytd-thumbnail:hover'),
                        document.querySelector('a.yt-simple-endpoint[href*="/watch?v="]:hover'),
                        document.querySelector('a.yt-simple-endpoint[href*="/shorts/"]:hover'),
                        document.querySelector('ytd-thumbnail a[href*="/watch?v="]'),
                        document.querySelector('ytd-thumbnail a[href*="/shorts/"]'),
                        document.querySelector('a[href*="/watch?v="]'),
                        document.querySelector('a[href*="/shorts/"]')
                    ];
                    
                    for (const thumb of possibleThumbnails) {
                        if (thumb && thumb.href) {
                            // Check if it's a shorts URL
                            if (thumb.href.includes('/shorts/')) {
                                const shortsMatch = thumb.href.match(/\/shorts\/([^/?&#]+)/);
                                if (shortsMatch && shortsMatch[1]) {
                                    const videoId = shortsMatch[1];
                                    currentBtnContainer.dataset.videoId = videoId;
                                    console.log('Extracted video ID from direct shorts thumbnail:', videoId);
                                    return videoId;
                                }
                            }
                            
                            try {
                                const videoUrl = new URL(thumb.href);
                                const videoId = videoUrl.searchParams.get('v');
                                if (videoId) {
                                    // Store it for future use
                                    currentBtnContainer.dataset.videoId = videoId;
                                    return videoId;
                                }
                            } catch (e) {
                                console.error('Error parsing thumbnail URL from DOM:', e);
                            }
                        }
                    }
                    
                    // Try to extract video ID from the thumbnail's href attribute directly using regex
                    const hrefAttribute = currentBtnContainer.dataset.thumbnailHref || 
                                        currentBtnContainer.getAttribute('data-backup-href');
                    if (hrefAttribute) {
                        // First check for shorts URLs
                        const shortsMatch = hrefAttribute.match(/\/shorts\/([^/?&#]+)/);
                        if (shortsMatch && shortsMatch[1]) {
                            const videoId = shortsMatch[1];
                            currentBtnContainer.dataset.videoId = videoId;
                            console.log('Extracted video ID from href attribute shorts pattern:', videoId);
                            return videoId;
                        }
                        
                        // Then try regular video URLs
                        const videoIdMatch = hrefAttribute.match(/(?:\/watch\?v=|\/embed\/|\/v\/|\/youtu\.be\/)([^#&?]*)/);
                        if (videoIdMatch && videoIdMatch[1]) {
                            const videoId = videoIdMatch[1];
                            // Store it for future use
                            currentBtnContainer.dataset.videoId = videoId;
                            return videoId;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing thumbnail URL:', e);
                }
            }
            
            // Try using the backup element if we're on a video or shorts page
            const isVideoPage = window.location.pathname.includes('/watch');
            const isShortsPage = window.location.pathname.includes('/shorts/');
            
            if (isVideoPage || isShortsPage) {
                // Check for shorts URL first if we're on a shorts page
                if (isShortsPage) {
                    const shortsMatch = window.location.pathname.match(/\/shorts\/([^/?&#]+)/);
                    if (shortsMatch && shortsMatch[1]) {
                        const videoId = shortsMatch[1];
                        return videoId;
                    }
                }
                
                // If we get here, either we're on a video page, or thumbnail extraction failed
                // Try to get video ID from the current page URL (most reliable on a video page)
                try {
                    const currentUrl = new URL(window.location.href);
                    const videoId = currentUrl.searchParams.get('v');
                    if (videoId) {
                        return videoId;
                    }
                } catch (e) {
                    console.error('Error parsing current URL:', e);
                }
                
                // If all else fails and we're on a video watch page, try to extract from canonical link
                const canonicalLink = document.querySelector('link[rel="canonical"]');
                if (canonicalLink && canonicalLink.href) {
                    try {
                        const canonicalUrl = new URL(canonicalLink.href);
                        
                        // Check for shorts URL in canonical link
                        if (canonicalUrl.pathname.includes('/shorts/')) {
                            const shortsMatch = canonicalUrl.pathname.match(/\/shorts\/([^/?&#]+)/);
                            if (shortsMatch && shortsMatch[1]) {
                                return shortsMatch[1];
                            }
                        }
                        
                        // Check for regular video URL
                        if (canonicalUrl.pathname.includes('/watch')) {
                            const videoId = canonicalUrl.searchParams.get('v');
                            if (videoId) {
                                return videoId;
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing canonical URL:', e);
                    }
                }
                
                // One last attempt - try to get direct from search params on the page URL
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    const directVideoId = urlParams.get('v');
                    if (directVideoId) {
                        return directVideoId;
                    }
                } catch (e) {
                    console.error('Error getting direct video ID from URL:', e);
                }
            }
            
            // No video ID found
            console.error('Could not extract video ID from any source');
            return null;
        };

        // Set up find words button click handler
        findWordsBtn.onclick = function (e) {
            // Prevent the button container from being removed
            e.stopPropagation();
            if (btnContainer) {
                btnContainer.dataset.activeRequest = 'true';
                delete btnContainer.dataset.pendingRemoval;
            }
            
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
                        // Clear the active request flag
                        if (btnContainer) {
                            delete btnContainer.dataset.activeRequest;
                        }
                        
                        if (!response || !response.success) {
                            alert('Error finding words: ' + (response?.error || 'Unknown error'));
                        }
                    });
                } else {
                    // User cancelled the prompt, release the active request flag
                    if (btnContainer) {
                        delete btnContainer.dataset.activeRequest;
                    }
                }
            } else {
                // Try one more time with a different approach for video or shorts pages
                const isVideoPage = window.location.pathname.includes('/watch');
                const isShortsPage = window.location.pathname.includes('/shorts/');
                
                if (isVideoPage) {
                    try {
                        // Try extracting directly from the window location for videos
                        const urlParams = new URLSearchParams(window.location.search);
                        const fallbackVideoId = urlParams.get('v');
                        
                        if (fallbackVideoId) {
                            tryWithFallbackId(fallbackVideoId);
                            return;
                        }
                    } catch (e) {
                        console.error('Fallback video ID extraction failed:', e);
                    }
                } else if (isShortsPage) {
                    try {
                        // Try extracting directly from the pathname for shorts
                        const shortsMatch = window.location.pathname.match(/\/shorts\/([^/?&#]+)/);
                        if (shortsMatch && shortsMatch[1]) {
                            const fallbackVideoId = shortsMatch[1];
                            tryWithFallbackId(fallbackVideoId);
                            return;
                        }
                    } catch (e) {
                        console.error('Fallback shorts ID extraction failed:', e);
                    }
                }
                
                // Helper function to avoid code duplication
                function tryWithFallbackId(fallbackId) {
                    const searchText = prompt('Enter words or phrases to find:');
                    if (searchText && searchText.trim() !== '') {
                        chrome.runtime.sendMessage({
                            action: 'extractQuotes',
                            videoId: fallbackId,
                            filterText: searchText.trim()
                        }, function(response) {
                            // Clear the active request flag
                            if (btnContainer) {
                                delete btnContainer.dataset.activeRequest;
                            }
                            
                            if (!response || !response.success) {
                                alert('Error finding words: ' + (response?.error || 'Unknown error'));
                            }
                        });
                    } else {
                        // User cancelled the prompt, release the active request flag
                        if (btnContainer) {
                            delete btnContainer.dataset.activeRequest;
                        }
                    }
                }
                
                // Clear the active request flag before showing alert
                if (btnContainer) {
                    delete btnContainer.dataset.activeRequest;
                }
                alert('Could not extract video ID. Please try again or refresh the page.');
            }
        };

        // Set up transcript button click handler
        transcriptBtn.onclick = function (e) {
            // Prevent the button container from being removed
            e.stopPropagation();
            if (btnContainer) {
                btnContainer.dataset.activeRequest = 'true';
                delete btnContainer.dataset.pendingRemoval;
            }
            
            const videoId = getVideoId();
            if (videoId) {
                // Send message to background script instead of opening Flask URL
                chrome.runtime.sendMessage({
                    action: 'getFullTranscript',
                    videoId: videoId
                }, function(response) {
                    // Clear the active request flag
                    if (btnContainer) {
                        delete btnContainer.dataset.activeRequest;
                    }
                    
                    if (!response || !response.success) {
                        alert('Error getting transcript: ' + (response?.error || 'Unknown error'));
                    }
                });
            } else {
                // Try one more time with a different approach for video or shorts pages
                const isVideoPage = window.location.pathname.includes('/watch');
                const isShortsPage = window.location.pathname.includes('/shorts/');
                
                if (isVideoPage) {
                    try {
                        // Try extracting directly from the window location for videos
                        const urlParams = new URLSearchParams(window.location.search);
                        const fallbackVideoId = urlParams.get('v');
                        
                        if (fallbackVideoId) {
                            chrome.runtime.sendMessage({
                                action: 'getFullTranscript',
                                videoId: fallbackVideoId
                            }, function(response) {
                                // Clear the active request flag
                                if (btnContainer) {
                                    delete btnContainer.dataset.activeRequest;
                                }
                                
                                if (!response || !response.success) {
                                    alert('Error getting transcript: ' + (response?.error || 'Unknown error'));
                                }
                            });
                            return;
                        }
                    } catch (e) {
                        console.error('Fallback video ID extraction failed:', e);
                    }
                } else if (isShortsPage) {
                    try {
                        // Try extracting directly from the pathname for shorts
                        const shortsMatch = window.location.pathname.match(/\/shorts\/([^/?&#]+)/);
                        if (shortsMatch && shortsMatch[1]) {
                            const fallbackVideoId = shortsMatch[1];
                            chrome.runtime.sendMessage({
                                action: 'getFullTranscript',
                                videoId: fallbackVideoId
                            }, function(response) {
                                // Clear the active request flag
                                if (btnContainer) {
                                    delete btnContainer.dataset.activeRequest;
                                }
                                
                                if (!response || !response.success) {
                                    alert('Error getting transcript: ' + (response?.error || 'Unknown error'));
                                }
                            });
                            return;
                        }
                    } catch (e) {
                        console.error('Fallback shorts ID extraction failed:', e);
                    }
                }
                
                // Clear the active request flag before showing alert
                if (btnContainer) {
                    delete btnContainer.dataset.activeRequest;
                }
                alert('Could not extract video ID. Please try again or refresh the page.');
            }
        };

        // Add extra check for mouseout processing - prevent removal during active requests
        document.addEventListener('mouseout', function() {
            const btnContainer = document.getElementById('myCustomButtonContainer');
            if (btnContainer && btnContainer.dataset.activeRequest === 'true') {
                delete btnContainer.dataset.pendingRemoval;
            }
        }, false);

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
    const isLeavingThumbnail = (e.target.closest('a#thumbnail') || 
                               e.target.closest('a.ytd-thumbnail') || 
                               e.target.closest('a.yt-simple-endpoint[href*="/watch?v="]') ||
                               e.target.closest('a.yt-simple-endpoint[href*="/shorts/"]') || 
                               e.target.closest('a[href*="/shorts/"]')) && 
                              !(relatedTarget?.closest('a#thumbnail') || 
                                relatedTarget?.closest('a.ytd-thumbnail') || 
                                relatedTarget?.closest('a.yt-simple-endpoint[href*="/watch?v="]') ||
                                relatedTarget?.closest('a.yt-simple-endpoint[href*="/shorts/"]') ||
                                relatedTarget?.closest('a[href*="/shorts/"]'));
                               
    const isLeavingVideoPlayer = e.target.closest('.html5-video-container') && !relatedTarget?.closest('.html5-video-container');
    
    // Don't remove the container if we're interacting with it or its buttons
    const isInteractingWithButtons = 
        relatedTarget?.id === 'myFindWordsButton' || 
        relatedTarget?.id === 'myTranscriptButton' ||
        relatedTarget?.id === 'myCustomButtonContainer';
    
    if (btnContainer && (isLeavingThumbnail || isLeavingVideoPlayer) && 
        !isInteractingWithButtons && !btnContainer.contains(relatedTarget)) {
        
        // Set a flag on the container that it's in removal queue
        btnContainer.dataset.pendingRemoval = 'true';
        
        setTimeout(() => {
            const currentContainer = document.getElementById('myCustomButtonContainer');
            if (currentContainer && currentContainer.dataset.pendingRemoval === 'true' &&
                !document.querySelector('a#thumbnail:hover') && 
                !document.querySelector('a.ytd-thumbnail:hover') &&
                !document.querySelector('a.yt-simple-endpoint[href*="/watch?v="]:hover') &&
                !document.querySelector('a.yt-simple-endpoint[href*="/shorts/"]:hover') &&
                !document.querySelector('a[href*="/shorts/"]:hover') &&
                !document.querySelector('.html5-video-container:hover') &&
                !document.getElementById('myFindWordsButton')?.matches(':hover') &&
                !document.getElementById('myTranscriptButton')?.matches(':hover')) {
                
                currentContainer.remove();
            } else if (currentContainer) {
                // Clear the pending removal flag if we shouldn't remove it
                delete currentContainer.dataset.pendingRemoval;
            }
        }, 100); // Slightly longer delay to ensure stability
    }
}, false);

// Add global event listeners to make sure buttons work even after container moves
document.addEventListener('click', function(e) {
    // Handle clicks on our buttons even if the container has been re-created
    if (e.target.id === 'myFindWordsButton' || e.target.id === 'myTranscriptButton') {
        // Prevent the container from being removed during interaction
        const btnContainer = document.getElementById('myCustomButtonContainer');
        if (btnContainer) {
            delete btnContainer.dataset.pendingRemoval;
        }
    }
}, true);
