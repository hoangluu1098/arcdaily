import {
  Utensils,
  Coffee,
  Bus,
  ShoppingBag,
  House,
  Receipt,
  HeartPulse,
  Ellipsis,
  type LucideIcon,
} from 'lucide-react'

export type CategoryId =
  | 'food'
  | 'coffee'
  | 'transport'
  | 'shopping'
  | 'household'
  | 'bills'
  | 'health'
  | 'other'

export interface Category {
  id: CategoryId
  label: string
  icon: LucideIcon
}

export const CATEGORIES: Category[] = [
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'coffee', label: 'Coffee', icon: Coffee },
  { id: 'transport', label: 'Transport', icon: Bus },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'household', label: 'Household', icon: House },
  { id: 'bills', label: 'Bills', icon: Receipt },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'other', label: 'Other', icon: Ellipsis },
]

export function categoryOf(id: CategoryId | null | undefined): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
