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
      // Using fetch instead of axios for better stream handling
      const response = await fetch('/api/v1/external/applications/volcano_bot/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add the app key from URL
          'X-App-Key': window.location.pathname.split('/').filter(part => part)[2]
        },
        body: JSON.stringify({ prompt, stream: true })
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Function to process the stream chunks
      const processChunk = async ({ done, value }) => {
        if (done) {
          onComplete && onComplete();
          return;
        }

        // Decode the chunk and add it to our buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process each line that starts with "data: "
        const lines = buffer.split('\n');
        let newBuffer = "";
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              // Check event type and call appropriate handler
              if (data.event === 'content' || data.event === 'message') {
                onMessage && onMessage({ text: data.data });
              } else if (data.event === 'references') {
                onReferences && onReferences(data.data);
              } else if (data.event === 'done') {
                // Stream is done
                onComplete && onComplete();
              }
            } catch (e) {
              console.error('Error parsing JSON:', e, line.substring(6));
            }
          } else {
            // Keep incomplete lines in the buffer
            newBuffer += line + '\n';
          }
        }
        
        // Update buffer with any incomplete data
        buffer = newBuffer;
        
        // Continue reading
        return reader.read().then(processChunk);
      };
      
      // Start reading the stream
      reader.read().then(processChunk);
    } catch (error) {
      console.error('Stream error:', error);
      onError && onError(error);
    }
  }
};

export default externalApiClient;