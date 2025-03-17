// YouTube Transcript API implementation in JavaScript
async function fetchTranscript(videoId) {
  try {
    // First, we need to get the transcript list
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    
    // Extract the ytInitialPlayerResponse from the HTML
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (!playerResponseMatch) {
      throw new Error('Could not find player response in the page');
    }
    
    const playerResponse = JSON.parse(playerResponseMatch[1]);
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No captions available for this video');
    }
    
    // Get the first available transcript URL (usually English)
    const transcriptUrl = captionTracks[0].baseUrl;
    
    // Fetch the transcript XML
    const transcriptResponse = await fetch(transcriptUrl);
    const transcriptXml = await transcriptResponse.text();
    
    // Parse the XML without using DOMParser (which is not available in service workers)
    const transcript = parseTranscriptXml(transcriptXml);
    
    return transcript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

// Simple XML parser for transcript data that doesn't rely on DOM APIs
function parseTranscriptXml(xmlString) {
  const transcript = [];
  
  // Use regex to extract text elements with their attributes
  const textElementRegex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/gi;
  
  let match;
  while ((match = textElementRegex.exec(xmlString)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    // Decode HTML entities in the text content
    const text = decodeHtmlEntities(match[3]);
    
    transcript.push({
      text: text,
      start: start,
      duration: duration
    });
  }
  
  return transcript;
}

// Function to decode HTML entities in transcript text
function decodeHtmlEntities(html) {
  // Create a map of HTML entities
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  
  // Replace HTML entities with their corresponding characters
  return html.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;|&#x60;|&#x3D;/g, 
    match => entities[match]
  );
}

// Function to extract quotes that match filter text
function extractQuotes(transcriptList, filterText) {
  const quotes = [];
  const filterTextLower = filterText.toLowerCase();
  
  // Group transcript segments into context windows
  const contextWindowSize = 5;  // Number of segments before and after the matching segment
  
  try {
    // Handle multi-word phrases and single words differently
    const words = filterTextLower.split(' ');
    
    if (words.length > 1) {
      // For phrases, use a simpler approach
      for (let i = 0; i < transcriptList.length; i++) {
        const segment = transcriptList[i];
        const text = segment.text.toLowerCase();
        
        if (text.includes(filterTextLower)) {
          // Get timestamp in seconds
          const timestamp = segment.start;
          
          // Format timestamp as MM:SS
          const minutes = Math.floor(timestamp / 60);
          const seconds = Math.floor(timestamp % 60);
          const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          // Get context (segments before and after)
          const startIdx = Math.max(0, i - contextWindowSize);
          const endIdx = Math.min(transcriptList.length, i + contextWindowSize + 1);
          
          const contextSegments = transcriptList.slice(startIdx, endIdx);
          const contextText = contextSegments.map(seg => seg.text).join(' ');
          
          quotes.push({
            timestamp: formattedTime,
            timestamp_seconds: timestamp,
            text: segment.text,
            context: contextText
          });
        }
      }
    } else {
      // For single words, use word boundary regex
      const pattern = new RegExp('\\b' + filterTextLower + '\\b', 'i');
      
      for (let i = 0; i < transcriptList.length; i++) {
        const segment = transcriptList[i];
        const text = segment.text.toLowerCase();
        
        if (pattern.test(text)) {
          // Get timestamp in seconds
          const timestamp = segment.start;
          
          // Format timestamp as MM:SS
          const minutes = Math.floor(timestamp / 60);
          const seconds = Math.floor(timestamp % 60);
          const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          // Get context (segments before and after)
          const startIdx = Math.max(0, i - contextWindowSize);
          const endIdx = Math.min(transcriptList.length, i + contextWindowSize + 1);
          
          const contextSegments = transcriptList.slice(startIdx, endIdx);
          const contextText = contextSegments.map(seg => seg.text).join(' ');
          
          quotes.push({
            timestamp: formattedTime,
            timestamp_seconds: timestamp,
            text: segment.text,
            context: contextText
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in extractQuotes:', error);
    // Fall back to simple substring matching if regex fails
    for (let i = 0; i < transcriptList.length; i++) {
      const segment = transcriptList[i];
      const text = segment.text.toLowerCase();
      
      if (text.includes(filterTextLower)) {
        // Get timestamp in seconds
        const timestamp = segment.start;
        
        // Format timestamp as MM:SS
        const minutes = Math.floor(timestamp / 60);
        const seconds = Math.floor(timestamp % 60);
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Get context (segments before and after)
        const startIdx = Math.max(0, i - contextWindowSize);
        const endIdx = Math.min(transcriptList.length, i + contextWindowSize + 1);
        
        const contextSegments = transcriptList.slice(startIdx, endIdx);
        const contextText = contextSegments.map(seg => seg.text).join(' ');
        
        quotes.push({
          timestamp: formattedTime,
          timestamp_seconds: timestamp,
          text: segment.text,
          context: contextText
        });
      }
    }
  }
  
  return quotes;
}

// Function to get video info from YouTube Data API
async function getVideoInfo(videoId) {
  try {
    // For a standalone extension, we'll use the oEmbed API which doesn't require an API key
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    const data = await response.json();
    
    return {
      title: data.title,
      channel: data.author_name
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    return null;
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractQuotes') {
    (async () => {
      try {
        const transcript = await fetchTranscript(request.videoId);
        const quotes = extractQuotes(transcript, request.filterText);
        const videoInfo = await getVideoInfo(request.videoId);
        
        const result = {
          video_title: videoInfo?.title || 'Unknown Title',
          channel_name: videoInfo?.channel || 'Unknown Channel',
          quotes: quotes,
          filter_text: request.filterText,
          total_matches: quotes.length,
          video_id: request.videoId
        };
        
        // Store the result in extension storage
        chrome.storage.local.set({ 'lastQuotesResult': result }, () => {
          // Open the quotes.html page
          chrome.tabs.create({ url: chrome.runtime.getURL('quotes.html') });
          sendResponse({ success: true });
        });
      } catch (error) {
        console.error('Error processing request:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Indicates async response
  }
  
  if (request.action === 'getFullTranscript') {
    (async () => {
      try {
        const transcript = await fetchTranscript(request.videoId);
        const videoInfo = await getVideoInfo(request.videoId);
        
        const result = {
          video_title: videoInfo?.title || 'Unknown Title',
          channel_name: videoInfo?.channel || 'Unknown Channel',
          transcript: transcript,
          video_id: request.videoId,
          textOnly: request.textOnly || false
        };
        
        // Store the result in extension storage
        chrome.storage.local.set({ 'lastTranscriptResult': result }, () => {
          // Open the transcript.html page
          chrome.tabs.create({ url: chrome.runtime.getURL('transcript.html') });
          sendResponse({ success: true });
        });
      } catch (error) {
        console.error('Error processing request:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Indicates async response
  }
}); 