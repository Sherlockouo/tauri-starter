/** Shared status chip for customer lifecycle states. */
import { Chip } from "@heroui/react";
import type { CustomerStatus } from "../data/types";

const CUSTOMER_COLOR: Record<CustomerStatus, "success" | "warning" | "danger"> = {
  active: "success",
  trial: "warning",
  churned: "danger",
};

export function StatusChip({ status }: { status: CustomerStatus }) {
  return (
    <Chip color={CUSTOMER_COLOR[status]} size="sm" variant="soft" className="capitalize">
      {status}
    </Chip>
  );
}
