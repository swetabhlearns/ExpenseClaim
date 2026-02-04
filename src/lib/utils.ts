import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`
}

export function formatDate(date: string): string {
    const d = new Date(date)
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

export function formatDateTime(date: string): string {
    const d = new Date(date)
    return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'SUBMITTED': 'Pending L1 - Accounts',
        'APPROVED_L1': 'Pending L2 - Finance',
        'APPROVED_L2': 'Pending L3 - CEO',
        'APPROVED_L3': 'Pending L4 - Final',
        'DISBURSED': 'Disbursed',
        'REJECTED': 'Rejected',
    }
    return labels[status] || status
}

export function getStatusVariant(status: string): 'submitted' | 'pending' | 'approved' | 'rejected' | 'disbursed' {
    if (status === 'SUBMITTED') return 'submitted'
    if (status === 'REJECTED') return 'rejected'
    if (status === 'DISBURSED') return 'disbursed'
    if (status.startsWith('APPROVED')) return 'pending'
    return 'pending'
}
