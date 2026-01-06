/**
 * ServiceCategory - Type matching the GraphQL ServiceCategory model
 */
export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  iconName: string;
  description: string | null;
  basePrice: number;
  hourlyRate: number;
  estimatedHours: number;
  active: boolean;
}
