"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  Loader2,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import {
  createBlockedPeriodAction,
  deleteBlockedPeriodAction,
  saveSchedulingSettingsAction,
  saveWeekScheduleAction,
  type SchedulingSettingsActionState,
} from "@/app/(workspace)/dashboard/configuracoes/agendamento/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BLOCKED_PERIOD_TYPE_LABELS,
  type SchedulingConfigurationDTO,
  type TimeIntervalDTO,
  type WeekdayScheduleDTO,
} from "@/features/scheduling/settings";
import {
  blockedPeriodSchema,
  schedulingSettingsSchema,
  weekScheduleInputSchema,
} from "@/features/scheduling/settings/schemas";
import { hasOverlappingIntervals } from "@/features/scheduling/settings/week-schedule";

type TabId = "hours" | "blocks" | "general";

function Feedback({ state }: { state: SchedulingSettingsActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-[var(--danger)]">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="inline-flex items-center gap-2 text-sm text-[var(--success)]">
        <CheckCircle2 size={16} aria-hidden="true" />
        {state.success}
      </p>
    );
  }
  return null;
}

function fromDatetimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[var(--primary)] text-white"
          : "bg-[var(--surface-subtle)] text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
}

function DayScheduleEditor({
  day,
  onChange,
  fieldErrors,
}: {
  day: WeekdayScheduleDTO;
  onChange: (next: WeekdayScheduleDTO) => void;
  fieldErrors?: string;
}) {
  function updateInterval(index: number, patch: Partial<TimeIntervalDTO>) {
    const intervals = day.intervals.map((interval, currentIndex) =>
      currentIndex === index ? { ...interval, ...patch } : interval,
    );
    onChange({ ...day, intervals });
  }

  function addInterval() {
    if (day.intervals.length >= 4) return;
    onChange({
      ...day,
      intervals: [...day.intervals, { startTime: "09:00", endTime: "12:00" }],
    });
  }

  function removeInterval(index: number) {
    onChange({
      ...day,
      intervals: day.intervals.filter((_, currentIndex) => currentIndex !== index),
    });
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{day.label}</h3>
          <p className="text-sm text-[var(--muted)]">
            {day.enabled ? "Dia disponível para agendamento" : "Dia indisponível"}
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={day.enabled}
            onChange={(event) =>
              onChange({
                ...day,
                enabled: event.target.checked,
                intervals: event.target.checked && day.intervals.length === 0
                  ? [{ startTime: "09:00", endTime: "18:00" }]
                  : day.intervals,
              })
            }
            className="size-4 rounded border"
          />
          Ativo
        </label>
      </div>

      {day.enabled ? (
        <div className="space-y-3">
          {day.intervals.map((interval, index) => (
            <div
              key={`${day.weekday}-${index}`}
              className="grid gap-3 rounded-xl border bg-[var(--surface-subtle)] p-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <label className="space-y-1 text-sm font-medium">
                <span>Início</span>
                <Input
                  type="time"
                  value={interval.startTime}
                  onChange={(event) => updateInterval(index, { startTime: event.target.value })}
                  aria-label={`Horário inicial de ${day.label}`}
                  required
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                <span>Fim</span>
                <Input
                  type="time"
                  value={interval.endTime}
                  onChange={(event) => updateInterval(index, { endTime: event.target.value })}
                  aria-label={`Horário final de ${day.label}`}
                  required
                />
              </label>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={day.intervals.length <= 1}
                  onClick={() => removeInterval(index)}
                  aria-label={`Remover intervalo de ${day.label}`}
                  className="text-[var(--danger)]"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            disabled={day.intervals.length >= 4}
            onClick={addInterval}
            className="inline-flex items-center gap-2"
          >
            <Plus size={16} aria-hidden="true" />
            Adicionar intervalo
          </Button>
          {fieldErrors ? (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {fieldErrors}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

export function SchedulingSettingsPanel({
  configuration,
}: {
  configuration: SchedulingConfigurationDTO;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("hours");
  const [weekSchedule, setWeekSchedule] = useState(configuration.weekSchedule);
  const [settings, setSettings] = useState(configuration.settings);
  const [hoursState, setHoursState] = useState<SchedulingSettingsActionState>({});
  const [generalState, setGeneralState] = useState<SchedulingSettingsActionState>({});
  const [blocksState, setBlocksState] = useState<SchedulingSettingsActionState>({});
  const [hoursPending, startHoursTransition] = useTransition();
  const [generalPending, startGeneralTransition] = useTransition();
  const [blocksPending, startBlocksTransition] = useTransition();
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);

  const [newBlock, setNewBlock] = useState({
    blockType: "temporary" as const,
    startsAt: "",
    endsAt: "",
    reason: "",
    allDay: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});

  const tabs = useMemo(
    () => [
      { id: "hours" as const, label: "Horários", icon: CalendarClock },
      { id: "blocks" as const, label: "Bloqueios", icon: CalendarX2 },
      { id: "general" as const, label: "Geral", icon: Settings2 },
    ],
    [],
  );

  function validateWeekScheduleLocally() {
    const nextErrors: Record<number, string> = {};
    for (const day of weekSchedule.days) {
      if (!day.enabled) continue;
      if (day.intervals.length === 0) {
        nextErrors[day.weekday] = "Adicione ao menos um intervalo.";
        continue;
      }
      if (hasOverlappingIntervals(day.intervals)) {
        nextErrors[day.weekday] = "Os intervalos não podem se sobrepor.";
      }
      for (const interval of day.intervals) {
        if (interval.startTime >= interval.endTime) {
          nextErrors[day.weekday] = "O horário inicial deve ser anterior ao final.";
        }
      }
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function saveHours() {
    if (!validateWeekScheduleLocally()) return;

    const payload = {
      timezone: weekSchedule.timezone,
      days: weekSchedule.days.map((day) => ({
        weekday: day.weekday,
        enabled: day.enabled,
        intervals: day.intervals,
      })),
    };

    const parsed = weekScheduleInputSchema.safeParse(payload);
    if (!parsed.success) {
      setHoursState({ error: parsed.error.issues[0]?.message ?? "Revise os horários informados." });
      return;
    }

    startHoursTransition(async () => {
      const result = await saveWeekScheduleAction(hoursState, payload);
      setHoursState(result);
    });
  }

  function saveGeneral() {
    const parsed = schedulingSettingsSchema.safeParse(settings);
    if (!parsed.success) {
      setGeneralState({
        error: parsed.error.issues[0]?.message ?? "Revise as configurações gerais.",
      });
      return;
    }

    startGeneralTransition(async () => {
      const result = await saveSchedulingSettingsAction(generalState, parsed.data);
      setGeneralState(result);
      if (result.success) {
        setSettings((current) => ({
          ...parsed.data,
          timezone: current.timezone,
          maxAppointmentsPerDay: parsed.data.maxAppointmentsPerDay ?? null,
        }));
      }
    });
  }

  function createBlock() {
    if (!newBlock.startsAt || !newBlock.endsAt) {
      setBlocksState({ error: "Informe início e término do bloqueio." });
      return;
    }

    const payload = {
      blockType: newBlock.blockType,
      startsAt: fromDatetimeLocalValue(newBlock.startsAt),
      endsAt: fromDatetimeLocalValue(newBlock.endsAt),
      reason: newBlock.reason || null,
      allDay: newBlock.allDay,
      scope: {},
    };

    const parsed = blockedPeriodSchema.safeParse(payload);
    if (!parsed.success) {
      setBlocksState({
        error: parsed.error.issues[0]?.message ?? "Revise os dados do bloqueio.",
      });
      return;
    }

    startBlocksTransition(async () => {
      const result = await createBlockedPeriodAction(blocksState, parsed.data);
      setBlocksState(result);
      if (result.success) {
        router.refresh();
        setNewBlock({
          blockType: "temporary",
          startsAt: "",
          endsAt: "",
          reason: "",
          allDay: false,
        });
      }
    });
  }

  function removeBlock(id: string) {
    setDeletePendingId(id);
    startBlocksTransition(async () => {
      const result = await deleteBlockedPeriodAction(blocksState, id);
      setBlocksState(result);
      if (result.success) {
        router.refresh();
      }
      setDeletePendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Seções de configuração do agendamento"
        className="flex flex-wrap gap-2"
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            label={tab.label}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {activeTab === "hours" ? (
        <section role="tabpanel" aria-labelledby="hours-tab" className="space-y-4">
          <Card className="bg-[var(--surface-subtle)]">
            <p className="text-sm text-[var(--muted)]">
              Configure os dias e intervalos de atendimento. O fuso horário da empresa é{" "}
              <strong>{weekSchedule.timezone}</strong>.
            </p>
          </Card>
          <div className="grid gap-4">
            {weekSchedule.days.map((day) => (
              <DayScheduleEditor
                key={day.weekday}
                day={day}
                fieldErrors={fieldErrors[day.weekday]}
                onChange={(next) =>
                  setWeekSchedule((current) => ({
                    ...current,
                    days: current.days.map((item) =>
                      item.weekday === next.weekday ? next : item,
                    ),
                  }))
                }
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={saveHours} disabled={hoursPending}>
              {hoursPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  Salvando...
                </>
              ) : (
                "Salvar horários"
              )}
            </Button>
            <Feedback state={hoursState} />
          </div>
        </section>
      ) : null}

      {activeTab === "blocks" ? (
        <section role="tabpanel" aria-labelledby="blocks-tab" className="space-y-4">
          <Card>
            <h2 className="text-lg font-semibold">Novo bloqueio</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium">
                <span>Tipo</span>
                <select
                  value={newBlock.blockType}
                  onChange={(event) =>
                    setNewBlock((current) => ({
                      ...current,
                      blockType: event.target.value as typeof current.blockType,
                    }))
                  }
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
                  aria-label="Tipo de bloqueio"
                >
                  {Object.entries(BLOCKED_PERIOD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline-flex items-center gap-2 self-end text-sm font-medium">
                <input
                  type="checkbox"
                  checked={newBlock.allDay}
                  onChange={(event) =>
                    setNewBlock((current) => ({ ...current, allDay: event.target.checked }))
                  }
                  className="size-4 rounded border"
                />
                Dia inteiro
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>Início</span>
                <Input
                  type="datetime-local"
                  value={newBlock.startsAt}
                  onChange={(event) =>
                    setNewBlock((current) => ({ ...current, startsAt: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                <span>Término</span>
                <Input
                  type="datetime-local"
                  value={newBlock.endsAt}
                  onChange={(event) =>
                    setNewBlock((current) => ({ ...current, endsAt: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium md:col-span-2">
                <span>Motivo</span>
                <Input
                  value={newBlock.reason}
                  onChange={(event) =>
                    setNewBlock((current) => ({ ...current, reason: event.target.value }))
                  }
                  placeholder="Ex.: férias, feriado, manutenção"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={createBlock} disabled={blocksPending}>
                {blocksPending ? (
                  <>
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                    Salvando...
                  </>
                ) : (
                  "Adicionar bloqueio"
                )}
              </Button>
              <Feedback state={blocksState} />
            </div>
          </Card>

          <div className="space-y-3">
            {configuration.blockedPeriods.length ? (
              configuration.blockedPeriods.map((block) => (
                <Card key={block.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        {BLOCKED_PERIOD_TYPE_LABELS[block.blockType]}
                      </p>
                      {block.allDay ? <Badge>Dia inteiro</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(block.startsAt))}
                      {" — "}
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(block.endsAt))}
                    </p>
                    {block.reason ? (
                      <p className="mt-2 text-sm">{block.reason}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={deletePendingId === block.id}
                    onClick={() => removeBlock(block.id)}
                    className="text-[var(--danger)]"
                  >
                    {deletePendingId === block.id ? (
                      <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                    ) : (
                      <Trash2 size={16} aria-hidden="true" />
                    )}
                    Remover
                  </Button>
                </Card>
              ))
            ) : (
              <Card className="py-10 text-center text-[var(--muted)]">
                Nenhum bloqueio cadastrado. Adicione férias, feriados ou indisponibilidades temporárias.
              </Card>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "general" ? (
        <section role="tabpanel" aria-labelledby="general-tab" className="space-y-4">
          <Card className="grid gap-4 md:grid-cols-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium md:col-span-2">
              <input
                type="checkbox"
                checked={settings.bookingEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    bookingEnabled: event.target.checked,
                  }))
                }
                className="size-4 rounded border"
              />
              Agendamento público habilitado
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              <span>Fluxo de confirmação</span>
              <select
                value={settings.bookingFlow}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    bookingFlow: event.target.value as typeof current.bookingFlow,
                  }))
                }
                className="h-11 w-full rounded-xl border bg-white px-3 text-sm"
              >
                <option value="instant_confirmation">Confirmação imediata</option>
                <option value="manual_approval">Aprovação manual</option>
                <option value="payment_required">Pagamento obrigatório</option>
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              <span>Antecedência mínima (minutos)</span>
              <Input
                type="number"
                min={0}
                max={10080}
                value={settings.minNoticeMinutes}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    minNoticeMinutes: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              <span>Antecedência máxima (dias)</span>
              <Input
                type="number"
                min={1}
                max={730}
                value={settings.horizonDays}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    horizonDays: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              <span>Intervalo entre horários (minutos)</span>
              <Input
                type="number"
                min={5}
                max={1440}
                step={5}
                value={settings.intervalMinutes}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    intervalMinutes: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              <span>Máximo de agendamentos por dia</span>
              <Input
                type="number"
                min={1}
                value={settings.maxAppointmentsPerDay ?? ""}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    maxAppointmentsPerDay: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
                placeholder="Sem limite"
              />
            </label>
          </Card>

          <Card className="grid gap-3 md:grid-cols-2">
            <h2 className="text-lg font-semibold md:col-span-2">Regras do fluxo</h2>
            {[
              {
                key: "allowCancellation" as const,
                label: "Permitir cancelamento",
              },
              {
                key: "allowReschedule" as const,
                label: "Permitir reagendamento",
              },
              {
                key: "requireObjective" as const,
                label: "Objetivo obrigatório",
              },
              {
                key: "requireNotes" as const,
                label: "Observações obrigatórias",
              },
            ].map((item) => (
              <label key={item.key} className="inline-flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={settings.preferences[item.key]}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      preferences: {
                        ...current.preferences,
                        [item.key]: event.target.checked,
                      },
                    }))
                  }
                  className="size-4 rounded border"
                />
                {item.label}
              </label>
            ))}
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={saveGeneral} disabled={generalPending}>
              {generalPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  Salvando...
                </>
              ) : (
                "Salvar configurações"
              )}
            </Button>
            <Feedback state={generalState} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
