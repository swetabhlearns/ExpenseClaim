import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        role: v.union(
            v.literal("USER"),
            v.literal("L1_ADMIN"),
            v.literal("L2_ADMIN"),
            v.literal("L3_ADMIN"),
            v.literal("L4_ADMIN")
        ),
    }).index("by_role", ["role"]),

    claims: defineTable({
        userId: v.id("users"),
        userName: v.string(),
        title: v.string(),
        amount: v.number(),
        description: v.string(),
        date: v.string(),
        status: v.union(
            v.literal("SUBMITTED"),
            v.literal("APPROVED_L1"),
            v.literal("APPROVED_L2"),
            v.literal("APPROVED_L3"),
            v.literal("DISBURSED"),
            v.literal("REJECTED")
        ),
        logs: v.array(
            v.object({
                stage: v.string(),
                action: v.union(
                    v.literal("SUBMIT"),
                    v.literal("APPROVE"),
                    v.literal("REJECT")
                ),
                remarks: v.string(),
                timestamp: v.string(),
                actor: v.string(),
            })
        ),
        createdAt: v.string(),
    })
        .index("by_user", ["userId"])
        .index("by_status", ["status"]),
});
