import type { ServiceDTO } from "./types";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | string;
  duration_minutes: number;
  active: boolean;
  publicly_visible: boolean;
  display_order: number;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

export function mapService(row: ServiceRow): ServiceDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    priceCents: Math.round(Number(row.price) * 100),
    durationMinutes: row.duration_minutes,
    active: row.active,
    publiclyVisible: row.publicly_visible,
    displayOrder: row.display_order,
    imagePath: row.image_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    professionalId: null,
  };
}
