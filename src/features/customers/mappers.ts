import type {
  CustomerAppointmentSummaryDTO,
  CustomerDetailDTO,
  CustomerFinancialSummaryDTO,
  CustomerListItemDTO,
  CustomerNoteDTO,
} from "./types";
import type { CustomerStatus } from "./schemas";

type CustomerRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  whatsapp: string | null;
  birth_date: string | null;
  city: string | null;
  state: string | null;
  profession: string | null;
  acquisition_source: string | null;
  objectives: string | null;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
};

type CustomerNoteRow = {
  id: string;
  content: string;
  created_at: string;
};

type CustomerAppointmentRow = {
  id: string;
  starts_at: string;
  status: string;
  services: { name: string } | Array<{ name: string }> | null;
};

type CustomerFinancialRow = {
  id: string;
  transaction_type: "income" | "expense";
  amount: number | string;
  status: string;
  due_date: string;
  description: string | null;
};

function resolveServiceName(
  services: CustomerAppointmentRow["services"],
): string {
  if (!services) return "Serviço";
  if (Array.isArray(services)) return services[0]?.name ?? "Serviço";
  return services.name;
}

export function mapCustomerListItem(row: CustomerRow): CustomerListItemDTO {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    status: row.status,
    acquisitionSource: row.acquisition_source,
    objectives: row.objectives,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCustomerNote(row: CustomerNoteRow): CustomerNoteDTO {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
  };
}

export function mapCustomerAppointment(
  row: CustomerAppointmentRow,
): CustomerAppointmentSummaryDTO {
  return {
    id: row.id,
    startsAt: row.starts_at,
    status: row.status,
    serviceName: resolveServiceName(row.services),
  };
}

export function mapCustomerFinancialEntry(
  row: CustomerFinancialRow,
): CustomerFinancialSummaryDTO {
  return {
    id: row.id,
    kind: row.transaction_type,
    amountCents: Math.round(Number(row.amount) * 100),
    status: row.status,
    dueDate: row.due_date,
    description: row.description,
  };
}

export function mapCustomerDetail(
  row: CustomerRow & {
    customer_notes?: CustomerNoteRow[] | null;
    appointments?: CustomerAppointmentRow[] | null;
    financial_transactions?: CustomerFinancialRow[] | null;
  },
): CustomerDetailDTO {
  const notes = (row.customer_notes ?? [])
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(mapCustomerNote);
  const appointments = (row.appointments ?? [])
    .slice()
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
    .map(mapCustomerAppointment);
  const financialEntries = (row.financial_transactions ?? [])
    .slice()
    .sort((a, b) => b.due_date.localeCompare(a.due_date))
    .map(mapCustomerFinancialEntry);

  return {
    ...mapCustomerListItem(row),
    birthDate: row.birth_date,
    city: row.city,
    state: row.state,
    profession: row.profession,
    notes,
    appointments,
    financialEntries,
  };
}
