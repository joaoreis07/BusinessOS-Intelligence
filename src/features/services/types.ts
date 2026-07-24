export type ServiceDTO = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  priceCents: number;
  durationMinutes: number;
  active: boolean;
  publiclyVisible: boolean;
  displayOrder: number;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  /** Reserved for assigned professional. */
  professionalId?: string | null;
};
