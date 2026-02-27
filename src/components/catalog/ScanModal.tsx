import { useState, useRef, useMemo } from 'react';
import type { CatalogMinifig } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { identifyMinifig, type GeminiMatch } from '../../services/geminiService';
import { getCatalog } from '../../services/catalogService';
import { getMarketPrice } from '../../services/priceService';
import { Camera, Loader, AlertCircle, Settings, RotateCcw, Plus, Search } from 'lucide-react';

interface ScanModalProps {
  open: boolean;
  onClose: () => void;
  onMatch: (minifig: CatalogMinifig) => void;
  onOpenSettings: () => void;
}

type ScanState = 'idle' | 'loading' | 'results' | 'error';

export function ScanModal({ open, onClose, onMatch, onOpenSettings }: ScanModalProps) {
  const [apiKey] = useLocalStorage('groq-api-key', import.meta.env.VITE_GROQ_API_KEY ?? '');
  const [state, setState] = useState<ScanState>('idle');
  const [matches, setMatches] = useState<GeminiMatch[]>([]);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setState('idle');
    setMatches([]);
    setError('');
    setPreview(null);
    setSearchQuery('');
    setShowSearch(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setState('loading');
    setError('');
    setShowSearch(false);
    setSearchQuery('');

    try {
      const results = await identifyMinifig(file, apiKey);
      setMatches(results);
      setState('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setState('error');
    }
  };

  const handleSelectMatch = (match: GeminiMatch) => {
    if (match.minifig) {
      handleClose();
      onMatch(match.minifig);
    }
  };

  const handleSelectCatalog = (minifig: CatalogMinifig) => {
    handleClose();
    onMatch(minifig);
  };

  const openSearch = (prefill?: string) => {
    setShowSearch(true);
    setSearchQuery(prefill || '');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  // Search catalog locally
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const catalog = getCatalog();
    const results: CatalogMinifig[] = [];
    for (const m of catalog) {
      if (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.sets.some(s => s.name.toLowerCase().includes(q))
      ) {
        results.push(m);
        if (results.length >= 12) break;
      }
    }
    return results;
  }, [searchQuery]);

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return 'bg-sw-green/20 text-sw-green';
    if (c >= 0.5) return 'bg-sw-orange/20 text-sw-orange';
    return 'bg-sw-red/20 text-sw-red';
  };

  return (
    <Modal open={open} onClose={handleClose} title="Scan Minifigure">
      <div className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileCapture}
        />

        {/* No API key state */}
        {!apiKey && state === 'idle' && !showSearch && (
          <div className="text-center py-8">
            <AlertCircle size={40} className="mx-auto mb-3 text-sw-orange opacity-60" />
            <p className="text-sw-text mb-1">API key required for AI scan</p>
            <p className="text-sm text-sw-text-dim mb-4">
              Set up a free Groq API key, or search by name below.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => { handleClose(); onOpenSettings(); }}>
                <Settings size={14} />
                Set Up API Key
              </Button>
              <Button variant="secondary" onClick={() => openSearch()}>
                <Search size={14} />
                Search by Name
              </Button>
            </div>
          </div>
        )}

        {/* Idle state — ready to scan */}
        {apiKey && state === 'idle' && !showSearch && (
          <div className="text-center py-8">
            <Camera size={48} className="mx-auto mb-3 text-sw-blue opacity-60" />
            <p className="text-sw-text mb-1">Take a photo of a minifigure</p>
            <p className="text-sm text-sw-text-dim mb-6">
              We'll identify it using AI and match it to the catalog.
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Camera size={16} />
              Take Photo
            </Button>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => openSearch()}
                className="text-xs text-sw-text-dim hover:text-sw-text transition-colors cursor-pointer"
              >
                <Search size={12} className="inline mr-1" />
                Search by name
              </button>
              <button
                onClick={() => { handleClose(); onOpenSettings(); }}
                className="text-xs text-sw-text-dim hover:text-sw-text transition-colors cursor-pointer"
              >
                <Settings size={12} className="inline mr-1" />
                Settings
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {state === 'loading' && (
          <div className="text-center py-6">
            {preview && (
              <img src={preview} alt="Captured" className="w-32 h-32 object-cover rounded-lg mx-auto mb-4 border border-sw-border" />
            )}
            <Loader size={32} className="mx-auto mb-3 text-sw-blue animate-spin" />
            <p className="text-sw-text">Analyzing...</p>
            <p className="text-sm text-sw-text-dim mt-1">Identifying your minifigure</p>
          </div>
        )}

        {/* Results state */}
        {state === 'results' && !showSearch && (
          <div>
            {preview && (
              <img src={preview} alt="Captured" className="w-24 h-24 object-cover rounded-lg mx-auto mb-4 border border-sw-border" />
            )}

            {matches.length === 0 ? (
              <div className="text-center py-4">
                <AlertCircle size={32} className="mx-auto mb-2 text-sw-orange opacity-60" />
                <p className="text-sw-text">No match found</p>
                <p className="text-sm text-sw-text-dim mt-1">Try searching by name instead.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-sw-text-dim">
                  {matches.length} match{matches.length !== 1 ? 'es' : ''} found — pick your variant
                </p>
                {matches.map((match) => {
                  const price = getMarketPrice(match.id);
                  return (
                    <button
                      key={match.id}
                      onClick={() => handleSelectMatch(match)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-sw-dark border border-sw-border hover:border-sw-gold/50 transition-colors text-left cursor-pointer group"
                    >
                      <ImageWithFallback
                        src={match.minifig?.imageUrl ?? ''}
                        alt={match.name}
                        className="w-14 h-14 rounded-lg shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-sw-text truncate group-hover:text-sw-gold transition-colors">
                            {match.name}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${confidenceColor(match.confidence)}`}>
                            {Math.round(match.confidence * 100)}%
                          </span>
                        </div>
                        <div className="text-xs text-sw-text-dim font-mono">{match.id}</div>
                        <div className="text-xs text-sw-text-dim mt-0.5 line-clamp-1">{match.reasoning}</div>
                        {price !== null && (
                          <div className="text-xs text-sw-green mt-0.5">${price.toFixed(2)}</div>
                        )}
                      </div>
                      <Plus size={16} className="text-sw-text-dim group-hover:text-sw-gold shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button variant="secondary" onClick={reset} className="flex-1">
                <RotateCcw size={14} />
                Scan Again
              </Button>
              <Button variant="secondary" onClick={() => openSearch(matches[0]?.reasoning?.split(' — ')[0])} className="flex-1">
                <Search size={14} />
                Search by Name
              </Button>
            </div>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && !showSearch && (
          <div className="text-center py-6">
            {preview && (
              <img src={preview} alt="Captured" className="w-24 h-24 object-cover rounded-lg mx-auto mb-4 border border-sw-border" />
            )}
            <AlertCircle size={32} className="mx-auto mb-2 text-sw-red opacity-60" />
            <p className="text-sw-text mb-1">Scan failed</p>
            <p className="text-sm text-sw-text-dim mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="secondary" onClick={reset}>
                <RotateCcw size={14} />
                Try Again
              </Button>
              <Button variant="secondary" onClick={() => openSearch()}>
                <Search size={14} />
                Search by Name
              </Button>
              {error.includes('API key') && (
                <Button onClick={() => { handleClose(); onOpenSettings(); }}>
                  <Settings size={14} />
                  Settings
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Search mode */}
        {showSearch && (
          <div>
            {preview && (
              <img src={preview} alt="Captured" className="w-20 h-20 object-cover rounded-lg mx-auto mb-3 border border-sw-border" />
            )}

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sw-text-dim" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type character name (e.g. C-3PO, Darth Vader)"
                className="w-full bg-sw-dark border border-sw-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-sw-text placeholder:text-sw-text-dim/50 focus:outline-none focus:border-sw-gold/50 transition-colors"
              />
            </div>

            {searchQuery.length >= 2 && (
              <div className="mt-3 max-h-64 overflow-y-auto space-y-1.5">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-sw-text-dim text-center py-4">No results for "{searchQuery}"</p>
                ) : (
                  <>
                    <p className="text-xs text-sw-text-dim">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                    {searchResults.map(minifig => {
                      const price = getMarketPrice(minifig.id);
                      return (
                        <button
                          key={minifig.id}
                          onClick={() => handleSelectCatalog(minifig)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-sw-dark border border-sw-border hover:border-sw-gold/50 transition-colors text-left cursor-pointer group"
                        >
                          <ImageWithFallback
                            src={minifig.imageUrl}
                            alt={minifig.name}
                            className="w-12 h-12 rounded-lg shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-sw-text truncate block group-hover:text-sw-gold transition-colors">
                              {minifig.name}
                            </span>
                            <div className="text-xs text-sw-text-dim font-mono">{minifig.id}</div>
                            {price !== null && (
                              <div className="text-xs text-sw-green mt-0.5">${price.toFixed(2)}</div>
                            )}
                          </div>
                          <Plus size={16} className="text-sw-text-dim group-hover:text-sw-gold shrink-0 transition-colors" />
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            <Button variant="secondary" onClick={() => setShowSearch(false)} className="w-full mt-3">
              <RotateCcw size={14} />
              Back
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
