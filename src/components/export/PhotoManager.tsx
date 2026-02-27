import { useState } from 'react';
import type { CollectionEntry } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ImagePlus, X, Camera } from 'lucide-react';

interface PhotoManagerProps {
  entry: CollectionEntry;
  onUpdateEntry: (minifigId: string, updates: Partial<CollectionEntry>) => void;
}

export function PhotoManager({ entry, onUpdateEntry }: PhotoManagerProps) {
  const [newUrl, setNewUrl] = useState('');
  const photos = entry.photoUrls ?? [];

  const addPhoto = () => {
    if (!newUrl.trim() || photos.length >= 5) return;
    onUpdateEntry(entry.minifigId, {
      photoUrls: [...photos, newUrl.trim()],
    });
    setNewUrl('');
  };

  const removePhoto = (index: number) => {
    onUpdateEntry(entry.minifigId, {
      photoUrls: photos.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-sw-text-dim font-semibold flex items-center gap-1">
        <Camera size={12} />
        Photos ({photos.length}/5)
      </div>

      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photos.map((url, idx) => (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                className="w-16 h-16 rounded object-cover border border-sw-border"
                onError={e => { (e.target as HTMLImageElement).src = ''; }}
              />
              <button
                onClick={() => removePhoto(idx)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-sw-red rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X size={10} className="text-white" />
              </button>
              <span className="absolute bottom-0 left-0 bg-black/60 text-[9px] text-white px-1 rounded-tr">
                {idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {photos.length < 5 && (
        <div className="flex gap-2">
          <Input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="https://... photo URL"
            className="flex-1"
          />
          <Button variant="secondary" size="sm" onClick={addPhoto} disabled={!newUrl.trim()}>
            <ImagePlus size={14} />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
