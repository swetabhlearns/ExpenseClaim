import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Queries
export const listClaims = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("claims").order("desc").collect();
    },
});

export const getClaimsByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("claims")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

export const getClaimsByStatus = query({
    args: { status: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("claims")
            .withIndex("by_status", (q) => q.eq("status", args.status))
            .order("desc")
            .collect();
    },
});

export const getClaim = query({
    args: { claimId: v.id("claims") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.claimId);
    },
});

// Mutations
export const createClaim = mutation({
    args: {
        userId: v.id("users"),
        userName: v.string(),
        title: v.string(),
        amount: v.number(),
        description: v.string(),
        date: v.string(),
    },
    handler: async (ctx, args) => {
        const now = new Date().toISOString();

        const claimId = await ctx.db.insert("claims", {
            userId: args.userId,
            userName: args.userName,
            title: args.title,
            amount: args.amount,
            description: args.description,
            date: args.date,
            status: "SUBMITTED",
            logs: [
                {
                    stage: "Submission",
                    action: "SUBMIT",
                    remarks: "Claim submitted for review",
                    timestamp: now,
                    actor: args.userName,
                },
            ],
            createdAt: now,
        });

        return claimId;
    },
});

export const approveClaim = mutation({
    args: {
        claimId: v.id("claims"),
        remarks: v.string(),
        actorName: v.string(),
        actorRole: v.string(),
    },
    handler: async (ctx, args) => {
        const claim = await ctx.db.get(args.claimId);
        if (!claim) throw new Error("Claim not found");

        const nextStatus = getNextStatus(claim.status);
        if (!nextStatus) throw new Error("Cannot approve from current status");

        const stageName = getStageName(args.actorRole);
        const now = new Date().toISOString();

        await ctx.db.patch(args.claimId, {
            status: nextStatus,
            logs: [
                ...claim.logs,
                {
                    stage: stageName,
                    action: "APPROVE",
                    remarks: args.remarks,
                    timestamp: now,
                    actor: args.actorName,
                },
            ],
        });

        return nextStatus;
    },
});

export const rejectClaim = mutation({
    args: {
        claimId: v.id("claims"),
        remarks: v.string(),
        actorName: v.string(),
        actorRole: v.string(),
    },
    handler: async (ctx, args) => {
        const claim = await ctx.db.get(args.claimId);
        if (!claim) throw new Error("Claim not found");

        const stageName = getStageName(args.actorRole);
        const now = new Date().toISOString();

        await ctx.db.patch(args.claimId, {
            status: "REJECTED",
            logs: [
                ...claim.logs,
                {
                    stage: stageName,
                    action: "REJECT",
                    remarks: args.remarks,
                    timestamp: now,
                    actor: args.actorName,
                },
            ],
        });

        return "REJECTED";
    },
});

// Helper functions
function getNextStatus(currentStatus: string): string | null {
    const transitions: Record<string, string> = {
        SUBMITTED: "APPROVED_L1",
        APPROVED_L1: "APPROVED_L2",
        APPROVED_L2: "APPROVED_L3",
        APPROVED_L3: "DISBURSED",
    };
    return transitions[currentStatus] || null;
}

function getStageName(role: string): string {
    const stageNames: Record<string, string> = {
        L1_ADMIN: "L1 - Accounts",
        L2_ADMIN: "L2 - Finance",
        L3_ADMIN: "L3 - CEO",
        L4_ADMIN: "L4 - Final Disbursement",
    };
    return stageNames[role] || role;
}
