'use server';

/**
 * @fileOverview An AI-powered theft report generator.
 *
 * - generateTheftReport - A function that generates a theft report based on sales, inventory, and employee activity data.
 * - GenerateTheftReportInput - The input type for the generateTheftReport function.
 * - GenerateTheftReportOutput - The return type for the generateTheftReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTheftReportInputSchema = z.object({
  salesData: z.string().describe('Sales data in JSON format.'),
  inventoryData: z.string().describe('Inventory data in JSON format.'),
  employeeActivityData: z.string().describe('Employee activity data in JSON format.'),
  reportCustomizationOptions: z.string().optional().describe('Optional report customization options in JSON format.'),
});
export type GenerateTheftReportInput = z.infer<typeof GenerateTheftReportInputSchema>;

const GenerateTheftReportOutputSchema = z.object({
  report: z.string().describe('The generated theft report.'),
});
export type GenerateTheftReportOutput = z.infer<typeof GenerateTheftReportOutputSchema>;

export async function generateTheftReport(input: GenerateTheftReportInput): Promise<GenerateTheftReportOutput> {
  return generateTheftReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTheftReportPrompt',
  input: {schema: GenerateTheftReportInputSchema},
  output: {schema: GenerateTheftReportOutputSchema},
  prompt: `You are an AI assistant designed to analyze sales, inventory, and employee activity data to generate theft reports.

  Analyze the provided data and identify any suspicious patterns or anomalies that may indicate theft.

  Sales Data: {{{salesData}}}
  Inventory Data: {{{inventoryData}}}
  Employee Activity Data: {{{employeeActivityData}}}
  Report Customization Options: {{{reportCustomizationOptions}}}

  Based on your analysis, generate a detailed theft report that includes:
  - A summary of the key findings and potential theft schemes.
  - Specific examples of suspicious transactions or activities.
  - Recommendations for further investigation or preventative measures.

  Ensure that the report is clear, concise, and easy to understand for non-technical users.
  `,
});

const generateTheftReportFlow = ai.defineFlow(
  {
    name: 'generateTheftReportFlow',
    inputSchema: GenerateTheftReportInputSchema,
    outputSchema: GenerateTheftReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
