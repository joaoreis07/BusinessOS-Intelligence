"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
} from "lucide-react";

import {
  createPublicAppointmentAction,
  getPublicAvailabilityAction,
  getPublicAvailableDatesAction,
} from "@/app/[slug]/agendar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { monthRange } from "@/features/scheduling/public/available-dates";
import { buildPublicCustomerFieldsSchema } from "@/features/scheduling/public/wizard-schemas";
import {
  BOOKING_WIZARD_STEPS,
  type BookingWizardStep,
} from "@/features/scheduling/public/wizard-types";
import type {
  PublicBookingCompanyDTO,
  PublicBookingSchedulingDTO,
  PublicBookingServiceDTO,
} from "@/features/scheduling/types";
import { cn, formatCurrencyFromCents } from "@/lib/utils";

type BookingWizardProps = {
  company: PublicBookingCompanyDTO;
  services: PublicBookingServiceDTO[];
  scheduling: PublicBookingSchedulingDTO;
  initialServiceId?: string;
};

const STEP_LABELS: Record<BookingWizardStep, string> = {
  service: "Serviço",
  date: "Data",
  time: "Horário",
  customer: "Seus dados",
  confirm: "Confirmação",
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function stepIndex(step: BookingWizardStep) {
  return BOOKING_WIZARD_STEPS.indexOf(step);
}

function formatTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso));
}

function formatLongDate(date: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(`${date}T12:00:00Z`));
}

function buildCalendarCells(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<{ day: number | null; date: string | null }> = [];

  for (let index = 0; index < firstDay; index += 1) {
    cells.push({ day: null, date: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, date });
  }

  return cells;
}

export function BookingWizard({
  company,
  services,
  scheduling,
  initialServiceId,
}: BookingWizardProps) {
  const { timezone, preferences } = scheduling;
  const primaryColor = company.primaryColor ?? "var(--primary)";

  const [step, setStep] = useState<BookingWizardStep>("service");
  const [serviceId, setServiceId] = useState(
    services.some((service) => service.id === initialServiceId) ? initialServiceId! : "",
  );
  const [date, setDate] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [objective, setObjective] = useState("");
  const [notes, setNotes] = useState("");

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const [message, setMessage] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [submitLocked, setSubmitLocked] = useState(false);
  const [pending, startTransition] = useTransition();
  const submitLockRef = useRef(false);

  const selectedService = services.find((service) => service.id === serviceId);
  const currentStepIndex = stepIndex(step);
  const progress = ((currentStepIndex + 1) / BOOKING_WIZARD_STEPS.length) * 100;

  const customerSchema = useMemo(
    () => buildPublicCustomerFieldsSchema(preferences),
    [preferences],
  );

  const loadAvailableDates = useCallback(
    (year: number, month: number, nextServiceId = serviceId) => {
      if (!nextServiceId) return;
      const range = monthRange(year, month);
      startTransition(async () => {
        const result = await getPublicAvailableDatesAction({
          slug: company.slug,
          serviceId: nextServiceId,
          dateFrom: range.dateFrom,
          dateTo: range.dateTo,
        });
        setAvailableDates(result.data);
        setMessage(result.error);
      });
    },
    [company.slug, serviceId],
  );

  const loadTimes = useCallback(
    (nextDate: string, nextServiceId = serviceId, advanceToTimeStep = false) => {
      setDate(nextDate);
      setStartsAt("");
      setTimes([]);
      setMessage(undefined);
      if (!nextDate || !nextServiceId) return;

      startTransition(async () => {
        const result = await getPublicAvailabilityAction({
          slug: company.slug,
          serviceId: nextServiceId,
          date: nextDate,
        });
        setTimes(result.data);
        setMessage(result.error);
        if (advanceToTimeStep && result.data.length && !result.error) {
          setStep("time");
        }
      });
    },
    [company.slug, serviceId],
  );

  useEffect(() => {
    if (step === "date" && serviceId) {
      loadAvailableDates(calendarMonth.year, calendarMonth.month);
    }
  }, [step, serviceId, calendarMonth.year, calendarMonth.month, loadAvailableDates]);

  const calendarCells = useMemo(
    () => buildCalendarCells(calendarMonth.year, calendarMonth.month),
    [calendarMonth.year, calendarMonth.month],
  );

  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);

  function goNext() {
    setMessage(undefined);
    setFieldErrors({});

    if (step === "service") {
      if (!serviceId) {
        setMessage("Selecione um serviço para continuar.");
        return;
      }
      setStep("date");
      return;
    }

    if (step === "date") {
      if (!date) {
        setMessage("Selecione uma data disponível.");
        return;
      }
      setStep("time");
      return;
    }

    if (step === "time") {
      if (!startsAt) {
        setMessage("Selecione um horário disponível.");
        return;
      }
      setStep("customer");
      return;
    }

    if (step === "customer") {
      const parsed = customerSchema.safeParse({
        customerName,
        customerPhone,
        customerEmail,
        objective: objective || null,
        notes: notes || null,
      });
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? "form");
          if (!errors[key]) errors[key] = issue.message;
        }
        setFieldErrors(errors);
        setMessage("Revise os campos destacados.");
        return;
      }
      setStep("confirm");
    }
  }

  function goBack() {
    setMessage(undefined);
    setFieldErrors({});
    const index = stepIndex(step);
    if (index > 0) {
      setStep(BOOKING_WIZARD_STEPS[index - 1]!);
    }
  }

  function confirmBooking() {
    if (submitLockRef.current || pending) return;
    setMessage(undefined);

    const parsed = customerSchema.safeParse({
      customerName,
      customerPhone,
      customerEmail,
      objective: objective || null,
      notes: notes || null,
    });
    if (!parsed.success || !serviceId || !startsAt) {
      setMessage("Não foi possível validar os dados. Volte e revise as etapas.");
      return;
    }

    submitLockRef.current = true;
    setSubmitLocked(true);
    startTransition(async () => {
      const result = await createPublicAppointmentAction({
        slug: company.slug,
        serviceId,
        startsAt,
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        customerEmail: parsed.data.customerEmail,
        objective: parsed.data.objective,
        notes: parsed.data.notes,
      });

      if (result.success) {
        setConfirmed(true);
      } else {
        submitLockRef.current = false;
        setSubmitLocked(false);
        setMessage(result.error ?? "Não foi possível confirmar o agendamento.");
      }
    });
  }

  function shiftMonth(delta: number) {
    setCalendarMonth((current) => {
      let nextMonth = current.month + delta;
      let nextYear = current.year;
      if (nextMonth < 1) {
        nextMonth = 12;
        nextYear -= 1;
      } else if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      return { year: nextYear, month: nextMonth };
    });
  }

  if (!scheduling.bookingEnabled) {
    return (
      <UnavailableState
        title="Agendamento indisponível"
        description="Esta empresa não está aceitando agendamentos online no momento."
        company={company}
      />
    );
  }

  if (!services.length) {
    return (
      <UnavailableState
        title="Nenhum serviço disponível"
        description="Não há serviços publicados para agendamento no momento."
        company={company}
      />
    );
  }

  if (confirmed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4">
        <section
          aria-labelledby="booking-success-title"
          className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-sm sm:p-10"
        >
          <CheckCircle2 className="mx-auto text-[var(--success)]" size={52} aria-hidden />
          <h1 id="booking-success-title" className="mt-6 text-2xl font-bold sm:text-3xl">
            Agendamento confirmado
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Seu horário foi reservado com {company.name}. Você receberá mais informações em breve.
          </p>
          {selectedService && date && startsAt ? (
            <p className="mt-4 rounded-xl bg-[var(--surface-subtle)] p-4 text-sm">
              {selectedService.name} — {formatLongDate(date, timezone)} às{" "}
              {formatTime(startsAt, timezone)}
            </p>
          ) : null}
          <Link
            href={`/${company.slug}`}
            className="mt-8 inline-flex h-11 items-center rounded-xl px-5 font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Voltar para o site
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header
        className="relative overflow-hidden py-10 text-white sm:py-14"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, color-mix(in srgb, ${primaryColor} 72%, #000) 100%)`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(255,255,255,0.35), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <Link
            href={`/${company.slug}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/75 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} aria-hidden />
            Voltar para o site
          </Link>
          <p className="text-sm font-medium text-white/80">{company.name}</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
            Agendar atendimento
          </h1>
          {(company.city || company.state) && (
            <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-sm text-white/80">
              <MapPin size={14} aria-hidden />
              {[company.city, company.state].filter(Boolean).join(" — ")}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav aria-label="Progresso do agendamento" className="mb-8">
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-white shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: primaryColor }}
              role="progressbar"
              aria-valuenow={currentStepIndex + 1}
              aria-valuemin={1}
              aria-valuemax={BOOKING_WIZARD_STEPS.length}
              aria-label={`Etapa ${currentStepIndex + 1} de ${BOOKING_WIZARD_STEPS.length}`}
            />
          </div>
          <ol className="flex flex-wrap gap-2 text-xs font-medium sm:text-sm">
            {BOOKING_WIZARD_STEPS.map((wizardStep, index) => (
              <li
                key={wizardStep}
                aria-current={wizardStep === step ? "step" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 transition-colors",
                  index <= currentStepIndex
                    ? "text-white shadow-sm"
                    : "bg-white text-[var(--muted)]",
                )}
                style={
                  index <= currentStepIndex ? { backgroundColor: primaryColor } : undefined
                }
              >
                {index + 1}. {STEP_LABELS[wizardStep]}
              </li>
            ))}
          </ol>
        </nav>

        <section
          aria-labelledby="wizard-step-title"
          className="rounded-[1.75rem] border border-[var(--border)] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8"
        >
          {step === "service" && (
            <>
              <h2 id="wizard-step-title" className="text-xl font-semibold">
                Escolha o serviço
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Selecione o atendimento que deseja agendar.
              </p>
              <div className="mt-6 space-y-3" role="radiogroup" aria-label="Serviços disponíveis">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={cn(
                      "block cursor-pointer rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-offset-2",
                      serviceId === service.id
                        ? "border-[var(--primary)] bg-[var(--accent)]"
                        : "hover:bg-[var(--surface-subtle)]",
                    )}
                  >
                    <input
                      type="radio"
                      name="service"
                      value={service.id}
                      checked={serviceId === service.id}
                      onChange={() => {
                        setServiceId(service.id);
                        setDate("");
                        setStartsAt("");
                        setTimes([]);
                      }}
                      className="sr-only"
                    />
                    <span className="flex items-start justify-between gap-4">
                      <span>
                        <span className="block font-semibold">{service.name}</span>
                        {service.description ? (
                          <span className="mt-1 block text-sm text-[var(--muted)]">
                            {service.description}
                          </span>
                        ) : null}
                      </span>
                      {service.priceCents > 0 ? (
                        <span className="whitespace-nowrap font-semibold text-[var(--primary)]">
                          {formatCurrencyFromCents(service.priceCents)}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                      <Clock3 size={14} aria-hidden /> {service.durationMinutes} min
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}

          {step === "date" && (
            <>
              <h2 id="wizard-step-title" className="text-xl font-semibold">
                Escolha a data
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Apenas datas com horários disponíveis podem ser selecionadas.
              </p>
              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => shiftMonth(-1)}
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft size={18} />
                  </Button>
                  <p className="font-semibold capitalize">
                    {new Intl.DateTimeFormat("pt-BR", {
                      month: "long",
                      year: "numeric",
                    }).format(new Date(Date.UTC(calendarMonth.year, calendarMonth.month - 1, 1)))}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => shiftMonth(1)}
                    aria-label="Próximo mês"
                  >
                    <ChevronRight size={18} />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--muted)]">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="py-2">
                      {label}
                    </div>
                  ))}
                </div>

                {pending && !availableDates.length ? (
                  <p className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                    <Loader2 className="animate-spin" size={16} aria-hidden />
                    Carregando datas disponíveis...
                  </p>
                ) : (
                  <div
                    className="mt-2 grid grid-cols-7 gap-1"
                    role="grid"
                    aria-label="Calendário de datas disponíveis"
                  >
                    {calendarCells.map((cell, index) => {
                      if (!cell.day || !cell.date) {
                        return <div key={`empty-${index}`} role="gridcell" aria-hidden />;
                      }
                      const isAvailable = availableDateSet.has(cell.date);
                      const isSelected = date === cell.date;
                      return (
                        <button
                          key={cell.date}
                          type="button"
                          role="button"
                          disabled={!isAvailable || pending}
                          aria-pressed={isSelected}
                          aria-label={`${cell.day} de ${STEP_LABELS.date}${isAvailable ? ", disponível" : ", indisponível"}`}
                          onClick={() => {
                            if (cell.date && isAvailable) loadTimes(cell.date, serviceId, true);
                          }}
                          className={cn(
                            "aspect-square rounded-xl text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-30",
                            isSelected
                              ? "scale-105 text-white shadow-md"
                              : isAvailable
                                ? "bg-[var(--accent)] text-[var(--foreground)] hover:scale-105 hover:shadow-sm"
                                : "text-[var(--muted)]/50",
                          )}
                          style={isSelected ? { backgroundColor: primaryColor } : undefined}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                  </div>
                )}

                {!pending && availableDates.length === 0 ? (
                  <p className="mt-6 text-sm text-[var(--muted)]" role="status">
                    Nenhuma data disponível neste mês. Tente outro mês ou serviço.
                  </p>
                ) : null}

                {date ? (
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
                    <CalendarDays size={16} aria-hidden />
                    {formatLongDate(date, timezone)}
                  </p>
                ) : null}
              </div>
            </>
          )}

          {step === "time" && (
            <>
              <h2 id="wizard-step-title" className="text-xl font-semibold">
                Escolha o horário
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Horários exibidos conforme disponibilidade real da empresa.
              </p>
              {pending ? (
                <p className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Loader2 className="animate-spin" size={16} aria-hidden />
                  Consultando horários...
                </p>
              ) : times.length ? (
                <div
                  className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4"
                  role="listbox"
                  aria-label="Horários disponíveis"
                >
                  {times.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      role="option"
                      aria-selected={startsAt === slot}
                      onClick={() => setStartsAt(slot)}
                      className={cn(
                        "h-11 rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                        startsAt === slot
                          ? "border-transparent text-white"
                          : "hover:border-[var(--primary)]",
                      )}
                      style={
                        startsAt === slot ? { backgroundColor: primaryColor } : undefined
                      }
                    >
                      {formatTime(slot, timezone)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-[var(--muted)]" role="status">
                  Nenhum horário disponível nesta data.
                </p>
              )}
            </>
          )}

          {step === "customer" && (
            <>
              <h2 id="wizard-step-title" className="text-xl font-semibold">
                Seus dados
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Usaremos estas informações para confirmar seu agendamento.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nome completo"
                  name="customerName"
                  value={customerName}
                  onChange={setCustomerName}
                  error={fieldErrors.customerName}
                  autoComplete="name"
                  required
                />
                <Field
                  label="Telefone / WhatsApp"
                  name="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={setCustomerPhone}
                  error={fieldErrors.customerPhone}
                  autoComplete="tel"
                  required
                />
                <Field
                  label="E-mail"
                  name="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={setCustomerEmail}
                  error={fieldErrors.customerEmail}
                  autoComplete="email"
                  required
                  className="sm:col-span-2"
                />
                <Field
                  label={
                    preferences.requireObjective
                      ? "Objetivo do atendimento"
                      : "Objetivo do atendimento (opcional)"
                  }
                  name="objective"
                  value={objective}
                  onChange={setObjective}
                  error={fieldErrors.objective}
                  required={preferences.requireObjective}
                  className="sm:col-span-2"
                />
                <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                  <span>
                    {preferences.requireNotes ? "Observações" : "Observações (opcional)"}
                  </span>
                  <textarea
                    name="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border bg-white px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-2 focus:outline-offset-1"
                    aria-invalid={Boolean(fieldErrors.notes)}
                    aria-describedby={fieldErrors.notes ? "notes-error" : undefined}
                    required={preferences.requireNotes}
                  />
                  {fieldErrors.notes ? (
                    <span id="notes-error" className="text-xs text-[var(--danger)]">
                      {fieldErrors.notes}
                    </span>
                  ) : null}
                </label>
              </div>
            </>
          )}

          {step === "confirm" && selectedService && date && startsAt && (
            <>
              <h2 id="wizard-step-title" className="text-xl font-semibold">
                Confirme seu agendamento
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Revise os detalhes antes de confirmar.
              </p>
              <dl className="mt-6 space-y-4 rounded-xl bg-[var(--surface-subtle)] p-5 text-sm">
                <SummaryRow label="Empresa" value={company.name} />
                <SummaryRow label="Serviço" value={selectedService.name} />
                <SummaryRow label="Data" value={formatLongDate(date, timezone)} />
                <SummaryRow label="Horário" value={formatTime(startsAt, timezone)} />
                <SummaryRow label="Duração" value={`${selectedService.durationMinutes} min`} />
                {selectedService.priceCents > 0 ? (
                  <SummaryRow
                    label="Valor"
                    value={formatCurrencyFromCents(selectedService.priceCents)}
                  />
                ) : null}
                <SummaryRow label="Nome" value={customerName} />
                <SummaryRow label="Telefone" value={customerPhone} />
                <SummaryRow label="E-mail" value={customerEmail} />
                {objective ? <SummaryRow label="Objetivo" value={objective} /> : null}
                {notes ? <SummaryRow label="Observações" value={notes} /> : null}
              </dl>
            </>
          )}

          {message ? (
            <p role="alert" className="mt-6 text-sm text-[var(--danger)]">
              {message}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {currentStepIndex > 0 ? (
              <Button type="button" variant="secondary" onClick={goBack} disabled={pending}>
                <ArrowLeft size={16} aria-hidden />
                Voltar
              </Button>
            ) : (
              <Link
                href={`/${company.slug}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold"
              >
                <ArrowLeft size={16} aria-hidden />
                Voltar ao site
              </Link>
            )}

            {step === "confirm" ? (
              <Button
                type="button"
                onClick={confirmBooking}
                disabled={pending || submitLocked}
                className="h-12 sm:min-w-48"
                aria-busy={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} aria-hidden />
                    Confirmando...
                  </>
                ) : (
                  "Confirmar agendamento"
                )}
              </Button>
            ) : (
              <Button type="button" onClick={goNext} disabled={pending} className="h-12 sm:min-w-40">
                Próximo
                <ArrowRight size={16} aria-hidden />
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  required,
  className,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
}) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <label className={cn("space-y-1.5 text-sm font-medium", className)}>
      <span>{label}</span>
      <Input
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
      />
      {error ? (
        <span id={errorId} className="text-xs text-[var(--danger)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function UnavailableState({
  title,
  description,
  company,
}: {
  title: string;
  description: string;
  company: PublicBookingCompanyDTO;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4">
      <section className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-sm sm:p-10">
        <CalendarDays className="mx-auto text-[var(--muted)]" size={48} aria-hidden />
        <h1 className="mt-6 text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-[var(--muted)]">{description}</p>
        <Link
          href={`/${company.slug}`}
          className="mt-8 inline-flex h-11 items-center rounded-xl bg-[var(--primary)] px-5 font-semibold text-white"
        >
          Voltar para {company.name}
        </Link>
      </section>
    </main>
  );
}
