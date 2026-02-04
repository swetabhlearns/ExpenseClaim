import { mutation } from "./_generated/server";

export const seedData = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if data already exists
        const existingUsers = await ctx.db.query("users").collect();
        if (existingUsers.length > 0) {
            return "Data already seeded";
        }

        // Create users
        const userEmployee = await ctx.db.insert("users", {
            name: "Rahul Sharma",
            email: "rahul.sharma@company.com",
            role: "USER",
        });

        const _userL1 = await ctx.db.insert("users", {
            name: "Priya Patel",
            email: "priya.patel@company.com",
            role: "L1_ADMIN",
        });

        const _userL2 = await ctx.db.insert("users", {
            name: "Amit Kumar",
            email: "amit.kumar@company.com",
            role: "L2_ADMIN",
        });

        const _userL3 = await ctx.db.insert("users", {
            name: "Sneha Reddy",
            email: "sneha.reddy@company.com",
            role: "L3_ADMIN",
        });

        const _userL4 = await ctx.db.insert("users", {
            name: "Vikram Singh",
            email: "vikram.singh@company.com",
            role: "L4_ADMIN",
        });

        // Create sample claims
        const now = new Date();

        // Claim 1: At L3 stage (approved by L1 and L2)
        await ctx.db.insert("claims", {
            userId: userEmployee,
            userName: "Rahul Sharma",
            title: "MacBook Pro M3 - Development",
            amount: 185000,
            description: "Latest MacBook Pro for development work",
            date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "APPROVED_L2",
            logs: [
                {
                    stage: "Submission",
                    action: "SUBMIT",
                    remarks: "Claim submitted for review",
                    timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Rahul Sharma",
                },
                {
                    stage: "L1 - Accounts",
                    action: "APPROVE",
                    remarks: "Approved - Valid business expense",
                    timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Priya Patel",
                },
                {
                    stage: "L2 - Finance",
                    action: "APPROVE",
                    remarks: "Budget allocation confirmed",
                    timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Amit Kumar",
                },
            ],
            createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Claim 2: Just submitted (pending L1)
        await ctx.db.insert("claims", {
            userId: userEmployee,
            userName: "Rahul Sharma",
            title: "Conference Travel - ReactConf 2026",
            amount: 45000,
            description: "Flight tickets and accommodation for ReactConf",
            date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "SUBMITTED",
            logs: [
                {
                    stage: "Submission",
                    action: "SUBMIT",
                    remarks: "Claim submitted for review",
                    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Rahul Sharma",
                },
            ],
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Claim 3: Approved by L1 (pending L2)
        await ctx.db.insert("claims", {
            userId: userEmployee,
            userName: "Rahul Sharma",
            title: "Client Dinner - Q4 Deal Closure",
            amount: 8500,
            description: "Business dinner with client stakeholders",
            date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "APPROVED_L1",
            logs: [
                {
                    stage: "Submission",
                    action: "SUBMIT",
                    remarks: "Claim submitted for review",
                    timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Rahul Sharma",
                },
                {
                    stage: "L1 - Accounts",
                    action: "APPROVE",
                    remarks: "Valid entertainment expense",
                    timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Priya Patel",
                },
            ],
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Claim 4: Rejected by L1
        await ctx.db.insert("claims", {
            userId: userEmployee,
            userName: "Rahul Sharma",
            title: "Office Supplies - Stationery",
            amount: 3200,
            description: "Pens, notebooks, and desk organizers",
            date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "REJECTED",
            logs: [
                {
                    stage: "Submission",
                    action: "SUBMIT",
                    remarks: "Claim submitted for review",
                    timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Rahul Sharma",
                },
                {
                    stage: "L1 - Accounts",
                    action: "REJECT",
                    remarks: "No receipt attached. Please resubmit with invoice.",
                    timestamp: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Priya Patel",
                },
            ],
            createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Claim 5: Fully disbursed
        await ctx.db.insert("claims", {
            userId: userEmployee,
            userName: "Rahul Sharma",
            title: "Figma Professional License - Annual",
            amount: 12000,
            description: "Annual subscription for design tool",
            date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "DISBURSED",
            logs: [
                {
                    stage: "Submission",
                    action: "SUBMIT",
                    remarks: "Claim submitted for review",
                    timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Rahul Sharma",
                },
                {
                    stage: "L1 - Accounts",
                    action: "APPROVE",
                    remarks: "Business tool subscription approved",
                    timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Priya Patel",
                },
                {
                    stage: "L2 - Finance",
                    action: "APPROVE",
                    remarks: "License cost approved",
                    timestamp: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Amit Kumar",
                },
                {
                    stage: "L3 - CEO",
                    action: "APPROVE",
                    remarks: "Approved",
                    timestamp: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Sneha Reddy",
                },
                {
                    stage: "L4 - Final Disbursement",
                    action: "APPROVE",
                    remarks: "Payment processed",
                    timestamp: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
                    actor: "Vikram Singh",
                },
            ],
            createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        });

        return "Successfully seeded 5 users and 5 claims";
    },
});
