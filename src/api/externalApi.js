import axios from 'axios';

// Base API service for external applications
const externalApiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add the app_key from URL
externalApiClient.interceptors.request.use(
  (config) => {
    // Extract app_key from the URL path
    // The URL pattern is expected to be /external/{page}/{app_key}
    const pathParts = window.location.pathname.split('/');
    const appKeyIndex = pathParts.findIndex(part => part === 'external') + 2;
    
    if (appKeyIndex < pathParts.length) {
      const appKey = pathParts[appKeyIndex];
      if (appKey) {
        config.headers['X-App-Key'] = appKey;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Error handling
externalApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (window.GlobalMessage) {
      window.GlobalMessage.error(error.response?.data?.message || 'Request failed');
    } else {
      console.error('Request failed:', error);
    }
    
    return Promise.reject(error);
  }
);

// API methods for the volcano bot
export const volcanoBot = {
  // Stream generate content
  generateStream: async (prompt, onMessage, onReferences, onError, onComplete) => {
    try {
      const response = await externalApiClient.post('/v1/external/applications/volcano_bot/generate', 
        { prompt, stream: true },
        { responseType: 'stream' }
      );

      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processChunk = async ({ done, value }) => {
        if (done) {
          onComplete && onComplete();
          return;
        }

        // Decode the chunk and add it to our buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete events in the buffer
        let eventEnd = buffer.indexOf('\n\n');
        while (eventEnd > -1) {
          const eventText = buffer.substring(0, eventEnd);
          buffer = buffer.substring(eventEnd + 2);
          
          // Process the event
          if (eventText.trim()) {
            const eventLines = eventText.split('\n');
            const eventTypeMatch = eventLines[0].match(/^event: (.+)$/);
            const eventDataLine = eventLines.find(line => line.startsWith('data: '));
            
            if (eventTypeMatch && eventDataLine) {
              const eventType = eventTypeMatch[1];
              let eventData;
              
              try {
                eventData = JSON.parse(eventDataLine.substring(6));
              } catch (err) {
                console.error('Error parsing event data:', err);
                continue;
              }
              
              // Handle different event types
              if (eventType === 'message') {
                onMessage && onMessage(eventData);
              } else if (eventType === 'references') {
                onReferences && onReferences(eventData);
              }
            }
          }
          
          eventEnd = buffer.indexOf('\n\n');
        }
        
        // Continue reading
        return reader.read().then(processChunk);
      };
      
      // Start reading the stream
      reader.read().then(processChunk);
    } catch (error) {
      onError && onError(error);
    }
  }
};

export default externalApiClient;