import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDateTimeVE(date: Date | string) {
    const d = new Date(date);
    return new Intl.DateTimeFormat('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Caracas'
    }).format(d);
}

export function formatDateVE(date: Date | string) {
    const d = new Date(date);
    return new Intl.DateTimeFormat('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Caracas'
    }).format(d);
}

export function formatTimeVE(date: Date | string) {
    const d = new Date(date);
    return new Intl.DateTimeFormat('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Caracas'
    }).format(d);
}

export function formatCurrency(amount: number | string) {
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'USD'
    }).format(Number(amount));
}
