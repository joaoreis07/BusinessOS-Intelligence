"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  cancelAppointmentAction,
  getAppointmentDetailAction,
  getRescheduleSlotsAction,
  rescheduleAppointmentAction,
  updateAppointmentStatusAction,
  type AgendaActionState,
} from "@/app/(workspace)/dashboard/agenda/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getAllowedNextStatuses,
  APPOINTMENT_STATUS_LABELS,
} from "@/features/scheduling/panel/status";
import type {
  AppointmentDetailDTO,
  AppointmentListItemDTO,
  AppointmentPanelCapabilitiesDTO,
  PaginatedAppointmentsDTO,
} from "@/features/scheduling/types";
import type {
  AppointmentPanelView,
  AppointmentStatus,
  ListAppointmentsQuery,
} from "@/features/scheduling/schemas";
import { cn, formatCurrencyFromCents } from "@/lib/utils";

type ServiceOption = { id: string; name: string };

type AppointmentsPanelProps = {
  data: PaginatedAppointmentsDTO;
  services: ServiceOption[];
  capabilities: AppointmentPanelCapabilitiesDTO;
  initialDetail: AppointmentDetailDTO | null;
  timezone: string;
  query: ListAppointmentsQuery;
};

const VIEW_OPTIONS: Array<{ id: AppointmentPanelView; label: string }> = [
  { id: "list", label: "Lista" },
  { id: "day", label: "Dia" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
];

const TIMEFRAME_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "upcoming", label: "Próximos" },
  { id: "past", label: "Passados" },
] as const;

function statusTone(status: AppointmentStatus) {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (status === "in_progress") return "bg-sky-50 text-sky-700";
  if (status === "completed") return "bg-slate-100 text-slate-700";
  if (status === "cancelled") return "bg-rose-50 text-rose-700";
  if (status === "no_show") return "bg-amber-50 text-amber-800";
  return "bg-yellow-50 text-yellow-800";
}

function formatDateTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(iso));
}

function Feedback({ state }: { state: AgendaActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-[var(--danger)]">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="text-sm text-[var(--success)]">
        {state.success}
      </p>
    );
  }
  return null;
}

export function AppointmentsPanel({
  data,
  services,
  capabilities,
  initialDetail,
  timezone,
  query,
}: AppointmentsPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [detail, setDetail] = useState<AppointmentDetailDTO | null>(initialDetail);
  const [message, setMessage] = useState<AgendaActionState>({});
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [mode, setMode] = useState<"detail" | "cancel" | "reschedule">("detail");

  const selectedId = searchParams.get("selected");

  const filters = useMemo(
    () => ({
      q: searchParams.get("q") ?? "",
      status: searchParams.get("status") ?? "",
      serviceId: searchParams.get("serviceId") ?? "",
      timeframe: searchParams.get("timeframe") ?? query.timeframe,
      view: (searchParams.get("view") ?? query.view) as AppointmentPanelView,
    }),
    [query.timeframe, query.view, searchParams],
  );

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function openDetail(appointment: AppointmentListItemDTO) {
    updateParams({ selected: appointment.id });
    startTransition(async () => {
      const result = await getAppointmentDetailAction(appointment.id);
      if (result.data) {
        setDetail(result.data);
        setMode("detail");
        setMessage({});
      } else {
        setMessage({ error: result.error });
      }
    });
  }

  function closeDetail() {
    setDetail(null);
    setMode("detail");
    updateParams({ selected: null });
  }

  function loadRescheduleSlots(date: string) {
    if (!detail) return;
    setRescheduleDate(date);
    setRescheduleSlot("");
    startTransition(async () => {
      const result = await getRescheduleSlotsAction({
        serviceId: detail.serviceId,
        date,
      });
      setRescheduleSlots(result.data);
      if (result.error) setMessage({ error: result.error });
    });
  }

  function runStatusUpdate(status: AppointmentStatus) {
    if (!detail || !capabilities.canManage) return;
    startTransition(async () => {
      const result = await updateAppointmentStatusAction({ id: detail.id, status });
      setMessage(result);
      if (!result.error) {
        const refreshed = await getAppointmentDetailAction(detail.id);
        if (refreshed.data) setDetail(refreshed.data);
        router.refresh();
      }
    });
  }

  function submitCancel() {
    if (!detail || !capabilities.canManage) return;
    startTransition(async () => {
      const result = await cancelAppointmentAction({ id: detail.id, reason: cancelReason });
      setMessage(result);
      if (!result.error) {
        closeDetail();
        router.refresh();
      }
    });
  }

  function submitReschedule() {
    if (!detail || !capabilities.canManage || !rescheduleSlot) return;
    startTransition(async () => {
      const result = await rescheduleAppointmentAction({
        id: detail.id,
        startsAt: rescheduleSlot,
      });
      setMessage(result);
      if (!result.error) {
        setMode("detail");
        const refreshed = await getAppointmentDetailAction(detail.id);
        if (refreshed.data) setDetail(refreshed.data);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="mt-2 text-[var(--muted)]">
            Gerencie atendimentos, confirmações, cancelamentos e reagendamentos.
          </p>
          {capabilities.canConfigure ? (
            <Link
              href="/dashboard/configuracoes/agendamento"
              className="mt-3 inline-flex text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Configurar horários e bloqueios
            </Link>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={filters.view === option.id ? "primary" : "secondary"}
              onClick={() => updateParams({ view: option.id, page: "1" })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </header>

      <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-3 left-3 text-[var(--muted)]" size={16} />
            <Input
              defaultValue={filters.q}
              placeholder="Buscar cliente, serviço ou observação"
              className="pl-9"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  updateParams({ q: event.currentTarget.value || null, page: "1" });
                }
              }}
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <select
              defaultValue={filters.status}
              className="h-11 rounded-xl border bg-white px-3 text-sm"
              onChange={(event) => updateParams({ status: event.target.value || null, page: "1" })}
            >
              <option value="">Todos os status</option>
              {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              defaultValue={filters.serviceId}
              className="h-11 rounded-xl border bg-white px-3 text-sm"
              onChange={(event) => updateParams({ serviceId: event.target.value || null, page: "1" })}
            >
              <option value="">Todos os serviços</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <select
              defaultValue={filters.timeframe}
              className="h-11 rounded-xl border bg-white px-3 text-sm"
              onChange={(event) => updateParams({ timeframe: event.target.value, page: "1" })}
            >
              {TIMEFRAME_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                updateParams({
                  q: null,
                  status: null,
                  serviceId: null,
                  timeframe: "all",
                  page: "1",
                })
              }
            >
              <SlidersHorizontal size={16} />
              Limpar filtros
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="overflow-hidden">
          {data.items.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-[var(--surface-subtle)] text-left text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Serviço</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className={cn(
                        "cursor-pointer border-b transition hover:bg-[var(--surface-subtle)]",
                        selectedId === appointment.id && "bg-[var(--accent)]",
                      )}
                      onClick={() => openDetail(appointment)}
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold">{appointment.customerName}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {appointment.customerPhone ?? "Sem telefone"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{appointment.serviceName}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {formatCurrencyFromCents(appointment.priceCents)}
                        </p>
                      </td>
                      <td className="px-4 py-4">{formatDateTime(appointment.startsAt, timezone)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                            statusTone(appointment.status),
                          )}
                        >
                          {APPOINTMENT_STATUS_LABELS[appointment.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center text-[var(--muted)]">
              <CalendarDays className="mx-auto mb-3 opacity-60" size={28} />
              Nenhum agendamento encontrado para os filtros selecionados.
            </div>
          )}

          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-[var(--muted)]">
              Página {data.page} de {data.totalPages} · {data.total} registros
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={data.page <= 1}
                onClick={() => updateParams({ page: String(data.page - 1) })}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={data.page >= data.totalPages}
                onClick={() => updateParams({ page: String(data.page + 1) })}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </Card>

        <aside
          aria-label="Detalhes do agendamento"
          className={cn(
            "rounded-2xl border bg-white p-5 shadow-sm",
            !detail && "hidden xl:block xl:opacity-60",
          )}
        >
          {detail ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--muted)]">Detalhes</p>
                  <h2 className="text-xl font-semibold">{detail.customerName}</h2>
                </div>
                <button
                  type="button"
                  aria-label="Fechar detalhes"
                  className="rounded-lg p-2 hover:bg-[var(--surface-subtle)]"
                  onClick={closeDetail}
                >
                  <X size={16} />
                </button>
              </div>

              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                  statusTone(detail.status),
                )}
              >
                {APPOINTMENT_STATUS_LABELS[detail.status]}
              </span>

              {mode === "detail" && (
                <>
                  <dl className="space-y-3 text-sm">
                    <DetailRow label="Serviço" value={detail.serviceName} />
                    <DetailRow label="Horário" value={formatDateTime(detail.startsAt, timezone)} />
                    <DetailRow label="Telefone" value={detail.customerPhone ?? "—"} />
                    <DetailRow label="E-mail" value={detail.customerEmail ?? "—"} />
                    <DetailRow label="Objetivo" value={detail.objective ?? "—"} />
                    <DetailRow label="Observações" value={detail.customerNotes ?? detail.internalNotes ?? "—"} />
                    <DetailRow label="Origem" value={detail.source} />
                    <DetailRow label="Criado em" value={formatDateTime(detail.createdAt, timezone)} />
                    <DetailRow label="Atualizado em" value={formatDateTime(detail.updatedAt, timezone)} />
                  </dl>

                  {detail.history.length ? (
                    <div>
                      <h3 className="text-sm font-semibold">Histórico</h3>
                      <ul className="mt-3 space-y-2 text-xs text-[var(--muted)]">
                        {detail.history.map((event) => (
                          <li key={event.id} className="rounded-xl bg-[var(--surface-subtle)] p-3">
                            <p className="font-medium text-[var(--foreground)]">{event.eventType}</p>
                            <p>
                              {formatDateTime(event.createdAt, timezone)}
                              {event.fromStatus && event.toStatus
                                ? ` · ${APPOINTMENT_STATUS_LABELS[event.fromStatus]} → ${APPOINTMENT_STATUS_LABELS[event.toStatus]}`
                                : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {capabilities.canManage ? (
                    <div className="space-y-3 border-t pt-4">
                      <label className="block space-y-1.5 text-sm font-medium">
                        <span>Alterar status</span>
                        <select
                          className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
                          defaultValue={detail.status}
                          onChange={(event) => runStatusUpdate(event.target.value as AppointmentStatus)}
                          disabled={pending}
                        >
                          <option value={detail.status}>{APPOINTMENT_STATUS_LABELS[detail.status]}</option>
                          {getAllowedNextStatuses(detail.status).map((status) => (
                            <option key={status} value={status}>
                              {APPOINTMENT_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="grid gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={pending}
                          onClick={() => {
                            setMode("reschedule");
                            setRescheduleDate(detail.startsAt.slice(0, 10));
                            loadRescheduleSlots(detail.startsAt.slice(0, 10));
                          }}
                        >
                          Reagendar
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          disabled={pending}
                          onClick={() => setMode("cancel")}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {mode === "cancel" && capabilities.canManage && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Cancelar agendamento</h3>
                  <label className="block space-y-1.5 text-sm font-medium">
                    <span>Motivo</span>
                    <textarea
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      rows={4}
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                      required
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setMode("detail")}>
                      Voltar
                    </Button>
                    <Button type="button" variant="danger" disabled={pending} onClick={submitCancel}>
                      Confirmar cancelamento
                    </Button>
                  </div>
                </div>
              )}

              {mode === "reschedule" && capabilities.canManage && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Reagendar</h3>
                  <label className="block space-y-1.5 text-sm font-medium">
                    <span>Nova data</span>
                    <Input
                      type="date"
                      value={rescheduleDate}
                      onChange={(event) => loadRescheduleSlots(event.target.value)}
                    />
                  </label>
                  {pending ? (
                    <p className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                      <Loader2 className="animate-spin" size={16} />
                      Carregando horários...
                    </p>
                  ) : rescheduleSlots.length ? (
                    <div className="grid grid-cols-2 gap-2">
                      {rescheduleSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setRescheduleSlot(slot)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm font-semibold",
                            rescheduleSlot === slot && "border-[var(--primary)] bg-[var(--accent)]",
                          )}
                        >
                          {formatDateTime(slot, timezone).split(", ").pop()}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted)]">Nenhum horário disponível.</p>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setMode("detail")}>
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      disabled={pending || !rescheduleSlot}
                      onClick={submitReschedule}
                    >
                      Confirmar reagendamento
                    </Button>
                  </div>
                </div>
              )}

              <Feedback state={message} />
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-[var(--muted)]">
              Selecione um agendamento para ver detalhes, histórico e ações.
            </div>
          )}
        </aside>
      </div>

      {pending ? (
        <p className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 className="animate-spin" size={16} />
          Processando...
        </p>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
