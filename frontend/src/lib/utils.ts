import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

export const formatDateFr = (date: Date | string | number) => {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatNumberAsFractionOrDecimal = (value: number) => {
  if (value <= 1) {
    const denom = Math.max(1, Math.round(1 / value));
    return `1/${denom}`;
  }
  const fixed = value < 10 ? value.toFixed(2) : value.toFixed(0);
  return fixed.replace(/\.00$/, '');
};

export const createLogSpacedValues = (min: number, max: number, count: number) => {
  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const v = 10 ** (minLog + t * (maxLog - minLog));
    return Number(v.toPrecision(4));
  });
};
