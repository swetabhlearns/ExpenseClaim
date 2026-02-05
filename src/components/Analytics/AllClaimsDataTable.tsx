import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ClaimDetailsDialog } from './ClaimDetailsDialog';

interface AllClaimsDataTableProps {
    startDate?: string;
    endDate?: string;
    onBack: () => void;
}

type SortField = 'userName' | 'title' | 'amount' | 'date';
type SortOrder = 'asc' | 'desc';

export function AllClaimsDataTable({ startDate, endDate, onBack }: AllClaimsDataTableProps) {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

    const claims = useQuery(api.analytics.getAllClaimsDetailed, {
        startDate,
        endDate,
        statusFilter,
    });

    // Filter and sort claims
    const filteredAndSortedClaims = useMemo(() => {
        if (!claims) return [];

        // Filter by search query
        let filtered = claims.filter((claim: any) => {
            const query = searchQuery.toLowerCase();
            return (
                claim.userName.toLowerCase().includes(query) ||
                claim.title.toLowerCase().includes(query) ||
                claim.description.toLowerCase().includes(query)
            );
        });

        // Sort claims
        filtered.sort((a: any, b: any) => {
            let aVal, bVal;

            switch (sortField) {
                case 'userName':
                    aVal = a.userName.toLowerCase();
                    bVal = b.userName.toLowerCase();
                    break;
                case 'title':
                    aVal = a.title.toLowerCase();
                    bVal = b.title.toLowerCase();
                    break;
                case 'amount':
                    aVal = a.amount;
                    bVal = b.amount;
                    break;
                case 'date':
                    aVal = new Date(a.date).getTime();
                    bVal = new Date(b.date).getTime();
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [claims, searchQuery, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" />;
        return sortOrder === 'asc'
            ? <ArrowUp className="h-3 w-3 ml-1 inline" />
            : <ArrowDown className="h-3 w-3 ml-1 inline" />;
    };

    if (!claims) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">Loading claims data...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStageStatus = (claim: any, stage: 'L1' | 'L2' | 'L3' | 'L4') => {
        const stageMap = {
            'L1': { status: 'SUBMITTED', approvedStatus: 'APPROVED_L1', level: 'L1_ADMIN' },
            'L2': { status: 'APPROVED_L1', approvedStatus: 'APPROVED_L2', level: 'L2_ADMIN' },
            'L3': { status: 'APPROVED_L2', approvedStatus: 'APPROVED_L3', level: 'L3_ADMIN' },
            'L4': { status: 'APPROVED_L3', approvedStatus: 'DISBURSED', level: 'L4_ADMIN' },
        };

        const config = stageMap[stage];

        // Check if rejected at this stage
        const rejectedAtStage = claim.logs.find(
            (log: any) => log.stage === config.level && log.action === 'REJECT'
        );

        if (rejectedAtStage) {
            return { type: 'rejected', icon: '❌', color: 'text-red-600' };
        }

        // Check if approved at this stage
        const stageIndex = ['SUBMITTED', 'APPROVED_L1', 'APPROVED_L2', 'APPROVED_L3', 'DISBURSED'].indexOf(config.approvedStatus);
        const currentIndex = ['SUBMITTED', 'APPROVED_L1', 'APPROVED_L2', 'APPROVED_L3', 'DISBURSED'].indexOf(claim.status);

        if (currentIndex >= stageIndex && claim.status !== 'REJECTED') {
            return { type: 'approved', icon: '✅', color: 'text-green-600' };
        }

        // Check if pending at this stage
        if (claim.status === config.status) {
            return { type: 'pending', icon: '⏰', color: 'text-orange-500' };
        }

        // Not reached yet
        return { type: 'not-reached', icon: '—', color: 'text-gray-400' };
    };

    const getStatusBadge = (status: string) => {
        if (status === 'DISBURSED') {
            return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1 inline" />Completed</Badge>;
        } else if (status === 'REJECTED') {
            return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1 inline" />Rejected</Badge>;
        } else {
            return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1 inline" />Pending</Badge>;
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-heading font-bold">All Claims Data</h1>
                        <p className="text-muted-foreground mt-1">
                            Comprehensive claims analysis with complete timeline
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by employee name or claim title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Claims ({claims.length})</SelectItem>
                        <SelectItem value="pending">
                            Pending ({claims.filter((c: any) => c.stageStatus === 'Pending').length})
                        </SelectItem>
                        <SelectItem value="approved">
                            Approved ({claims.filter((c: any) => c.status === 'DISBURSED').length})
                        </SelectItem>
                        <SelectItem value="rejected">
                            Rejected ({claims.filter((c: any) => c.status === 'REJECTED').length})
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredAndSortedClaims.length}</div>
                        {searchQuery && (
                            <p className="text-xs text-muted-foreground">Filtered from {claims.length}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredAndSortedClaims.filter((c: any) => c.stageStatus === 'Pending').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredAndSortedClaims.filter((c: any) => c.status === 'DISBURSED').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredAndSortedClaims.filter((c: any) => c.status === 'REJECTED').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Comprehensive Claims Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Complete Claims Timeline ({filteredAndSortedClaims.length} claims)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50 w-[130px]"
                                        onClick={() => handleSort('userName')}
                                    >
                                        Employee <SortIcon field="userName" />
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50 w-[180px]"
                                        onClick={() => handleSort('title')}
                                    >
                                        Claim Title <SortIcon field="title" />
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('amount')}
                                    >
                                        Amount <SortIcon field="amount" />
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('date')}
                                    >
                                        Submitted <SortIcon field="date" />
                                    </TableHead>
                                    <TableHead className="text-center">L1</TableHead>
                                    <TableHead className="text-center">L2</TableHead>
                                    <TableHead className="text-center">L3</TableHead>
                                    <TableHead className="text-center">L4</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedClaims.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                            {searchQuery
                                                ? `No claims found matching "${searchQuery}"`
                                                : 'No claims found for the selected filters'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAndSortedClaims.map((claim: any) => {
                                        const l1Status = getStageStatus(claim, 'L1');
                                        const l2Status = getStageStatus(claim, 'L2');
                                        const l3Status = getStageStatus(claim, 'L3');
                                        const l4Status = getStageStatus(claim, 'L4');

                                        return (
                                            <TableRow
                                                key={claim.id}
                                                className="hover:bg-muted/50 cursor-pointer"
                                                onClick={() => setSelectedClaim(claim)}
                                            >
                                                <TableCell className="font-medium">{claim.userName}</TableCell>
                                                <TableCell>
                                                    <div className="max-w-[180px]">
                                                        <p className="font-medium truncate">{claim.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {claim.description}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono">{formatCurrency(claim.amount)}</TableCell>
                                                <TableCell className="text-sm">{formatDate(claim.date)}</TableCell>
                                                <TableCell className={`text-center text-lg ${l1Status.color}`}>
                                                    {l1Status.icon}
                                                </TableCell>
                                                <TableCell className={`text-center text-lg ${l2Status.color}`}>
                                                    {l2Status.icon}
                                                </TableCell>
                                                <TableCell className={`text-center text-lg ${l3Status.color}`}>
                                                    {l3Status.icon}
                                                </TableCell>
                                                <TableCell className={`text-center text-lg ${l4Status.color}`}>
                                                    {l4Status.icon}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(claim.status)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Claim Details Dialog */}
            <ClaimDetailsDialog
                claim={selectedClaim}
                open={!!selectedClaim}
                onOpenChange={(open) => !open && setSelectedClaim(null)}
            />
        </div>
    );
}
