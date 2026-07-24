export type PlatformMetricsDTO = {
  companies: number;
  activeCompanies: number;
  trialCompanies: number;
  totalSubscriptions: number;
  mrrCents: number;
  arrCents: number;
};

export type PlatformCompanyListItemDTO = {
  id: string;
  name: string;
  slug: string;
  status: string;
  active: boolean;
  createdAt: string;
};

export type PlatformUserListItemDTO = {
  id: string;
  fullName: string;
  phone: string | null;
  createdAt: string;
  platformRole: string | null;
};

export type PlatformSubscriptionListItemDTO = {
  id: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  planName: string;
  status: string;
  currentPeriodEndsAt: string | null;
  nextPaymentAt: string | null;
};

export type PlatformActivityLogDTO = {
  id: string;
  companyId: string | null;
  actorUserId: string | null;
  action: string;
  module: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
};

export type PaginatedPlatformCompaniesDTO = {
  items: PlatformCompanyListItemDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedPlatformUsersDTO = {
  items: PlatformUserListItemDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedPlatformSubscriptionsDTO = {
  items: PlatformSubscriptionListItemDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedPlatformLogsDTO = {
  items: PlatformActivityLogDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PlatformOverviewDTO = {
  metrics: PlatformMetricsDTO;
  recentCompanies: PlatformCompanyListItemDTO[];
};
