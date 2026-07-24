import type { FinancialKind, FinancialStatus } from "./schemas";

export type FinancialEntryListItemDTO = {
  id: string;
  kind: FinancialKind;
  description: string;
  amountCents: number;
  status: FinancialStatus;
  dueDate: string;
  paidAt: string | null;
  categoryId: string;
  categoryName: string | null;
  customerId: string | null;
  customerName: string | null;
  createdAt: string;
};

export type FinancialEntryDetailDTO = FinancialEntryListItemDTO;

export type FinancialDashboardSummaryDTO = {
  incomeCents: number;
  expenseCents: number;
  profitCents: number;
  pendingCents: number;
};

export type PaginatedFinancialEntriesDTO = {
  items: FinancialEntryListItemDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  summary: FinancialDashboardSummaryDTO;
};

export type FinancialCategoryDTO = {
  id: string;
  name: string;
  kind: FinancialKind;
};

export type FinancePanelCapabilitiesDTO = {
  canRead: boolean;
  canManage: boolean;
};
