import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { Task } from '@/context/TaskContext';

// Funkcja renderowania gwiazdek trudności
export function renderStars(diff: Task['difficulty']) {
  const map: Record<Task['difficulty'], number> = { Łatwy: 1, Średni: 3, Trudny: 5 };
  const count = map[diff] ?? 3;

  return Array.from({ length: 5 }).map((_, i) => (
    <Ionicons
      key={i}
      name={i < count ? 'star' : 'star-outline'}
      size={16}
      color={i < count ? '#33c24d' : '#9aa8b2'}
      style={{ marginLeft: 2 }}
    />
  ));
}

// Funcja formatująca pozostały czas
export function formatLeft(ms: number) {
  if (ms <= 0) return '0 min';
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} dni`;
}

// Formatowanie terminu wykonania zadania
export function formatDateShort(date: Date | string) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}