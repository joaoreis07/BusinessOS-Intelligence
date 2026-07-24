import type { CustomerStatus } from "./schemas";

export type CustomerListItemDTO = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  whatsapp: string | null;
  status: CustomerStatus;
  acquisitionSource: string | null;
  objectives: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerNoteDTO = {
  id: string;
  content: string;
  createdAt: string;
};

export type CustomerAppointmentSummaryDTO = {
  id: string;
  startsAt: string;
  status: string;
  serviceName: string;
};

export type CustomerFinancialSummaryDTO = {
  id: string;
  kind: "income" | "expense";
  amountCents: number;
  status: string;
  dueDate: string;
  description: string | null;
};

export type CustomerDetailDTO = CustomerListItemDTO & {
  birthDate: string | null;
  city: string | null;
  state: string | null;
  profession: string | null;
  notes: CustomerNoteDTO[];
  appointments: CustomerAppointmentSummaryDTO[];
  financialEntries: CustomerFinancialSummaryDTO[];
};

export type PaginatedCustomersDTO = {
  items: CustomerListItemDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CustomerPanelCapabilitiesDTO = {
  canRead: boolean;
  canManage: boolean;
};
