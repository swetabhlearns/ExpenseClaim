import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { UserRole } from '@/types';
import { STATUS_TO_ROLE } from '@/types';
import { formatCurrency, formatDate, getStatusLabel, getStatusVariant } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle } from 'lucide-react';
import { ApprovalDialog } from '@/components/Admin/ApprovalDialog';

interface AdminDashboardProps {
    currentUser: {
        _id: Id<"users">;
        name: string;
        email: string;
        role: UserRole;
    };
}

export function AdminDashboard({ currentUser }: AdminDashboardProps) {
    const targetStatus = Object.entries(STATUS_TO_ROLE).find(([_, role]) => role === currentUser.role)?.[0] || null;
    const claims = useQuery(api.claims.getClaimsByStatus, targetStatus ? { status: targetStatus } : "skip");
    const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

    const pendingClaims = claims || [];

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Pending Approvals</h1>
                    <p className="text-muted-foreground mt-1">
                        Review and process claims awaiting your approval
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-3 animate-slide-up stagger-1">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingClaims.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting your review
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Claims Grid */}
            {!claims ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading claims...</p>
                </div>
            ) : pendingClaims.length === 0 ? (
                <Card className="animate-slide-up stagger-2">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Pending Claims</h3>
                        <p className="text-sm text-muted-foreground">
                            All claims have been processed. Check back later.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="rounded-lg border bg-card shadow-sm animate-slide-up stagger-2">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-heading">Claim ID</TableHead>
                                <TableHead className="font-heading">Employee</TableHead>
                                <TableHead className="font-heading">Title</TableHead>
                                <TableHead className="font-heading">Amount</TableHead>
                                <TableHead className="font-heading">Date</TableHead>
                                <TableHead className="font-heading">Status</TableHead>
                                <TableHead className="font-heading">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingClaims.map((claim) => (
                                <TableRow key={claim._id}>
                                    <TableCell className="font-mono text-xs">{claim._id}</TableCell>
                                    <TableCell className="font-medium">{claim.userName}</TableCell>
                                    <TableCell>{claim.title}</TableCell>
                                    <TableCell className="font-mono font-semibold">
                                        {formatCurrency(claim.amount)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(claim.date)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(claim.status)}>
                                            {getStatusLabel(claim.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedClaim(claim)}
                                        >
                                            Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Approval Dialog */}
            <ApprovalDialog
                claim={selectedClaim}
                currentUser={currentUser}
                open={!!selectedClaim}
                onOpenChange={(open: boolean) => !open && setSelectedClaim(null)}
            />
        </div>
    );
}
