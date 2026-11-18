export const sectionId = (s: string): string => `menu-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
