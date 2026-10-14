/** Top products by revenue with a progress bar ranking. */
import { Card, ProgressBar } from "@heroui/react";
import { formatCurrency, formatNumber } from "../lib/format";
import type { Product } from "../data/types";

interface TopProductsProps {
  products: Product[];
}

export function TopProducts({ products }: TopProductsProps) {
  const max = Math.max(...products.map((p) => p.revenue), 1);

  return (
    <Card className="gap-4 p-5">
      <div>
        <h2 className="text-foreground text-sm font-semibold">Top products</h2>
        <p className="text-muted text-xs">Revenue leaders this period</p>
      </div>

      <ul className="space-y-4">
        {products.map((product, index) => (
          <li key={product.name} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground flex min-w-0 items-center gap-2">
                <span className="text-muted w-4 shrink-0 text-xs tabular-nums">{index + 1}.</span>
                <span className="truncate font-medium">{product.name}</span>
                <span className="text-muted shrink-0 text-xs">· {product.category}</span>
              </span>
              <span className="text-foreground shrink-0 font-medium tabular-nums">
                {formatCurrency(product.revenue, true)}
              </span>
            </div>
            <ProgressBar aria-label={`${product.name} revenue share`} value={(product.revenue / max) * 100}>
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <p className="text-muted text-xs">{formatNumber(product.sold)} sold</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
