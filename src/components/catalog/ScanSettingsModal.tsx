import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Key, ExternalLink, Trash2 } from 'lucide-react';

interface ScanSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ScanSettingsModal({ open, onClose }: ScanSettingsModalProps) {
  const [storedKey, setStoredKey] = useLocalStorage('gemini-api-key', '');
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => {
    if (open) {
      setKeyInput(storedKey);
    }
  }, [open, storedKey]);

  const handleSave = () => {
    setStoredKey(keyInput.trim());
    onClose();
  };

  const handleClear = () => {
    setStoredKey('');
    setKeyInput('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Scan Settings">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-sw-dark border border-sw-border">
          <Key size={16} className="text-sw-gold mt-0.5 shrink-0" />
          <div className="text-sm text-sw-text-dim">
            <p>Enter your Google Gemini API key to enable minifig scanning. The free tier allows 1,500 scans per day.</p>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sw-blue hover:underline mt-2"
            >
              Get a free API key <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <Input
          label="Gemini API Key"
          type="password"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          placeholder="AIza..."
        />

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
          {storedKey && (
            <Button variant="danger" onClick={handleClear}>
              <Trash2 size={14} />
              Clear
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
