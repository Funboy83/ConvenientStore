"use server";

import { detectTheftAnomalies, type DetectTheftAnomaliesInput } from "@/ai/flows/detect-theft-anomalies";

export async function getTheftAnomalies(input: DetectTheftAnomaliesInput) {
    try {
        const result = await detectTheftAnomalies(input);
        return { success: true, ...result };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to detect anomalies." };
    }
}
