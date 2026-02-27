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

async function groqRequest(apiKey: string, messages: Array<Record<string, unknown>>, maxTokens = 256) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages,
      temperature: 0.1,
      max_tokens: maxTokens,
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
  return data.choices?.[0]?.message?.content ?? '';
}

export async function identifyMinifig(file: File, apiKey: string): Promise<GeminiMatch[]> {
  const dataUrl = await resizeImage(file);
  const catalog = getCatalog();

  // === PASS 1: Identify the character and faction ===
  const pass1Text = await groqRequest(apiKey, [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: dataUrl } },
        {
          type: 'text',
          text: `Identify this LEGO Star Wars minifigure. Reply with ONLY a JSON object:
{"character": "specific character name", "faction": "one of: Clone, Rebel, Empire, Jedi, Sith, Droid, Bounty Hunter, Resistance, First Order, Republic, Mandalorian, Civilian, Other", "era": "prequel/original/sequel", "details": "torso print, helmet type, colors, accessories"}`,
        },
      ],
    },
  ]);

  // Parse pass 1 response
  const cleaned1 = pass1Text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  let character = '';
  let faction = '';
  let details = '';
  try {
    const p = JSON.parse(cleaned1);
    character = p.character || '';
    faction = p.faction || '';
    details = p.details || '';
  } catch {
    // Use raw text as character description
    character = cleaned1;
  }

  // === Filter catalog by faction ===
  const factionMap: Record<string, string[]> = {
    'clone': ['Clone', 'Republic'],
    'republic': ['Clone', 'Republic'],
    'rebel': ['Rebel'],
    'empire': ['Empire', 'Imperial'],
    'imperial': ['Empire', 'Imperial'],
    'jedi': ['Jedi', 'Republic'],
    'sith': ['Sith'],
    'droid': ['Droid'],
    'bounty hunter': ['Bounty Hunter', 'Mandalorian'],
    'mandalorian': ['Mandalorian', 'Bounty Hunter'],
    'resistance': ['Resistance', 'Rebel'],
    'first order': ['First Order', 'Empire'],
    'civilian': ['Civilian', 'Other'],
  };

  const factionKey = faction.toLowerCase();
  const matchFactions = factionMap[factionKey] || [faction];

  // Get faction-filtered candidates + some extras from keyword matching
  let candidates = catalog.filter(m =>
    matchFactions.some(f => m.faction.toLowerCase().includes(f.toLowerCase()))
  );

  // If faction filter gave too few results, broaden the search
  if (candidates.length < 20) {
    // Add keyword matches from character name
    const charWords = character.toLowerCase().split(/[\s,\-()]+/).filter(w => w.length > 2);
    const extra = catalog.filter(m =>
      !candidates.includes(m) &&
      charWords.some(w => m.name.toLowerCase().includes(w))
    );
    candidates = [...candidates, ...extra];
  }

  // Cap at 300 to stay well within token limits
  if (candidates.length > 300) {
    candidates = candidates.slice(0, 300);
  }

  // If still no candidates, use full catalog subset by name matching
  if (candidates.length === 0) {
    const charLower = character.toLowerCase();
    candidates = catalog
      .filter(m => {
        const name = m.name.toLowerCase();
        return charLower.split(/\s+/).some(w => w.length > 2 && name.includes(w));
      })
      .slice(0, 200);
  }

  // Fallback: just use the whole catalog (shouldn't happen)
  if (candidates.length === 0) {
    candidates = catalog.slice(0, 200);
  }

  // === PASS 2: Exact match against filtered candidates ===
  const candidateList = candidates.map(m => `${m.id}|${m.name}`).join('\n');

  const pass2Text = await groqRequest(apiKey, [
    {
      role: 'user',
      content: `From the image I identified a LEGO Star Wars minifigure as: "${character}". Faction: ${faction}. Details: ${details}.

Pick the top 3 best matches from this list (format: id|name):

${candidateList}

Reply with ONLY valid JSON:
{"matches": [
  {"id": "exact-id-from-list", "name": "exact-name-from-list", "confidence": 0.95, "reasoning": "why this matches"},
  {"id": "exact-id-from-list", "name": "exact-name-from-list", "confidence": 0.70, "reasoning": "why this matches"},
  {"id": "exact-id-from-list", "name": "exact-name-from-list", "confidence": 0.40, "reasoning": "why this matches"}
]}`,
    },
  ], 512);

  // Parse pass 2 response
  const cleaned2 = pass2Text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let matches: Array<{ id: string; name: string; confidence: number; reasoning: string }> = [];
  try {
    const p = JSON.parse(cleaned2);
    matches = p.matches || [];
  } catch {
    // Try to find JSON in the response
    const jsonMatch = cleaned2.match(/\{[\s\S]*"matches"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const p = JSON.parse(jsonMatch[0]);
        matches = p.matches || [];
      } catch { /* give up */ }
    }
  }

  // Build candidate lookup for validation
  const candidateMap = new Map<string, CatalogMinifig>();
  for (const c of candidates) candidateMap.set(c.id, c);

  // Validate matches against candidates
  const validated: GeminiMatch[] = [];
  for (const m of matches) {
    const minifig = candidateMap.get(m.id);
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
