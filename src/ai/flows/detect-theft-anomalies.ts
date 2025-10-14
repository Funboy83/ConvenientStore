'use server';
/**
 * @fileOverview An AI-powered anomaly detection system for identifying potential theft in sales and employee behavior.
 *
 * - detectTheftAnomalies - A function that analyzes sales and employee data to flag suspicious activities.
 * - DetectTheftAnomaliesInput - The input type for the detectTheftAnomalies function, including sales data, employee data, and system logs.
 * - DetectTheftAnomaliesOutput - The return type for the detectTheftAnomalies function, providing a risk score and a summary of potential anomalies.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectTheftAnomaliesInputSchema = z.object({
  salesData: z.string().describe('A JSON string containing sales transaction data, including timestamps, employee IDs, and transaction amounts.'),
  employeeData: z.string().describe('A JSON string containing employee information, including IDs, roles, and performance metrics.'),
  systemLogs: z.string().describe('A JSON string containing system logs, including login/logout times, access attempts, and unusual activities.'),
});
export type DetectTheftAnomaliesInput = z.infer<typeof DetectTheftAnomaliesInputSchema>;

const DetectTheftAnomaliesOutputSchema = z.object({
  riskScore: z.number().describe('A numerical score indicating the overall risk of theft, with higher scores indicating higher risk.'),
  summary: z.string().describe('A summary of potential anomalies detected, including specific employees or transactions of concern.'),
});
export type DetectTheftAnomaliesOutput = z.infer<typeof DetectTheftAnomaliesOutputSchema>;

export async function detectTheftAnomalies(input: DetectTheftAnomaliesInput): Promise<DetectTheftAnomaliesOutput> {
  return detectTheftAnomaliesFlow(input);
}

const detectTheftAnomaliesPrompt = ai.definePrompt({
  name: 'detectTheftAnomaliesPrompt',
  input: {schema: DetectTheftAnomaliesInputSchema},
  output: {schema: DetectTheftAnomaliesOutputSchema},
  prompt: `You are an AI-powered security analyst tasked with detecting theft and fraud within a retail environment.

  Analyze the provided sales data, employee data, and system logs to identify any anomalies or suspicious patterns that may indicate theft or fraudulent activity.

  Consider factors such as:
  - Unusual transaction patterns (e.g., excessive voids, returns, or discounts).
  - Suspicious employee behavior (e.g., high number of overrides, transactions outside of normal hours).
  - Discrepancies between sales data and inventory levels.
  - Unusual system log entries (e.g. failed access attempts, unauthorized access).

  Based on your analysis, assign a risk score indicating the likelihood of theft or fraud, and provide a detailed summary of the potential anomalies detected.

  Sales Data: {{{salesData}}}
  Employee Data: {{{employeeData}}}
  System Logs: {{{systemLogs}}}

  Ensure that the risk score and summary are well-justified based on the data provided.
`,
});

const detectTheftAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectTheftAnomaliesFlow',
    inputSchema: DetectTheftAnomaliesInputSchema,
    outputSchema: DetectTheftAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await detectTheftAnomaliesPrompt(input);
    return output!;
  }
);
