import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, ExpenseClaim, Log } from '@/types';
import { getNextStatus } from '@/types';
import { mockUsers, mockClaims } from '@/data/mockData';

interface AppContextType {
    currentUser: User | null;
    users: User[];
    claims: ExpenseClaim[];
    switchUser: (userId: string) => void;
    createClaim: (claim: Omit<ExpenseClaim, 'id' | 'status' | 'logs' | 'createdAt'>) => void;
    approveClaim: (claimId: string, remarks: string, actorName: string) => void;
    rejectClaim: (claimId: string, remarks: string, actorName: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'expense-claim-data';

interface StorageData {
    currentUserId: string | null;
    claims: ExpenseClaim[];
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users] = useState<User[]>(mockUsers);
    const [claims, setClaims] = useState<ExpenseClaim[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const data: StorageData = JSON.parse(stored);
                setClaims(data.claims);
                if (data.currentUserId) {
                    const user = mockUsers.find(u => u.id === data.currentUserId);
                    if (user) setCurrentUser(user);
                }
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                setClaims(mockClaims);
            }
        } else {
            setClaims(mockClaims);
        }
    }, []);

    // Save to localStorage whenever claims or currentUser changes
    useEffect(() => {
        if (claims.length > 0) {
            const data: StorageData = {
                currentUserId: currentUser?.id || null,
                claims,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    }, [claims, currentUser]);

    const switchUser = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setCurrentUser(user);
        }
    };

    const createClaim = (claimData: Omit<ExpenseClaim, 'id' | 'status' | 'logs' | 'createdAt'>) => {
        if (!currentUser) return;

        const newClaim: ExpenseClaim = {
            ...claimData,
            id: `claim-${Date.now()}`,
            status: 'SUBMITTED',
            createdAt: new Date().toISOString(),
            logs: [
                {
                    stage: 'Employee',
                    action: 'SUBMIT',
                    remarks: 'Claim submitted for review',
                    timestamp: new Date().toISOString(),
                    actor: currentUser.name,
                },
            ],
        };

        setClaims(prev => [newClaim, ...prev]);
    };

    const approveClaim = (claimId: string, remarks: string, actorName: string) => {
        setClaims(prev => prev.map(claim => {
            if (claim.id !== claimId) return claim;

            const nextStatus = getNextStatus(claim.status);
            if (!nextStatus) return claim;

            const stageName = currentUser?.role === 'L1_ADMIN' ? 'L1 - Accounts' :
                currentUser?.role === 'L2_ADMIN' ? 'L2 - Finance' :
                    currentUser?.role === 'L3_ADMIN' ? 'L3 - CEO' :
                        currentUser?.role === 'L4_ADMIN' ? 'L4 - Final Admin' :
                            'Admin';

            const newLog: Log = {
                stage: stageName,
                action: 'APPROVE',
                remarks: remarks || 'Approved',
                timestamp: new Date().toISOString(),
                actor: actorName,
            };

            return {
                ...claim,
                status: nextStatus,
                logs: [...claim.logs, newLog],
            };
        }));
    };

    const rejectClaim = (claimId: string, remarks: string, actorName: string) => {
        setClaims(prev => prev.map(claim => {
            if (claim.id !== claimId) return claim;

            const stageName = currentUser?.role === 'L1_ADMIN' ? 'L1 - Accounts' :
                currentUser?.role === 'L2_ADMIN' ? 'L2 - Finance' :
                    currentUser?.role === 'L3_ADMIN' ? 'L3 - CEO' :
                        currentUser?.role === 'L4_ADMIN' ? 'L4 - Final Admin' :
                            'Admin';

            const newLog: Log = {
                stage: stageName,
                action: 'REJECT',
                remarks: remarks || 'Rejected',
                timestamp: new Date().toISOString(),
                actor: actorName,
            };

            return {
                ...claim,
                status: 'REJECTED',
                logs: [...claim.logs, newLog],
            };
        }));
    };

    const value: AppContextType = {
        currentUser,
        users,
        claims,
        switchUser,
        createClaim,
        approveClaim,
        rejectClaim,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
