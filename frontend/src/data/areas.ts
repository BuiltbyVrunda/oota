export const areas = [
  'Indiranagar', 'Koramangala', 'Jayanagar', 'HSR Layout', 'Malleshwaram',
  'Basavanagudi', 'Whitefield', 'Frazer Town', 'Ulsoor', 'Rajajinagar',
] as const
export type Area = (typeof areas)[number]
