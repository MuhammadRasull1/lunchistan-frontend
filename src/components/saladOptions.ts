import { LeafyGreen } from 'lucide-react'
import type { Salad } from '../types'

export const SALAD_OPTIONS: { value: Salad; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { value: 'Оливье', icon: LeafyGreen },
  { value: 'Винегрет', icon: LeafyGreen },
  { value: 'Цезарь', icon: LeafyGreen },
]
