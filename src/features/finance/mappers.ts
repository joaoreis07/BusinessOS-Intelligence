import type {
  FinancialCategoryDTO,
  FinancialDashboardSummaryDTO,
  FinancialEntryListItemDTO,
} from "./types";
import type { FinancialKind, FinancialStatus } from "./schemas";

type FinancialEntryRow = {
  id: string;
  transaction_type: FinancialKind;
  description: string;
  amount: number | string;
  status: FinancialStatus;
  due_date: string;
  paid_at: string | null;
  category_id: string;
  customer_id: string | null;
  created_at: string;
  financial_categories?:
    | { name: string }
    | Array<{ name: string }>
    | null;
  customers?:
    | { full_name: string }
    | Array<{ full_name: string }>
    | null;
};

function resolveName<T extends { name?: string; full_name?: string }>(
  value: T | T[] | null | undefined,
  field: "name" | "full_name",
) {
  if (!value) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row) return null;
  return field === "name" ? row.name ?? null : row.full_name ?? null;
}

export function mapFinancialEntryListItem(row: FinancialEntryRow): FinancialEntryListItemDTO {
  return {
    id: row.id,
    kind: row.transaction_type,
    description: row.description,
    amountCents: Math.round(Number(row.amount) * 100),
    status: row.status,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    categoryId: row.category_id,
    categoryName: resolveName(row.financial_categories, "name"),
    customerId: row.customer_id,
    customerName: resolveName(row.customers, "full_name"),
    createdAt: row.created_at,
  };
}

export function mapFinancialCategory(row: {
  id: string;
  name: string;
  transaction_type: FinancialKind;
}): FinancialCategoryDTO {
  return {
    id: row.id,
    name: row.name,
    kind: row.transaction_type,
  };
}

export function buildFinancialSummary(
  rows: Array<{
    transaction_type: FinancialKind;
    amount: number | string;
    status: FinancialStatus;
  }>,
): FinancialDashboardSummaryDTO {
  return rows.reduce(
    (summary, row) => {
      const amountCents = Math.round(Number(row.amount) * 100);
      if (row.transaction_type === "income" && row.status === "paid") {
        summary.incomeCents += amountCents;
      }
      if (row.transaction_type === "expense" && row.status === "paid") {
        summary.expenseCents += amountCents;
      }
      if (row.status === "pending" || row.status === "overdue") {
        summary.pendingCents += amountCents;
      }
      summary.profitCents = summary.incomeCents - summary.expenseCents;
      return summary;
    },
    { incomeCents: 0, expenseCents: 0, profitCents: 0, pendingCents: 0 },
  );
}
