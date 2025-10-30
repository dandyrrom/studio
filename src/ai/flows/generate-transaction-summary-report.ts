'use server';

/**
 * @fileOverview Generates a structured sales analysis report for a supplier using AI.
 * - generateTransactionSummaryReport - A function that generates the transaction summary report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  type ReportInput,
  ReportInputSchema,
  type ReportOutput,
  ReportOutputSchema,
} from '@/lib/types';

export async function generateTransactionSummaryReport(
  input: ReportInput
): Promise<ReportOutput> {
  return generateTransactionSummaryReportFlow(input);
}

const salesAnalystPrompt = ai.definePrompt({
  name: 'salesAnalystPrompt',
  input: { schema: ReportInputSchema },
  output: { schema: ReportOutputSchema },
  prompt: `You are a professional B2B sales analyst. Your goal is to provide a concise, insightful, and actionable report for a supplier based on their sales data for the period {{dateRange.from}} to {{dateRange.to}}.

Here is the pre-processed sales summary:
- Total Revenue: \${{totalRevenue}}
- Total Orders: {{totalOrders}}
- Average Order Value: \${{averageOrderValue}}
- Total Unique Clients: {{totalClients}}
- Top Selling Items (up to 5): {{topSellingItems}}  // <-- *** THIS IS THE CORRECTED LINE ***

Analyze this data and generate a report.

Guidelines:
- The headline should be a single, impactful sentence.
- Key insights must be data-driven and concise.
- Actionable suggestions should be practical and based on the insights.
- The sales trend should be a simple, one-sentence description.
- Return the key metric numbers (totalRevenue, totalOrders, averageOrderValue) as provided in the input.

Return ONLY a valid JSON object matching the output schema.
`,
});

const generateTransactionSummaryReportFlow = ai.defineFlow(
  {
    name: 'generateTransactionSummaryReportFlow',
    inputSchema: ReportInputSchema,
    outputSchema: ReportOutputSchema,
  },
  async (input) => {
    // If no orders, return a default state instead of calling AI
    if (input.totalOrders === 0) {
      return {
        headline: "No sales data found for this period.",
        salesTrend: "No sales activity recorded.",
        keyInsights: ["There were no completed orders (shipped or delivered) in the selected date range."],
        actionableSuggestions: ["Try expanding the date range.", "Check your 'Pending' orders on the Manage Orders page."],
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
      };
    }

    const { output } = await salesAnalystPrompt(input);
    return output!;
  }
);