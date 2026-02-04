import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { UserRole } from '@/types';
import { formatCurrency, formatDate, getStatusLabel, getStatusVariant } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { CreateClaimDialog } from '@/components/Employee/CreateClaimDialog';
import { ClaimDetailsDialog } from '@/components/Employee/ClaimDetailsDialog';

interface EmployeeDashboardProps {
    currentUser: {
        _id: Id<"users">;
        name: string;
        email: string;
        role: UserRole;
    };
}

export function EmployeeDashboard({ currentUser }: EmployeeDashboardProps) {
    const claims = useQuery(api.claims.getClaimsByUser, { userId: currentUser._id });
    const createClaimMutation = useMutation(api.claims.createClaim);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

    const handleCreateClaim = async (data: { title: string; amount: number; description: string; date: string }) => {
        await createClaimMutation({
            userId: currentUser._id,
            userName: currentUser.name,
            ...data,
        });
        setCreateDialogOpen(false);
    };

    if (!claims) {
        return (
            <div className="container mx-auto p-6">
                <p className="text-muted-foreground">Loading claims...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <h1 className="text-3xl font-heading font-bold">My Claims</h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage your expense claims
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Claim
                </Button>
            </div>

            {/* Claims Table */}
            <div className="rounded-lg border bg-card shadow-sm animate-slide-up stagger-1">
                {claims.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-muted-foreground mb-4">No claims yet</p>
                        <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Claim
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-heading">Claim ID</TableHead>
                                <TableHead className="font-heading">Title</TableHead>
                                <TableHead className="font-heading">Amount</TableHead>
                                <TableHead className="font-heading">Date</TableHead>
                                <TableHead className="font-heading">Status</TableHead>
                                <TableHead className="font-heading">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {claims.map((claim) => (
                                <TableRow
                                    key={claim._id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelectedClaim(claim)}
                                >
                                    <TableCell className="font-mono text-xs">{claim._id}</TableCell>
                                    <TableCell className="font-medium">{claim.title}</TableCell>
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedClaim(claim);
                                            }}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Dialogs */}
            <CreateClaimDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={handleCreateClaim}
            />
            <ClaimDetailsDialog
                claim={selectedClaim}
                open={!!selectedClaim}
                onOpenChange={(open: boolean) => !open && setSelectedClaim(null)}
            />
        </div>
    );
}
