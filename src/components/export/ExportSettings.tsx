import type { ExportSettings as ExportSettingsType } from '../../types';
import { Input } from '../ui/Input';

interface ExportSettingsProps {
  settings: ExportSettingsType;
  onSettingsChange: (settings: ExportSettingsType) => void;
}

export function ExportSettings({ settings, onSettingsChange }: ExportSettingsProps) {
  const update = (key: keyof ExportSettingsType, value: string | number | boolean) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-sw-text-dim">Export Settings</h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Shipping Price ($)"
          type="number"
          min={0}
          step={0.01}
          value={settings.shippingPrice}
          onChange={e => update('shippingPrice', e.target.value)}
        />
        <Input
          label="Default Condition"
          value={settings.defaultCondition}
          onChange={e => update('defaultCondition', e.target.value)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Markup % (over cost)"
          type="number"
          min={0}
          step={5}
          value={settings.markupPercent ?? ''}
          onChange={e => update('markupPercent', Number(e.target.value) || 0)}
        />
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-sw-text cursor-pointer">
            <input
              type="checkbox"
              checked={settings.roundTo99 ?? false}
              onChange={e => update('roundTo99', e.target.checked)}
              className="accent-sw-gold"
            />
            Round prices to .99
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-sw-text-dim">Description Template</label>
        <textarea
          value={settings.descriptionTemplate}
          onChange={e => update('descriptionTemplate', e.target.value)}
          rows={3}
          className="bg-sw-dark border border-sw-border rounded-lg px-3 py-2 text-sm text-sw-text placeholder:text-sw-text-dim/50 focus:outline-none focus:border-sw-gold/50 transition-colors resize-none font-mono"
        />
        <p className="text-xs text-sw-text-dim mt-1">
          Variables: {'{name}'}, {'{id}'}, {'{year}'}, {'{condition}'}, {'{notes}'}
        </p>
      </div>

      <div className="text-xs text-sw-text-dim border-t border-sw-border pt-3 space-y-1">
        <p><strong>Fixed fields:</strong></p>
        <p>Category: Toys & Hobbies | Sub Category: LEGO | Shipping: 1-3 oz | Hazmat: Not Hazmat</p>
      </div>
    </div>
  );
}
