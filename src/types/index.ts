export type ClaimStatus = 'SUBMITTED' | 'APPROVED_L1' | 'APPROVED_L2' | 'APPROVED_L3' | 'DISBURSED' | 'REJECTED';
export type UserRole = 'USER' | 'L1_ADMIN' | 'L2_ADMIN' | 'L3_ADMIN' | 'L4_ADMIN';
export type ActionType = 'SUBMIT' | 'APPROVE' | 'REJECT';

export interface Log {
    stage: string;
    action: ActionType;
    remarks: string;
    timestamp: string;
    actor: string;
}

export interface ExpenseClaim {
    id: string;
    userId: string;
    userName: string;
    title: string;
    amount: number;
    description: string;
    date: string;
    status: ClaimStatus;
    logs: Log[];
    createdAt: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export const ROLE_NAMES: Record<UserRole, string> = {
    'USER': 'Employee',
    'L1_ADMIN': 'L1 - Accounts',
    'L2_ADMIN': 'L2 - Finance',
    'L3_ADMIN': 'L3 - CEO',
    'L4_ADMIN': 'L4 - Final Admin',
};

export const STATUS_TO_ROLE: Record<ClaimStatus, UserRole | null> = {
    'SUBMITTED': 'L1_ADMIN',
    'APPROVED_L1': 'L2_ADMIN',
    'APPROVED_L2': 'L3_ADMIN',
    'APPROVED_L3': 'L4_ADMIN',
    'DISBURSED': null,
    'REJECTED': null,
};

export function getNextStatus(currentStatus: ClaimStatus): ClaimStatus | null {
    const transitions: Record<ClaimStatus, ClaimStatus | null> = {
        'SUBMITTED': 'APPROVED_L1',
        'APPROVED_L1': 'APPROVED_L2',
        'APPROVED_L2': 'APPROVED_L3',
        'APPROVED_L3': 'DISBURSED',
        'DISBURSED': null,
        'REJECTED': null,
    };
    return transitions[currentStatus];
}

export function canUserReviewClaim(userRole: UserRole, claimStatus: ClaimStatus): boolean {
    return STATUS_TO_ROLE[claimStatus] === userRole;
}
