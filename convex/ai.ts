import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const generateInsights = action({
    args: {
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{ insights: string; stats: any }> => {
        // Fetch all claims using the public API
        const claims: any[] = await ctx.runQuery(api.analytics.getAllClaimsDetailed, {
            startDate: args.startDate,
            endDate: args.endDate,
            statusFilter: "all",
        });

        // Aggregate statistics
        const totalClaims: number = claims.length;
        const totalAmount: number = claims.reduce((sum: number, c: any) => sum + c.amount, 0);
        const approvedClaims: number = claims.filter((c: any) => c.status === 'DISBURSED').length;
        const rejectedClaims: number = claims.filter((c: any) => c.status === 'REJECTED').length;
        const pendingClaims: number = claims.filter((c: any) => !['DISBURSED', 'REJECTED'].includes(c.status)).length;

        // Calculate average amounts
        const avgClaimAmount = totalClaims > 0 ? totalAmount / totalClaims : 0;
        const approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0;

        // Get top claimants
        const claimsByEmployee = claims.reduce((acc: any, claim: any) => {
            if (!acc[claim.userName]) {
                acc[claim.userName] = { count: 0, amount: 0 };
            }
            acc[claim.userName].count++;
            acc[claim.userName].amount += claim.amount;
            return acc;
        }, {} as Record<string, { count: number; amount: number }>);

        const topClaimants = Object.entries(claimsByEmployee)
            .sort((a: any, b: any) => b[1].amount - a[1].amount)
            .slice(0, 3)
            .map(([name, data]: [string, any]) => ({ name, ...data }));

        // Build prompt for Groq
        const prompt = `You are a financial analyst AI assistant analyzing expense claim data for a company. Provide concise, actionable insights.

**Claims Data Summary:**
- Total Claims: ${totalClaims}
- Total Amount: ₹${totalAmount.toLocaleString('en-IN')}
- Average Claim: ₹${avgClaimAmount.toLocaleString('en-IN')}
- Approved: ${approvedClaims} (${approvalRate.toFixed(1)}%)
- Rejected: ${rejectedClaims}
- Pending: ${pendingClaims}
${args.startDate ? `- Date Range: ${args.startDate} to ${args.endDate || 'present'}` : '- All Time Data'}

**Top 3 Claimants by Amount:**
${topClaimants.map((c, i) => `${i + 1}. ${c.name}: ₹${c.amount.toLocaleString('en-IN')} (${c.count} claims)`).join('\n')}

**Your Task:**
Analyze this data and provide:
1. **Key Trends** - What patterns do you notice? (2-3 bullets)
2. **Anomalies/Alerts** - Any unusual patterns or concerns? (1-2 bullets)
3. **Recommendations** - What actions should management take? (2-3 bullets)

Format your response in a clear, professional manner using bullet points. Be specific and use the actual numbers from the data. Keep it concise (max 200 words).`;

        // Call Groq API
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error("GROQ_API_KEY not configured");
        }

        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: "You are a professional financial analyst AI that provides clear, actionable insights about expense claims."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 800,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Groq API error: ${response.status} - ${errorText}`);
            }

            const data: any = await response.json();
            const insights = data.choices[0]?.message?.content || "No insights generated.";

            return {
                insights,
                stats: {
                    totalClaims,
                    totalAmount,
                    approvedClaims,
                    rejectedClaims,
                    pendingClaims,
                    avgClaimAmount,
                    approvalRate,
                },
            };
        } catch (error) {
            console.error("Error calling Groq API:", error);
            throw new Error(`Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
});
