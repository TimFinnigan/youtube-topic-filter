document.body.addEventListener('mouseover', function (e) {
    const thumbnail = e.target.closest('a#thumbnail');
    if (thumbnail) {
        console.log('Hovered over a thumbnail');

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

        // Create full transcript button if it doesn't exist
        let transcriptBtn = document.getElementById('myTranscriptButton');
        if (!transcriptBtn) {
            transcriptBtn = document.createElement('button');
            transcriptBtn.id = 'myTranscriptButton';
            transcriptBtn.innerText = 'View Full Transcript';
            transcriptBtn.className = 'custom-yt-btn';
            btnContainer.appendChild(transcriptBtn);
        }

        // Create text transcript button if it doesn't exist
        let textTranscriptBtn = document.getElementById('myTextTranscriptButton');
        if (!textTranscriptBtn) {
            textTranscriptBtn = document.createElement('button');
            textTranscriptBtn.id = 'myTextTranscriptButton';
            textTranscriptBtn.innerText = 'View Text Transcript';
            textTranscriptBtn.className = 'custom-yt-btn';
            btnContainer.appendChild(textTranscriptBtn);
        }

        // Set up quotes button click handler
        quotesBtn.onclick = function () {
            const videoUrl = new URL(thumbnail.href);
            const videoId = videoUrl.searchParams.get('v');
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
            const videoUrl = new URL(thumbnail.href);
            const videoId = videoUrl.searchParams.get('v');
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

        // Set up text transcript button click handler
        textTranscriptBtn.onclick = function () {
            const videoUrl = new URL(thumbnail.href);
            const videoId = videoUrl.searchParams.get('v');
            if (videoId) {
                // Send message to background script instead of opening Flask URL
                chrome.runtime.sendMessage({
                    action: 'getFullTranscript',
                    videoId: videoId,
                    textOnly: true
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
        const rect = thumbnail.getBoundingClientRect();
        btnContainer.style.top = `${rect.top + window.scrollY + 10}px`;
        btnContainer.style.left = `${rect.left + window.scrollX + 10}px`;
    }
}, false);

document.body.addEventListener('mouseout', function (e) {
    const relatedTarget = e.relatedTarget;
    const btnContainer = document.getElementById('myCustomButtonContainer');
    if (btnContainer && !e.target.closest('a#thumbnail') && relatedTarget !== btnContainer && !btnContainer.contains(relatedTarget)) {
        setTimeout(() => {
            const currentContainer = document.getElementById('myCustomButtonContainer');
            if (currentContainer && !document.querySelector('a#thumbnail:hover')) {
                currentContainer.remove();
            }
        }, 50); // Short delay to catch quick movements
    }
}, false);
