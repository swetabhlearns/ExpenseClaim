import { useState, useMemo } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { UserRole } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, DollarSign, BarChart3, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserDetailedStats } from '@/components/Analytics/UserDetailedStats';
import { AllClaimsDataTable } from '@/components/Analytics/AllClaimsDataTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SuperDashboardProps {
    currentUser: {
        _id: Id<"users">;
        name: string;
        email: string;
        role: UserRole;
    };
}

type TimeRange = 'all' | '7days' | '30days' | '90days' | 'year';

export function SuperDashboard({ currentUser }: SuperDashboardProps) {
    // Check if user has L3_Admin access
    if (currentUser.role !== 'L3_ADMIN') {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                        <p className="text-sm text-muted-foreground">
                            This dashboard is only accessible to L3 Admin users.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const [timeRange, setTimeRange] = useState<TimeRange>('30days');
    const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
    const [showAllClaims, setShowAllClaims] = useState(false);

    // AI Insights state
    const [aiInsights, setAiInsights] = useState<string | null>(null);
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const generateInsights = useAction(api.ai.generateInsights);

    // Calculate date range
    const { startDate, endDate } = useMemo(() => {
        const end = new Date();
        let start = new Date();

        switch (timeRange) {
            case '7days':
                start.setDate(end.getDate() - 7);
                break;
            case '30days':
                start.setDate(end.getDate() - 30);
                break;
            case '90days':
                start.setDate(end.getDate() - 90);
                break;
            case 'year':
                start.setFullYear(end.getFullYear() - 1);
                break;
            case 'all':
                return { startDate: undefined, endDate: undefined };
        }

        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    }, [timeRange]);

    // Fetch analytics data
    const overview = useQuery(api.analytics.getClaimsOverview, { startDate, endDate });
    const timeSeries = useQuery(api.analytics.getClaimsTimeSeries, {
        startDate,
        endDate,
        granularity: timeRange === '7days' ? 'day' : timeRange === 'all' || timeRange === 'year' ? 'month' : 'day'
    });
    const employeeStats = useQuery(api.analytics.getEmployeeStatistics, { startDate, endDate });
    const adminPerformance = useQuery(api.analytics.getAdminPerformance, { startDate, endDate });

    // If showing all claims table
    if (showAllClaims) {
        return (
            <AllClaimsDataTable
                startDate={startDate}
                endDate={endDate}
                onBack={() => setShowAllClaims(false)}
            />
        );
    }

    // If a user is selected, show their detailed stats
    if (selectedUserId) {
        return (
            <UserDetailedStats
                userId={selectedUserId}
                startDate={startDate}
                endDate={endDate}
                onBack={() => setSelectedUserId(null)}
            />
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Super Analytics Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Comprehensive claims insights and performance metrics
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                            <SelectItem value="90days">Last 90 Days</SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Key Metrics */}
            {overview && (
                <div className="grid gap-6 md:grid-cols-4 animate-slide-up stagger-1">
                    <Card
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setShowAllClaims(true)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overview.totalClaims}</div>
                            <p className="text-xs text-muted-foreground">
                                Click to view all claims
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(overview.totalAmount)}</div>
                            <p className="text-xs text-muted-foreground">
                                Combined claim value
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Claim</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(overview.averageAmount)}</div>
                            <p className="text-xs text-muted-foreground">
                                Per claim average
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Users className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Object.entries(overview.byStatus)
                                    .filter(([status]) => !['DISBURSED', 'REJECTED'].includes(status))
                                    .reduce((sum, [, data]) => sum + data.count, 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Awaiting approval
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Loading Skeleton for Metrics */}
            {!overview && (
                <div className="grid gap-6 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4 rounded" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* AI Insights Card */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <CardTitle>AI-Powered Insights</CardTitle>
                        </div>
                        <Button
                            onClick={async () => {
                                setIsGeneratingInsights(true);
                                try {
                                    const result = await generateInsights({ startDate, endDate }) as { insights: string; stats: any };
                                    setAiInsights(result.insights);
                                    toast.success('AI Insights generated successfully!');
                                } catch (error) {
                                    console.error('Error generating insights:', error);
                                    toast.error('Failed to generate insights. Please try again.');
                                } finally {
                                    setIsGeneratingInsights(false);
                                }
                            }}
                            disabled={isGeneratingInsights}
                            variant={aiInsights ? 'outline' : 'default'}
                            className="gap-2"
                        >
                            {isGeneratingInsights ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    {aiInsights ? 'Regenerate' : 'Generate'} Insights
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isGeneratingInsights ? (
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    ) : aiInsights ? (
                        <div className="prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {aiInsights}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Click the button above to generate AI-powered insights about your expense claims.</p>
                            <p className="text-xs mt-2">Powered by Groq & Llama 3.1</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2 animate-slide-up stagger-2">
                {/* Claims Over Time - Line Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Claims Trend Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {timeSeries && timeSeries.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={timeSeries}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        fontSize={12}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return `${date.getMonth() + 1}/${date.getDate()}`;
                                        }}
                                    />
                                    <YAxis fontSize={12} />
                                    <Tooltip
                                        formatter={(value: number | undefined, name: string | undefined) => {
                                            if (value === undefined) return '';
                                            if (name === 'amount') return formatCurrency(value);
                                            return value;
                                        }}
                                        labelFormatter={(label) => `Date: ${label}`}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        name="Number of Claims"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        name="Total Amount"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Employee Comparison - Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Claimants by Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {employeeStats && employeeStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={employeeStats.slice(0, 5)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="userName"
                                        fontSize={12}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis fontSize={12} />
                                    <Tooltip
                                        formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                                        labelFormatter={(label) => `Employee: ${label}`}
                                    />
                                    <Legend />
                                    <Bar dataKey="totalAmount" fill="#3b82f6" name="Total Amount" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No employee data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Admin Performance Table */}
            {adminPerformance && adminPerformance.length > 0 && (
                <Card className="animate-slide-up stagger-3">
                    <CardHeader>
                        <CardTitle>Admin Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Approved</TableHead>
                                    <TableHead>Rejected</TableHead>
                                    <TableHead>Pending</TableHead>
                                    <TableHead>Total Processed</TableHead>
                                    <TableHead>Approval Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adminPerformance.map((perf: any) => (
                                    <TableRow
                                        key={perf.userId}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => setSelectedUserId(perf.userId)}
                                    >
                                        <TableCell className="font-medium">{perf.name}</TableCell>
                                        <TableCell>{perf.levelName}</TableCell>
                                        <TableCell>
                                            <Badge variant="default">{perf.approved}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="destructive">{perf.rejected}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{perf.pending}</Badge>
                                        </TableCell>
                                        <TableCell>{perf.totalProcessed}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={perf.approvalRate >= 80 ? "default" : perf.approvalRate >= 50 ? "secondary" : "destructive"}
                                            >
                                                {perf.totalProcessed > 0 ? `${perf.approvalRate.toFixed(1)}%` : 'N/A'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Employee Statistics Table */}
            {employeeStats && employeeStats.length > 0 && (
                <Card className="animate-slide-up stagger-4">
                    <CardHeader>
                        <CardTitle>Employee Claims Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Total Claims</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead>Approved</TableHead>
                                    <TableHead>Rejected</TableHead>
                                    <TableHead>Pending</TableHead>
                                    <TableHead>Avg per Claim</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employeeStats.map((stat: any) => (
                                    <TableRow
                                        key={stat.userId}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => setSelectedUserId(stat.userId)}
                                    >
                                        <TableCell className="font-medium">{stat.userName}</TableCell>
                                        <TableCell>{stat.totalClaims}</TableCell>
                                        <TableCell className="font-mono">{formatCurrency(stat.totalAmount)}</TableCell>
                                        <TableCell>
                                            <Badge variant="default">{stat.approvedClaims}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="destructive">{stat.rejectedClaims}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{stat.pendingClaims}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {formatCurrency(stat.totalAmount / stat.totalClaims)}
                                        </TableCell>
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
