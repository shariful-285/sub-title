console.log('Background service worker started.');

chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  if (message.type === 'AUDIO_CHUNK') {
    handleAudioChunk(message.payload, sender.tab?.id);
  }
  return true; // Keep channel open for async response
});

async function handleAudioChunk(payload: { data: string; videoUrl: string; timestamp: number }, tabId?: number) {
  try {
    console.log('Processing audio chunk for direct API transcription...');

    // 1. Get config from storage
    const storage = await chrome.storage.local.get(['extension_config']);
    const config = storage.extension_config as any;

    if (!config || !config.apiKey) {
      throw new Error('API Key missing. Please set it in Subtitle Settings.');
    }

    // 2. Convert Data URL to Blob/File
    const response = await fetch(payload.data);
    const audioBlob = await response.blob();
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

    // 3. Prepare API request
    let apiUrl = '';
    let model = '';
    const headers: Record<string, string> = {};

    if (config.provider === 'groq') {
      apiUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
      model = 'whisper-large-v3';
    } else if (config.provider === 'openrouter') {
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      model = 'google/gemma-3n-4b:free';
      headers['HTTP-Referer'] = 'https://github.com/subtitle-gen-ext';
      headers['X-Title'] = 'YouTube Subtitle Generator';
      headers['Content-Type'] = 'application/json';
    } else if (config.provider === 'gemini') {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.apiKey}`;
      headers['Content-Type'] = 'application/json';
    } else {
      apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
      model = 'whisper-1';
    }

    let responseData: any;

    if (config.provider === 'gemini') {
      // Google Gemini API for audio
      const base64Audio = payload.data.split(',')[1];
      const apiRes = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Transcribe this audio exactly. Output only the transcription text." },
              {
                inline_data: {
                  mime_type: "audio/webm",
                  data: base64Audio
                }
              }
            ]
          }]
        })
      });

      if (!apiRes.ok) {
        if (apiRes.status === 429) {
          throw new Error('Rate limit reached (Gemini Free Tier). Please wait a moment for the next subtitle.');
        }
        const errorText = await apiRes.text();
        throw new Error(`Gemini Error ${apiRes.status}: ${errorText}`);
      }

      const geminiData = await apiRes.json();
      responseData = {
        text: geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '',
        segments: [] // Gemini generateContent doesn't return Whisper-style segments easily
      };
    } else if (config.provider === 'openrouter') {
      // OpenRouter uses Chat API for audio
      const base64Audio = payload.data.split(',')[1];
      const apiRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Transcribe this audio exactly.'
                },
                {
                  type: 'input_audio',
                  input_audio: {
                    data: base64Audio,
                    format: 'webm'
                  }
                }
              ]
            }
          ]
        })
      });

      if (!apiRes.ok) {
        const errorText = await apiRes.text();
        throw new Error(`OpenRouter Error ${apiRes.status}: ${errorText}`);
      }

      const chatData = await apiRes.json();
      responseData = {
        text: chatData.choices?.[0]?.message?.content || '',
        segments: [] // OpenRouter Chat API doesn't return segments
      };
    } else {
      // Standard Whisper API (Groq/OpenAI) using FormData
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', model);
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities[]', 'segment');

      headers['Authorization'] = `Bearer ${config.apiKey}`;

      const apiRes = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!apiRes.ok) {
        if (apiRes.status === 429) {
          throw new Error('Rate limit reached (Free Tier). Please wait a moment for the next subtitle.');
        }
        const errorText = await apiRes.text().catch(() => 'No error body');
        let errorMessage = `API Error ${apiRes.status}: ${apiRes.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
        } catch (e) {
          if (errorText.length > 0) errorMessage += ` - ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }
      responseData = await apiRes.json();
    }

    console.log('Transcription received:', responseData);

    // Send result back to content script to display
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'TRANSCRIPT_RESULT',
        payload: {
          text: responseData.text,
          start: payload.timestamp,
          segments: responseData.segments || []
        }
      });
    }

  } catch (error: any) {
    console.error('Error handling audio chunk:', error);
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'TRANSCRIPT_ERROR',
        payload: { error: error.message || 'Failed to transcribe audio' }
      });
    }
  }
}




