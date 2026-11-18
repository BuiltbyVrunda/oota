import type { Flavour } from '../types'

export const flavours: { id: Flavour; label: string; hint: string }[] = [
  { id: 'spicy', label: 'Spicy', hint: 'Heat that builds' },
  { id: 'tangy', label: 'Tangy', hint: 'Tamarind, kokum, lime' },
  { id: 'sweet', label: 'Sweet', hint: 'Jaggery to tiramisu' },
  { id: 'creamy', label: 'Creamy', hint: 'Butter, coconut, cream' },
  { id: 'smoky', label: 'Smoky', hint: 'Tandoor and grill' },
  { id: 'mild', label: 'Mild', hint: 'Gentle, low heat' },
  { id: 'rich', label: 'Rich', hint: 'Ghee, slow gravies' },
  { id: 'fresh', label: 'Fresh', hint: 'Greens, herbs, citrus' },
  { id: 'crispy', label: 'Crispy', hint: 'Dosa edges, fried crunch' },
  { id: 'comforting', label: 'Comforting', hint: 'Rasam rice energy' },
]

export const allergenOptions = ['nuts', 'dairy', 'gluten', 'egg', 'shellfish', 'soy'] as const

export const flavourLabel = (f: Flavour): string => flavours.find((x) => x.id === f)?.label ?? f
