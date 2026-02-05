import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get comprehensive claims statistics
 * Returns total counts, amounts, and breakdowns by status
 */
export const getClaimsOverview = query({
    args: {
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let claims = await ctx.db.query("claims").collect();

        // Filter by date range if provided
        if (args.startDate || args.endDate) {
            claims = claims.filter(claim => {
                const claimDate = new Date(claim.date);
                if (args.startDate && claimDate < new Date(args.startDate)) return false;
                if (args.endDate && claimDate > new Date(args.endDate)) return false;
                return true;
            });
        }

        // Calculate statistics
        const totalClaims = claims.length;
        const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0);

        // Group by status
        const byStatus = claims.reduce((acc, claim) => {
            if (!acc[claim.status]) {
                acc[claim.status] = { count: 0, amount: 0 };
            }
            acc[claim.status].count++;
            acc[claim.status].amount += claim.amount;
            return acc;
        }, {} as Record<string, { count: number; amount: number }>);

        return {
            totalClaims,
            totalAmount,
            averageAmount: totalClaims > 0 ? totalAmount / totalClaims : 0,
            byStatus,
            claims: claims.length, // For detailed breakdown if needed
        };
    },
});

/**
 * Get claims time series data for charts
 * Groups claims by day/week/month
 */
export const getClaimsTimeSeries = query({
    args: {
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        granularity: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
    },
    handler: async (ctx, args) => {
        let claims = await ctx.db.query("claims").collect();

        // Filter by date range
        if (args.startDate || args.endDate) {
            claims = claims.filter(claim => {
                const claimDate = new Date(claim.date);
                if (args.startDate && claimDate < new Date(args.startDate)) return false;
                if (args.endDate && claimDate > new Date(args.endDate)) return false;
                return true;
            });
        }

        const granularity = args.granularity || "day";

        // Group by time period
        const grouped = claims.reduce((acc, claim) => {
            const date = new Date(claim.date);
            let key: string;

            if (granularity === "day") {
                key = date.toISOString().split('T')[0];
            } else if (granularity === "week") {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
            } else {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!acc[key]) {
                acc[key] = { date: key, count: 0, amount: 0 };
            }
            acc[key].count++;
            acc[key].amount += claim.amount;
            return acc;
        }, {} as Record<string, { date: string; count: number; amount: number }>);

        return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    },
});

/**
 * Get employee claims statistics
 * Returns claims count, total amount, and frequency per employee
 */
export const getEmployeeStatistics = query({
    args: {
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let claims = await ctx.db.query("claims").collect();

        // Filter by date range
        if (args.startDate || args.endDate) {
            claims = claims.filter(claim => {
                const claimDate = new Date(claim.date);
                if (args.startDate && claimDate < new Date(args.startDate)) return false;
                if (args.endDate && claimDate > new Date(args.endDate)) return false;
                return true;
            });
        }

        // Group by user
        const byUser = claims.reduce((acc, claim) => {
            const userId = claim.userId;
            const userName = claim.userName;

            if (!acc[userId]) {
                acc[userId] = {
                    userId,
                    userName,
                    totalClaims: 0,
                    totalAmount: 0,
                    approvedClaims: 0,
                    rejectedClaims: 0,
                    pendingClaims: 0,
                };
            }

            acc[userId].totalClaims++;
            acc[userId].totalAmount += claim.amount;

            if (claim.status === 'DISBURSED') {
                acc[userId].approvedClaims++;
            } else if (claim.status === 'REJECTED') {
                acc[userId].rejectedClaims++;
            } else {
                acc[userId].pendingClaims++;
            }

            return acc;
        }, {} as Record<string, {
            userId: string;
            userName: string;
            totalClaims: number;
            totalAmount: number;
            approvedClaims: number;
            rejectedClaims: number;
            pendingClaims: number;
        }>);

        return Object.values(byUser).sort((a, b) => b.totalAmount - a.totalAmount);
    },
});

/**
 * Get admin performance metrics
 * Shows approval rates and processing for each individual admin
 */
export const getAdminPerformance = query({
    args: {
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Fetch all users who are admins
        const allUsers = await ctx.db.query("users").collect();
        const admins = allUsers.filter(user => user.role !== 'USER');

        let claims = await ctx.db.query("claims").collect();

        // Filter by date range
        if (args.startDate || args.endDate) {
            claims = claims.filter(claim => {
                const claimDate = new Date(claim.date);
                if (args.startDate && claimDate < new Date(args.startDate)) return false;
                if (args.endDate && claimDate > new Date(args.endDate)) return false;
                return true;
            });
        }

        // Calculate metrics for each admin
        const performance = admins.map(admin => {
            const level = admin.role;

            // Claims that reached this admin's stage (available for them to review)
            const reachedThisStage = claims.filter(claim => {
                if (level === 'L1_ADMIN') return true; // All claims reach L1
                if (level === 'L2_ADMIN') return claim.status !== 'SUBMITTED' && claim.status !== 'REJECTED';
                if (level === 'L3_ADMIN') return ['APPROVED_L2', 'APPROVED_L3', 'DISBURSED'].includes(claim.status);
                if (level === 'L4_ADMIN') return ['APPROVED_L3', 'DISBURSED'].includes(claim.status);
                return false;
            });

            // Claims APPROVED by this specific admin
            const approvedByAdmin = claims.filter(claim => {
                return claim.logs.some(log =>
                    log.actor === admin.name &&
                    log.action === 'APPROVE'
                );
            });

            // Claims REJECTED by this specific admin
            const rejectedByAdmin = claims.filter(claim => {
                return claim.logs.some(log =>
                    log.actor === admin.name &&
                    log.action === 'REJECT'
                );
            });

            // Total claims this admin has acted on (approved or rejected)
            const totalProcessed = approvedByAdmin.length + rejectedByAdmin.length;

            // Claims still pending at this admin's level
            const pendingAtThisLevel = claims.filter(claim => {
                // Check if claim is at this admin's review stage
                if (level === 'L1_ADMIN') return claim.status === 'SUBMITTED';
                if (level === 'L2_ADMIN') return claim.status === 'APPROVED_L1';
                if (level === 'L3_ADMIN') return claim.status === 'APPROVED_L2';
                if (level === 'L4_ADMIN') return claim.status === 'APPROVED_L3';
                return false;
            });

            // Calculate approval rate based on claims actually processed (excluding pending)
            const approvalRate = totalProcessed > 0
                ? (approvedByAdmin.length / totalProcessed) * 100
                : 0;

            return {
                userId: admin._id,
                name: admin.name,
                level,
                levelName: level.replace('_', ' '),
                approved: approvedByAdmin.length,
                rejected: rejectedByAdmin.length,
                pending: pendingAtThisLevel.length,
                totalProcessed: totalProcessed,
                approvalRate: Math.round(approvalRate * 10) / 10,
                totalReached: reachedThisStage.length,
            };
        });

        return performance.sort((a, b) => b.totalProcessed - a.totalProcessed);
    },
});

/**
 * Get detailed statistics for a specific user (admin or employee)
 * Returns comprehensive activity data
 */
export const getUserDetailedStats = query({
    args: {
        userId: v.id("users"),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;

        let claims = await ctx.db.query("claims").collect();

        // Filter by date range
        if (args.startDate || args.endDate) {
            claims = claims.filter(claim => {
                const claimDate = new Date(claim.date);
                if (args.startDate && claimDate < new Date(args.startDate)) return false;
                if (args.endDate && claimDate > new Date(args.endDate)) return false;
                return true;
            });
        }

        if (user.role === 'USER') {
            // Employee statistics
            const userClaims = claims.filter(c => c.userId === args.userId);

            return {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                totalClaims: userClaims.length,
                totalAmount: userClaims.reduce((sum, c) => sum + c.amount, 0),
                approvedClaims: userClaims.filter(c => c.status === 'DISBURSED').length,
                rejectedClaims: userClaims.filter(c => c.status === 'REJECTED').length,
                pendingClaims: userClaims.filter(c => !['DISBURSED', 'REJECTED'].includes(c.status)).length,
                claims: userClaims.map(c => ({
                    id: c._id,
                    title: c.title,
                    amount: c.amount,
                    date: c.date,
                    status: c.status,
                    description: c.description,
                })),
                monthlyBreakdown: getMonthlyBreakdown(userClaims),
            };
        } else {
            // Admin statistics
            const processedClaims = claims.filter(claim =>
                claim.logs.some(log => log.actor === user.name)
            );

            const approvedByAdmin = processedClaims.filter(claim =>
                claim.logs.some(log => log.actor === user.name && log.action === 'APPROVE')
            );

            const rejectedByAdmin = processedClaims.filter(claim =>
                claim.logs.some(log => log.actor === user.name && log.action === 'REJECT')
            );

            return {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                totalProcessed: processedClaims.length,
                approved: approvedByAdmin.length,
                rejected: rejectedByAdmin.length,
                approvalRate: processedClaims.length > 0
                    ? (approvedByAdmin.length / processedClaims.length) * 100
                    : 0,
                recentActivity: processedClaims
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map(c => ({
                        id: c._id,
                        title: c.title,
                        amount: c.amount,
                        userName: c.userName,
                        status: c.status,
                        action: c.logs.find(log => log.actor === user.name)?.action || 'UNKNOWN',
                        date: c.logs.find(log => log.actor === user.name)?.timestamp || c.createdAt,
                    })),
                monthlyBreakdown: getMonthlyBreakdown(processedClaims),
            };
        }
    },
});

// Helper function to calculate monthly breakdown
function getMonthlyBreakdown(claims: any[]) {
    const monthly: Record<string, { count: number; amount: number }> = {};

    claims.forEach(claim => {
        const date = new Date(claim.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthly[key]) {
            monthly[key] = { count: 0, amount: 0 };
        }
        monthly[key].count++;
        monthly[key].amount += claim.amount;
    });

    return Object.entries(monthly)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get all claims with complete detailed timeline data
 * For comprehensive claims analysis table
 */
export const getAllClaimsDetailed = query({
    args: {
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        statusFilter: v.optional(v.string()), // 'all', 'pending', 'approved', 'rejected'
    },
    handler: async (ctx, args) => {
        let claims = await ctx.db.query("claims").order("desc").collect();

        // Filter by date range if provided
        if (args.startDate || args.endDate) {
            claims = claims.filter(claim => {
                const claimDate = new Date(claim.date);
                if (args.startDate && claimDate < new Date(args.startDate)) return false;
                if (args.endDate && claimDate > new Date(args.endDate)) return false;
                return true;
            });
        }

        // Filter by status
        if (args.statusFilter && args.statusFilter !== 'all') {
            if (args.statusFilter === 'pending') {
                claims = claims.filter(c => !['DISBURSED', 'REJECTED'].includes(c.status));
            } else if (args.statusFilter === 'approved') {
                claims = claims.filter(c => c.status === 'DISBURSED');
            } else if (args.statusFilter === 'rejected') {
                claims = claims.filter(c => c.status === 'REJECTED');
            }
        }

        // Enhance each claim with timeline analysis
        return claims.map(claim => {
            // Extract timeline from logs
            const timeline = {
                submitted: claim.logs.find(log => log.action === 'SUBMIT')?.timestamp || claim.createdAt,
                l1: claim.logs.find(log => log.stage === 'L1_ADMIN')?.timestamp,
                l2: claim.logs.find(log => log.stage === 'L2_ADMIN')?.timestamp,
                l3: claim.logs.find(log => log.stage === 'L3_ADMIN')?.timestamp,
                l4: claim.logs.find(log => log.stage === 'L4_ADMIN')?.timestamp,
            };

            // Determine current stage and action needed
            let currentStage = 'Unknown';
            let stageStatus = 'Unknown';

            if (claim.status === 'REJECTED') {
                // Find where it was rejected
                const rejectLog = claim.logs.find(log => log.action === 'REJECT');
                currentStage = rejectLog?.stage || 'Unknown';
                stageStatus = 'Rejected';
            } else if (claim.status === 'DISBURSED') {
                currentStage = 'L4_ADMIN';
                stageStatus = 'Completed';
            } else {
                // Determine pending stage
                const statusMap: Record<string, string> = {
                    'SUBMITTED': 'L1_ADMIN',
                    'APPROVED_L1': 'L2_ADMIN',
                    'APPROVED_L2': 'L3_ADMIN',
                    'APPROVED_L3': 'L4_ADMIN',
                };
                currentStage = statusMap[claim.status] || 'Unknown';
                stageStatus = 'Pending';
            }

            return {
                id: claim._id,
                userId: claim.userId,
                userName: claim.userName,
                title: claim.title,
                amount: claim.amount,
                description: claim.description,
                date: claim.date,
                status: claim.status,
                currentStage,
                stageStatus,
                timeline,
                logs: claim.logs,
                createdAt: claim.createdAt,
            };
        });
    },
});
