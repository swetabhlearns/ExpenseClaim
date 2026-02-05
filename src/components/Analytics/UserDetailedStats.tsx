import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, User, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserDetailedStatsProps {
    userId: Id<"users">;
    startDate?: string;
    endDate?: string;
    onBack: () => void;
}

export function UserDetailedStats({ userId, startDate, endDate, onBack }: UserDetailedStatsProps) {
    const stats = useQuery(api.analytics.getUserDetailedStats, { userId, startDate, endDate });

    if (!stats) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">Loading statistics...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isEmployee = stats.user.role === 'USER';

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-heading font-bold">{stats.user.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        {stats.user.email} • {stats.user.role.replace('_', ' ')}
                    </p>
                </div>
            </div>

            {/* Key Metrics */}
            {isEmployee ? (
                <div className="grid gap-6 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalClaims}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.approvedClaims}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingClaims}</div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalProcessed}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.approved}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.rejected}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.approvalRate?.toFixed(1) || '0.0'}%</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Monthly Breakdown Chart */}
            {stats.monthlyBreakdown && stats.monthlyBreakdown.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.monthlyBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip
                                    formatter={(value) => typeof value === 'number' ? formatCurrency(value) : value}
                                />
                                <Legend />
                                <Bar dataKey="count" fill="#8b5cf6" name="Count" />
                                <Bar dataKey="amount" fill="#10b981" name="Amount" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Claims List (for employees) or Recent Activity (for admins) */}
            {isEmployee && stats.claims && stats.claims.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>All Claims</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.claims.map((claim: any) => (
                                    <TableRow key={claim.id}>
                                        <TableCell className="font-medium">{claim.title}</TableCell>
                                        <TableCell>{new Date(claim.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-mono">{formatCurrency(claim.amount)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    claim.status === 'DISBURSED' ? 'default' :
                                                        claim.status === 'REJECTED' ? 'destructive' :
                                                            'secondary'
                                                }
                                            >
                                                {claim.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {!isEmployee && stats.recentActivity && stats.recentActivity.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity (Last 10)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Claim Title</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.recentActivity.map((activity: any) => (
                                    <TableRow key={activity.id}>
                                        <TableCell className="font-medium">{activity.title}</TableCell>
                                        <TableCell>{activity.userName}</TableCell>
                                        <TableCell className="font-mono">{formatCurrency(activity.amount)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={activity.action === 'APPROVE' ? 'default' : 'destructive'}
                                            >
                                                {activity.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
