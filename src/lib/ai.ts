import { GoogleGenAI } from '@google/genai';
import { useStore } from '../store/useStore';
import PQueue from 'p-queue';

export const queue = new PQueue({ concurrency: 2 });

async function compressImage(file: File, maxWidth = 1024, maxHeight = 1024): Promise<{ base64: string, mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Always compress to JPEG for AI processing to save bandwidth and memory
      const mimeType = 'image/jpeg';
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to compress image'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve({
            base64: dataUrl.split(',')[1],
            mimeType
          });
        };
        reader.readAsDataURL(blob);
      }, mimeType, 0.8);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = url;
  });
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 3000
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt > maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.warn(`API call failed (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function processImage(assetId: string) {
  const store = useStore.getState();
  const asset = store.assets.find(a => a.id === assetId);
  if (!asset) return;
  if (asset.status === 'paused') return;

  const { settings } = store;
  
  store.updateAsset(assetId, { status: 'processing', progress: 10 });
  store.addLog(`Started processing ${asset.file.name}`, 'SYS-KRNL', 'info');

  try {
    // Compress and convert file to base64
    const { base64: base64Data, mimeType } = await compressImage(asset.file);

    store.updateAsset(assetId, { progress: 30 });

    let result;

    // Determine which API to use based on available keys
    if (settings.groqKeys && settings.groqKeys.length > 0) {
      result = await withRetry(() => processWithGroq(base64Data, mimeType, settings));
    } else if (settings.openaiKey) {
      result = await withRetry(() => processWithOpenAI(base64Data, mimeType, settings));
    } else if (settings.geminiKey || process.env.GEMINI_API_KEY) {
      result = await withRetry(() => processWithGemini(base64Data, mimeType, settings));
    } else {
      throw new Error('No API keys configured');
    }

    store.updateAsset(assetId, {
      status: 'completed',
      progress: 100,
      title: result.title,
      description: result.description,
      keywords: result.keywords,
      category: result.category || 'Uncategorized',
      confidence: Math.floor(Math.random() * 10) + 90, // Mock confidence
    });
    
    store.addLog(`Successfully processed ${asset.file.name}`, 'AI-ENGINE', 'success');

  } catch (error: any) {
    console.error('Error processing image:', error);
    store.updateAsset(assetId, { status: 'error', progress: 0, error: error.message });
    store.addLog(`Error processing ${asset.file.name}: ${error.message}`, 'SYS-ERR', 'error');
  }
}

function getPrompt(settings: any) {
  const keywordInstruction = `Generate exactly ${settings.keywordCount} keywords`;

  return `Analyze this image for a stock photography marketplace.
Generate metadata based on these settings:
- Title length: exactly around ${settings.titleLengthChars} characters
- Keywords count: ${keywordInstruction}
- Keyword style: ${settings.keywordStyle}
- Title tone: ${settings.titleTone}

Respond ONLY with a valid JSON object in this exact format:
{
  "title": "A descriptive title",
  "description": "A detailed description of the image content",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "category": "A single best-fit category name (e.g., Nature, Technology, Business, People, Architecture)"
}`;
}

async function processWithGemini(base64Data: string, mimeType: string, settings: any) {
  const apiKey = settings.geminiKey || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: getPrompt(settings) }
      ]
    },
    config: {
      responseMimeType: 'application/json',
    }
  });

  if (!response.text) throw new Error('Empty response from Gemini');
  return JSON.parse(response.text);
}

async function processWithOpenAI(base64Data: string, mimeType: string, settings: any) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: getPrompt(settings) },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
          ]
        }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

let groqKeyIndex = 0;

async function processWithGroq(base64Data: string, mimeType: string, settings: any) {
  const keys = settings.groqKeys;
  if (!keys || keys.length === 0) throw new Error('No Groq keys configured');
  
  // Select key using round-robin
  const currentKey = keys[groqKeyIndex % keys.length];
  groqKeyIndex++;

  // Groq vision model endpoint
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.2-90b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: getPrompt(settings) },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
          ]
        }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
