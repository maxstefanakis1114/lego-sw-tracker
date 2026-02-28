import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Cloud, CloudOff, Copy, Check, RefreshCw, Loader, Link } from 'lucide-react';

interface SyncModalProps {
  open: boolean;
  onClose: () => void;
  syncId: string | null;
  syncing: boolean;
  lastSynced: string | null;
  error: string;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onDisconnect: () => void;
  onManualSync: () => void;
}

export function SyncModal({
  open, onClose, syncId, syncing, lastSynced, error,
  onCreate, onJoin, onDisconnect, onManualSync,
}: SyncModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!syncId) return;
    navigator.clipboard.writeText(syncId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal open={open} onClose={onClose} title="Sync">
      <div className="space-y-4">
        {!syncId ? (
          <>
            {/* Not connected */}
            <div className="text-center py-4">
              <Cloud size={40} className="mx-auto mb-3 text-sw-blue opacity-60" />
              <p className="text-sw-text mb-1">Sync your collection across devices</p>
              <p className="text-sm text-sw-text-dim mb-6">
                Create a sync code on this device, then enter it on your other devices.
              </p>
            </div>

            <Button onClick={onCreate} disabled={syncing} className="w-full">
              {syncing ? <Loader size={14} className="animate-spin" /> : <Cloud size={14} />}
              Create Sync Code
            </Button>

            <div className="flex items-center gap-3 text-sm text-sw-text-dim">
              <div className="flex-1 h-px bg-sw-border" />
              or
              <div className="flex-1 h-px bg-sw-border" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-sw-text-dim">Have a code from another device?</p>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="Paste sync code here"
                className="w-full bg-sw-dark border border-sw-border rounded-lg px-3 py-2.5 text-sm text-sw-text placeholder:text-sw-text-dim/50 focus:outline-none focus:border-sw-gold/50 transition-colors font-mono"
              />
              <Button
                variant="secondary"
                onClick={() => onJoin(joinCode)}
                disabled={syncing || !joinCode.trim()}
                className="w-full"
              >
                {syncing ? <Loader size={14} className="animate-spin" /> : <Link size={14} />}
                Join Sync
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Connected */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sw-green/10 border border-sw-green/30">
              <Cloud size={18} className="text-sw-green shrink-0" />
              <div>
                <p className="text-sm text-sw-green font-semibold">Synced</p>
                {lastSynced && (
                  <p className="text-xs text-sw-text-dim">Last synced: {formatTime(lastSynced)}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-sw-text-dim">Your sync code (share with your other devices):</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-sw-dark border border-sw-border rounded-lg px-3 py-2.5 text-sm text-sw-text font-mono truncate select-all">
                  {syncId}
                </div>
                <Button variant="secondary" onClick={handleCopy} size="md">
                  {copied ? <Check size={14} className="text-sw-green" /> : <Copy size={14} />}
                </Button>
              </div>
            </div>

            <Button onClick={onManualSync} disabled={syncing} className="w-full">
              {syncing ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Sync Now
            </Button>

            <Button variant="danger" onClick={onDisconnect} className="w-full">
              <CloudOff size={14} />
              Disconnect
            </Button>
          </>
        )}

        {error && (
          <p className="text-sm text-sw-red text-center">{error}</p>
        )}
      </div>
    </Modal>
  );
}
