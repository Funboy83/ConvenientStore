"use server";

import { generateTheftReport, type GenerateTheftReportInput } from "@/ai/flows/generate-theft-report";

export async function getTheftReport(input: GenerateTheftReportInput) {
    try {
        const result = await generateTheftReport(input);
        return { success: true, report: result.report };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to generate report." };
    }
}
