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

function resizeImage(file: File, maxDim = 768): Promise<string> {
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

// Fuzzy match score — how well does a query match a catalog name
function matchScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact match
  if (q === t) return 100;

  // Target contains query
  if (t.includes(q)) return 80;

  // Query contains target
  if (q.includes(t)) return 70;

  // Word overlap scoring
  const qWords = q.split(/[\s,\-()]+/).filter(w => w.length > 1);
  const tWords = t.split(/[\s,\-()]+/).filter(w => w.length > 1);

  let matched = 0;
  for (const qw of qWords) {
    for (const tw of tWords) {
      if (tw.includes(qw) || qw.includes(tw)) {
        matched++;
        break;
      }
    }
  }

  if (qWords.length === 0) return 0;
  return (matched / Math.max(qWords.length, 1)) * 60;
}

function findMatches(description: string): GeminiMatch[] {
  const catalog = getCatalog();

  // Extract key terms from the AI description
  const lines = description.split('\n').filter(l => l.trim());

  // Try to find character name, faction, and other identifiers
  const searchTerms: string[] = [];
  for (const line of lines) {
    // Look for name-like patterns
    const cleaned = line.replace(/^[\-\*\d.]+\s*/, '').replace(/["']/g, '');
    if (cleaned.length > 2 && cleaned.length < 100) {
      searchTerms.push(cleaned);
    }
  }

  // Also use the full description as one big search
  searchTerms.push(description);

  // Score every catalog entry
  const scored = catalog.map(minifig => {
    let bestScore = 0;
    let bestReason = '';

    for (const term of searchTerms) {
      const score = matchScore(term, minifig.name);
      if (score > bestScore) {
        bestScore = score;
        bestReason = term;
      }

      // Also check against faction
      const factionScore = matchScore(term, minifig.faction) * 0.3;
      if (factionScore > bestScore) {
        bestScore = factionScore;
        bestReason = `Faction: ${term}`;
      }
    }

    return { minifig, score: bestScore, reason: bestReason };
  });

  // Sort by score, take top 3
  scored.sort((a, b) => b.score - a.score);

  return scored
    .slice(0, 3)
    .filter(s => s.score > 10)
    .map(s => ({
      id: s.minifig.id,
      name: s.minifig.name,
      confidence: Math.min(s.score / 100, 0.99),
      reasoning: s.reason.slice(0, 100),
      minifig: s.minifig,
    }));
}

export async function identifyMinifig(file: File, apiKey: string): Promise<GeminiMatch[]> {
  const dataUrl = await resizeImage(file);

  const prompt = `Identify this LEGO Star Wars minifigure. Be specific about:
1. The exact character name (e.g. "Clone Trooper Phase 2", "Darth Vader", "Luke Skywalker Hoth")
2. Any specific variant details (markings, colors, episode)
3. The faction (Clone, Rebel, Empire, Jedi, Sith, Droid, Bounty Hunter, etc.)

Reply with ONLY a JSON object:
{"name": "Character Name with Variant", "faction": "Faction", "details": "Brief description of torso print, helmet, accessories"}`;

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
      temperature: 0.2,
      max_tokens: 256,
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

  // Try to parse JSON from response
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let searchText = cleaned;
  try {
    const parsed = JSON.parse(cleaned);
    // Build search string from structured response
    searchText = [parsed.name, parsed.faction, parsed.details].filter(Boolean).join(' ');
  } catch {
    // If not valid JSON, use the raw text for matching
  }

  // Match against catalog locally
  return findMatches(searchText);
}
