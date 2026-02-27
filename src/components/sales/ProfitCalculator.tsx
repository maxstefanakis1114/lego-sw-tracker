interface ProfitCalculatorProps {
  salePrice: number;
  platformFee: number;
  costBasis: number;
  shippingCost: number;
  shippingCharged: number;
}

export function ProfitCalculator({
  salePrice,
  platformFee,
  costBasis,
  shippingCost,
  shippingCharged,
}: ProfitCalculatorProps) {
  const netProfit = salePrice - platformFee - costBasis - shippingCost + shippingCharged;
  const margin = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;

  return (
    <div className="glass rounded-lg p-3 space-y-1.5 text-sm">
      <div className="text-xs font-semibold text-sw-text-dim mb-2">Profit Breakdown</div>
      <div className="flex justify-between">
        <span className="text-sw-text-dim">Sale Price</span>
        <span className="text-sw-text">${salePrice.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sw-text-dim">Platform Fee</span>
        <span className="text-sw-red">-${platformFee.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sw-text-dim">Cost Basis</span>
        <span className="text-sw-red">-${costBasis.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sw-text-dim">Shipping Cost</span>
        <span className="text-sw-red">-${shippingCost.toFixed(2)}</span>
      </div>
      {shippingCharged > 0 && (
        <div className="flex justify-between">
          <span className="text-sw-text-dim">Shipping Charged</span>
          <span className="text-sw-green">+${shippingCharged.toFixed(2)}</span>
        </div>
      )}
      <div className="border-t border-sw-border pt-1.5 flex justify-between font-bold">
        <span className="text-sw-text-dim">Net Profit</span>
        <span className={netProfit >= 0 ? 'text-sw-green' : 'text-sw-red'}>
          {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
          <span className="text-xs font-normal ml-1">({margin.toFixed(1)}%)</span>
        </span>
      </div>
    </div>
  );
}
