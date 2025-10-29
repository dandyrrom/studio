'use server';

/**
 * @fileOverview Generates a summary report of transaction history for a supplier using AI.
 * 
 * - generateTransactionSummaryReport - A function that generates the transaction summary report.
 * - GenerateTransactionSummaryReportInput - The input type for the generateTransactionSummaryReport function.
 * - GenerateTransactionSummaryReportOutput - The return type for the generateTransactionSummaryReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTransactionSummaryReportInputSchema = z.object({
  transactionHistory: z
    .string()
    .describe('The transaction history data, as a JSON string.'),
});
export type GenerateTransactionSummaryReportInput = z.infer<
  typeof GenerateTransactionSummaryReportInputSchema
>;

const GenerateTransactionSummaryReportOutputSchema = z.object({
  summaryReport: z.string().describe('The generated summary report.'),
});
export type GenerateTransactionSummaryReportOutput = z.infer<
  typeof GenerateTransactionSummaryReportOutputSchema
>;

export async function generateTransactionSummaryReport(
  input: GenerateTransactionSummaryReportInput
): Promise<GenerateTransactionSummaryReportOutput> {
  return generateTransactionSummaryReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTransactionSummaryReportPrompt',
  input: {schema: GenerateTransactionSummaryReportInputSchema},
  output: {schema: GenerateTransactionSummaryReportOutputSchema},
  prompt: `You are an expert in analyzing transaction history and generating summary reports.

  Analyze the following transaction history and generate a concise summary report highlighting key sales performance indicators and trends.

  Transaction History: {{{transactionHistory}}}

  Summary Report:`,
});

const generateTransactionSummaryReportFlow = ai.defineFlow(
  {
    name: 'generateTransactionSummaryReportFlow',
    inputSchema: GenerateTransactionSummaryReportInputSchema,
    outputSchema: GenerateTransactionSummaryReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
