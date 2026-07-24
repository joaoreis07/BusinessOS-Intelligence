export type AiInsightTone = "info" | "warning" | "success" | "danger";

export type AiAlertDTO = {
  id: string;
  category: "finance" | "scheduling" | "customers" | "general";
  tone: AiInsightTone;
  title: string;
  description: string;
  href?: string;
};

export type AiRecommendationDTO = {
  id: string;
  category: "scheduling" | "customers" | "finance" | "marketing";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionLabel?: string;
  href?: string;
};

export type AiDailySummaryDTO = {
  headline: string;
  paragraphs: string[];
  highlights: Array<{ label: string; value: string }>;
};

export type AiWeeklyReportDTO = {
  periodLabel: string;
  sections: Array<{ title: string; body: string }>;
};

export type AiPageDTO = {
  generatedAt: string;
  dailySummary: AiDailySummaryDTO;
  alerts: AiAlertDTO[];
  recommendations: AiRecommendationDTO[];
  weeklyReport: AiWeeklyReportDTO;
};

export type AiPanelCapabilitiesDTO = {
  canRead: boolean;
  featureEnabled: boolean;
  scheduling: boolean;
  customers: boolean;
  finance: boolean;
};
