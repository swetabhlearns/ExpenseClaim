import type { Id } from '../../../convex/_generated/dataModel';
import type { UserRole } from '@/types';
import { ROLE_NAMES } from '@/types';
import { Button } from '@/components/ui/button';
import { FileText, LogOut, BarChart3, LayoutDashboard } from 'lucide-react';

interface HeaderProps {
    currentUser: {
        _id: Id<"users">;
        name: string;
        email: string;
        role: UserRole;
    };
    setCurrentUserId: (userId: string | null) => void;
    currentPage: 'dashboard' | 'super-dashboard';
    setCurrentPage: (page: 'dashboard' | 'super-dashboard') => void;
}

export function Header({ currentUser, setCurrentUserId, currentPage, setCurrentPage }: HeaderProps) {
    const handleLogout = () => {
        setCurrentUserId(null);
    };

    const canAccessSuperDashboard = currentUser.role === 'L3_ADMIN';

    return (
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30 sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-heading font-bold text-lg">Expense Claims</h1>
                            <p className="text-xs text-muted-foreground">Four-Tier Approval System</p>
                        </div>
                    </div>

                    {/* Navigation & User Info */}
                    <div className="flex items-center gap-4">
                        {/* Navigation Tabs (only for L3_ADMIN) */}
                        {canAccessSuperDashboard && (
                            <div className="flex items-center gap-2 border-r pr-4">
                                <Button
                                    variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setCurrentPage('dashboard')}
                                    className="gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Button>
                                <Button
                                    variant={currentPage === 'super-dashboard' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setCurrentPage('super-dashboard')}
                                    className="gap-2"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    Analytics
                                </Button>
                            </div>
                        )}

                        <div className="text-right">
                            <p className="text-sm font-medium">{currentUser.name}</p>
                            <p className="text-xs text-muted-foreground">{ROLE_NAMES[currentUser.role]}</p>
                        </div>

                        {/* Logout */}
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
