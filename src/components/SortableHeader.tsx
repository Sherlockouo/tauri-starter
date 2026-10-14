/**
 * Sort indicator for table columns (HeroUI 3.1 has no SortableColumnHeader
 * compound — this renders the label plus an arrow via the RAC render prop).
 */
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { SortDescriptor } from "@heroui/react";

type SortDirection = SortDescriptor["direction"];

export function SortableHeader({
  label,
  sortDirection,
}: {
  label: string;
  sortDirection: SortDirection | undefined;
}) {
  return (
    <span className="flex items-center gap-1">
      {label}
      {sortDirection === "ascending" ? (
        <ChevronUp className="size-3" />
      ) : sortDirection === "descending" ? (
        <ChevronDown className="size-3" />
      ) : (
        <ChevronsUpDown className="size-3 opacity-50" />
      )}
    </span>
  );
}
