import { getCatalog } from './catalogService';
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
let catalogMapCache: Map<string, CatalogMinifig> | null = null;

function getCatalogPrompt(): string {
  if (catalogPromptCache) return catalogPromptCache;
  catalogPromptCache = getCatalog().map(m => `${m.id}|${m.name}`).join('\n');
  return catalogPromptCache;
}

function getCatalogMap(): Map<string, CatalogMinifig> {
  if (catalogMapCache) return catalogMapCache;
  catalogMapCache = new Map();
  for (const m of getCatalog()) catalogMapCache.set(m.id, m);
  return catalogMapCache;
}

function resizeImage(file: File, maxDim = 512): Promise<string> {
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
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
  const catalogList = getCatalogPrompt();
  const catalogMap = getCatalogMap();

  const prompt = `You are a LEGO Star Wars minifigure expert. Look at this photo and identify which minifigure it is.

Study carefully:
- Color scheme (skin color, outfit colors)
- Torso print/design
- Head/helmet type
- Leg printing
- Any accessories

Here is the complete catalog of LEGO Star Wars minifigures (id|name):

${catalogList}

Pick the 3 best matches from the catalog above. Reply with ONLY this JSON:
{"matches":[
{"id":"exact-id","name":"exact-name","confidence":0.95,"reasoning":"why"},
{"id":"exact-id","name":"exact-name","confidence":0.7,"reasoning":"why"},
{"id":"exact-id","name":"exact-name","confidence":0.4,"reasoning":"why"}
]}`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const body = await response.json().catch(() => null);
    const detail = body?.error?.message || '';
    if (status === 401) throw new Error('Invalid API key. Check your settings.');
    if (status === 429) throw new Error(`Rate limited: ${detail || 'Wait a moment and try again.'}`);
    throw new Error(detail || `API error (${status})`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let matches: Array<{ id: string; name: string; confidence: number; reasoning: string }> = [];
  try {
    const p = JSON.parse(cleaned);
    matches = p.matches || [];
  } catch {
    // Try to extract JSON from response
    const jsonMatch = cleaned.match(/\{[\s\S]*"matches"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        matches = JSON.parse(jsonMatch[0]).matches || [];
      } catch { /* give up */ }
    }
  }

  // Validate matches against catalog
  const validated: GeminiMatch[] = [];
  for (const m of matches) {
    const minifig = catalogMap.get(m.id);
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
