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

// Score how well a search term matches a catalog entry name
function scoreMatch(searchTerms: string[], name: string): number {
  const nameLower = name.toLowerCase();
  const nameWords = nameLower.split(/[\s,\-/()]+/).filter(w => w.length > 1);
  let score = 0;

  for (const term of searchTerms) {
    const termLower = term.toLowerCase();

    // Full term appears in name
    if (nameLower.includes(termLower)) {
      score += 50 + termLower.length * 2;
      continue;
    }

    // Individual words from the term match words in the name
    const termWords = termLower.split(/[\s,\-/()]+/).filter(w => w.length > 1);
    for (const tw of termWords) {
      if (nameWords.some(nw => nw === tw)) {
        score += 10;
      } else if (nameWords.some(nw => nw.includes(tw) || tw.includes(nw))) {
        score += 5;
      }
    }
  }

  return score;
}

export async function identifyMinifig(file: File, apiKey: string): Promise<GeminiMatch[]> {
  const dataUrl = await resizeImage(file);

  // Tiny prompt — just ask for the character name and key details
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
            {
              type: 'text',
              text: `This is a LEGO Star Wars minifigure. Reply with ONLY a JSON object — no other text:
{"character": "character name (e.g. C-3PO, Darth Vader, Clone Trooper)", "variant": "any distinguishing details like color, armor markings, episode", "faction": "e.g. Droid, Empire, Clone, Jedi, Rebel"}`,
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
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
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  // Parse AI response
  let character = '';
  let variant = '';
  let faction = '';
  try {
    const p = JSON.parse(cleaned);
    character = p.character || '';
    variant = p.variant || '';
    faction = p.faction || '';
  } catch {
    // Use raw text as the character name
    character = cleaned.replace(/[{}""]/g, '').trim();
  }

  // Build search terms from the AI response
  const searchTerms = [character, variant, faction].filter(Boolean);

  // Score all catalog entries
  const catalog = getCatalog();
  const scored = catalog
    .map(minifig => ({
      minifig,
      score: scoreMatch(searchTerms, minifig.name) +
        // Bonus for faction match
        (faction && minifig.faction.toLowerCase().includes(faction.toLowerCase()) ? 15 : 0),
    }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Return top matches — show more results so user can pick the right variant
  const topScore = scored[0]?.score ?? 0;
  const results = scored
    .slice(0, 6)
    .filter(s => s.score >= topScore * 0.3) // Only show reasonably close matches
    .map(s => ({
      id: s.minifig.id,
      name: s.minifig.name,
      confidence: Math.min(s.score / Math.max(topScore, 1), 0.99),
      reasoning: `${character}${variant ? ' — ' + variant : ''}`,
      minifig: s.minifig,
    }));

  return results;
}
