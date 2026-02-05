import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { UserRole, ClaimStatus } from '@/types';
import { STATUS_TO_ROLE } from '@/types';
import { formatCurrency, formatDate, getStatusLabel, getStatusVariant } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
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
    // Fetch all claims to filter them by category
    const allClaims = useQuery(api.claims.getAllClaims);
    const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

    // Determine which status this admin reviews
    const targetStatus = Object.entries(STATUS_TO_ROLE).find(([_, role]) => role === currentUser.role)?.[0] as ClaimStatus | undefined;

    // Categorize claims based on admin role
    const { pendingClaims, acceptedClaims, rejectedClaims } = useMemo(() => {
        if (!allClaims) {
            return { pendingClaims: [], acceptedClaims: [], rejectedClaims: [] };
        }

        const pending: typeof allClaims = [];
        const accepted: typeof allClaims = [];
        const rejected: typeof allClaims = [];

        allClaims.forEach(claim => {
            // Rejected claims go to rejected category
            if (claim.status === 'REJECTED') {
                rejected.push(claim);
            }
            // Pending: claims awaiting this admin's review
            else if (claim.status === targetStatus) {
                pending.push(claim);
            }
            // Accepted: claims that were approved by this admin level
            else {
                // Check if this claim was processed (approved) by this admin level
                const adminApprovedStatuses = getAcceptedStatusesForRole(currentUser.role);
                if (adminApprovedStatuses.includes(claim.status)) {
                    accepted.push(claim);
                }
            }
        });

        return { pendingClaims: pending, acceptedClaims: accepted, rejectedClaims: rejected };
    }, [allClaims, targetStatus, currentUser.role]);

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Claims Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Review and track expense claims
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-3 animate-slide-up stagger-1">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingClaims.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting your review
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{acceptedClaims.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Approved claims
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rejectedClaims.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Declined claims
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            {!allClaims ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading claims...</p>
                </div>
            ) : (
                <Tabs defaultValue="pending" className="animate-slide-up stagger-2">
                    <TabsList className="grid w-full md:w-[400px] grid-cols-3">
                        <TabsTrigger value="pending" className="gap-2">
                            <Clock className="h-4 w-4" />
                            Pending
                            {pendingClaims.length > 0 && (
                                <Badge variant="secondary" className="ml-1">{pendingClaims.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="accepted" className="gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Accepted
                            {acceptedClaims.length > 0 && (
                                <Badge variant="secondary" className="ml-1">{acceptedClaims.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="gap-2">
                            <XCircle className="h-4 w-4" />
                            Rejected
                            {rejectedClaims.length > 0 && (
                                <Badge variant="secondary" className="ml-1">{rejectedClaims.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending">
                        <ClaimsTable
                            claims={pendingClaims}
                            onReview={setSelectedClaim}
                            emptyMessage="No pending claims"
                            emptyDescription="All claims have been processed. Check back later."
                            showActions={true}
                        />
                    </TabsContent>

                    <TabsContent value="accepted">
                        <ClaimsTable
                            claims={acceptedClaims}
                            onReview={setSelectedClaim}
                            emptyMessage="No accepted claims"
                            emptyDescription="Claims you approve will appear here."
                            showActions={false}
                        />
                    </TabsContent>

                    <TabsContent value="rejected">
                        <ClaimsTable
                            claims={rejectedClaims}
                            onReview={setSelectedClaim}
                            emptyMessage="No rejected claims"
                            emptyDescription="Rejected claims will appear here."
                            showActions={false}
                        />
                    </TabsContent>
                </Tabs>
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

// Helper function to determine which statuses represent "accepted" for each role
function getAcceptedStatusesForRole(role: UserRole): ClaimStatus[] {
    const statusMap: Record<UserRole, ClaimStatus[]> = {
        'L1_ADMIN': ['APPROVED_L1', 'APPROVED_L2', 'APPROVED_L3', 'DISBURSED'],
        'L2_ADMIN': ['APPROVED_L2', 'APPROVED_L3', 'DISBURSED'],
        'L3_ADMIN': ['APPROVED_L3', 'DISBURSED'],
        'L4_ADMIN': ['DISBURSED'],
        'USER': [], // Regular users don't have accepted claims
    };
    return statusMap[role] || [];
}

// Reusable Claims Table Component
interface ClaimsTableProps {
    claims: any[];
    onReview: (claim: any) => void;
    emptyMessage: string;
    emptyDescription: string;
    showActions: boolean;
}

function ClaimsTable({ claims, onReview, emptyMessage, emptyDescription, showActions }: ClaimsTableProps) {
    if (claims.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{emptyMessage}</h3>
                    <p className="text-sm text-muted-foreground">{emptyDescription}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="rounded-lg border bg-card shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="font-heading">Claim ID</TableHead>
                        <TableHead className="font-heading">Employee</TableHead>
                        <TableHead className="font-heading">Title</TableHead>
                        <TableHead className="font-heading">Amount</TableHead>
                        <TableHead className="font-heading">Date</TableHead>
                        <TableHead className="font-heading">Status</TableHead>
                        {showActions && <TableHead className="font-heading">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {claims.map((claim) => (
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
                            {showActions && (
                                <TableCell>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onReview(claim)}
                                    >
                                        Review
                                    </Button>
                                </TableCell>
                            )}
                            {!showActions && (
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onReview(claim)}
                                    >
                                        View
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
