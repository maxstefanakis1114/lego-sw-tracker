import { useState, useRef } from 'react';
import type { CatalogMinifig } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { identifyMinifig, type GeminiMatch } from '../../services/geminiService';
import { getMarketPrice } from '../../services/priceService';
import { Camera, Loader, AlertCircle, Settings, RotateCcw, Plus } from 'lucide-react';

interface ScanModalProps {
  open: boolean;
  onClose: () => void;
  onMatch: (minifig: CatalogMinifig) => void;
  onOpenSettings: () => void;
}

type ScanState = 'idle' | 'loading' | 'results' | 'error';

export function ScanModal({ open, onClose, onMatch, onOpenSettings }: ScanModalProps) {
  const [apiKey] = useLocalStorage('gemini-api-key', '');
  const [state, setState] = useState<ScanState>('idle');
  const [matches, setMatches] = useState<GeminiMatch[]>([]);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setState('idle');
    setMatches([]);
    setError('');
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setState('loading');
    setError('');

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
        {!apiKey && state === 'idle' && (
          <div className="text-center py-8">
            <AlertCircle size={40} className="mx-auto mb-3 text-sw-orange opacity-60" />
            <p className="text-sw-text mb-1">API key required</p>
            <p className="text-sm text-sw-text-dim mb-4">
              Set up your free Google Gemini API key to start scanning.
            </p>
            <Button onClick={() => { handleClose(); onOpenSettings(); }}>
              <Settings size={14} />
              Set Up API Key
            </Button>
          </div>
        )}

        {/* Idle state — ready to scan */}
        {apiKey && state === 'idle' && (
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
            <button
              onClick={() => { handleClose(); onOpenSettings(); }}
              className="block mx-auto mt-3 text-xs text-sw-text-dim hover:text-sw-text transition-colors cursor-pointer"
            >
              <Settings size={12} className="inline mr-1" />
              Settings
            </button>
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
        {state === 'results' && (
          <div>
            {preview && (
              <img src={preview} alt="Captured" className="w-24 h-24 object-cover rounded-lg mx-auto mb-4 border border-sw-border" />
            )}

            {matches.length === 0 ? (
              <div className="text-center py-4">
                <AlertCircle size={32} className="mx-auto mb-2 text-sw-orange opacity-60" />
                <p className="text-sw-text">No match found</p>
                <p className="text-sm text-sw-text-dim mt-1">Try a clearer photo or different angle.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-sw-text-dim">
                  {matches.length} match{matches.length !== 1 ? 'es' : ''} found
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

            <Button variant="secondary" onClick={reset} className="w-full mt-4">
              <RotateCcw size={14} />
              Scan Again
            </Button>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && (
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
              {error.includes('API key') && (
                <Button onClick={() => { handleClose(); onOpenSettings(); }}>
                  <Settings size={14} />
                  Settings
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
