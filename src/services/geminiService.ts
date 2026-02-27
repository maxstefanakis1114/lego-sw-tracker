import { getCatalog, getMinifig } from './catalogService';
import type { CatalogMinifig } from '../types';

export interface GeminiMatch {
  id: string;
  name: string;
  confidence: number;
  reasoning: string;
  minifig?: CatalogMinifig;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

let catalogPromptCache: string | null = null;

function buildCatalogPrompt(): string {
  if (catalogPromptCache) return catalogPromptCache;
  const lines = getCatalog().map(m => `${m.id}|${m.name}`).join('\n');
  catalogPromptCache = lines;
  return lines;
}

function resizeImage(file: File, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      URL.revokeObjectURL(img.src);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function identifyMinifig(file: File, apiKey: string): Promise<GeminiMatch[]> {
  const dataUrl = await resizeImage(file);
  const catalogList = buildCatalogPrompt();

  const prompt = `You are a LEGO Star Wars minifigure identification expert. Analyze this photo and identify the LEGO Star Wars minifigure shown.

Look at:
- The torso print/design
- Head print (face, helmet type)
- Leg color and printing
- Any accessories (lightsabers, blasters, capes)
- Overall color scheme

Match against this catalog of known LEGO Star Wars minifigures (format: id|name):

${catalogList}

Respond with ONLY valid JSON in this exact format, no other text:
{
  "matches": [
    {"id": "fig-XXXXXX", "name": "Exact Name From Catalog", "confidence": 0.95, "reasoning": "Brief reason"},
    {"id": "fig-YYYYYY", "name": "Exact Name From Catalog", "confidence": 0.70, "reasoning": "Brief reason"},
    {"id": "fig-ZZZZZZ", "name": "Exact Name From Catalog", "confidence": 0.40, "reasoning": "Brief reason"}
  ]
}

Return your top 3 best matches, most confident first. If you cannot identify any LEGO Star Wars minifigure in the image, return: {"matches": []}`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.2-90b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 401) throw new Error('Invalid API key. Check your settings.');
    if (status === 429) throw new Error('Too many requests. Wait a moment and try again.');
    const body = await response.json().catch(() => null);
    const msg = body?.error?.message || `API error (${status})`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed: { matches: Array<{ id: string; name: string; confidence: number; reasoning: string }> };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Could not parse response. Try again.');
  }

  if (!parsed.matches || !Array.isArray(parsed.matches)) {
    return [];
  }

  // Validate IDs against catalog and attach minifig data
  const validated: GeminiMatch[] = [];
  for (const m of parsed.matches) {
    const minifig = getMinifig(m.id);
    if (minifig) {
      validated.push({
        id: m.id,
        name: minifig.name,
        confidence: m.confidence,
        reasoning: m.reasoning,
        minifig,
      });
    }
    if (validated.length >= 3) break;
  }
  return validated;
}
