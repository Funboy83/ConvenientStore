"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getTheftAnomalies } from "./actions";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { SAMPLE_SALES_DATA, SAMPLE_EMPLOYEE_ACTIVITY_DATA, SAMPLE_SYSTEM_LOGS } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AnalysisResult {
    riskScore: number;
    summary: string;
}

export default function AnalysisPage() {
  const [salesData, setSalesData] = useState(SAMPLE_SALES_DATA);
  const [employeeData, setEmployeeData] = useState(SAMPLE_EMPLOYEE_ACTIVITY_DATA);
  const [systemLogs, setSystemLogs] = useState(SAMPLE_SYSTEM_LOGS);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    const response = await getTheftAnomalies({
      salesData,
      employeeData,
      systemLogs,
    });

    setIsLoading(false);
    if (response.success && response.riskScore !== undefined && response.summary) {
      setResult({ riskScore: response.riskScore, summary: response.summary });
      toast({
        title: "Analysis Complete",
        description: "Potential anomalies have been identified.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.error,
      });
    }
  };
  
  const getRiskColor = (score: number) => {
    if (score > 75) return "bg-red-500";
    if (score > 40) return "bg-orange-500";
    return "bg-green-500";
  }

  return (
    <>
      <PageHeader
        title="AI Anomaly Detection"
        description="Analyze behavioral data to flag deviations that might indicate theft."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Analyze for Anomalies</CardTitle>
                <CardDescription>
                  Provide data in JSON format for the AI to analyze. Sample data is pre-filled.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sales-data" className="font-headline">Sales Data</Label>
                  <Textarea
                    id="sales-data"
                    value={salesData}
                    onChange={(e) => setSalesData(e.target.value)}
                    className="h-28 font-code"
                    placeholder="Enter sales data as JSON..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-data" className="font-headline">Employee Data</Label>
                  <Textarea
                    id="employee-data"
                    value={employeeData}
                    onChange={(e) => setEmployeeData(e.target.value)}
                    className="h-28 font-code"
                    placeholder="Enter employee data as JSON..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system-logs" className="font-headline">System Logs</Label>
                  <Textarea
                    id="system-logs"
                    value={systemLogs}
                    onChange={(e) => setSystemLogs(e.target.value)}
                    className="h-28 font-code"
                    placeholder="Enter system logs as JSON..."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Detect Anomalies
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Analysis Result</CardTitle>
              <CardDescription>The AI's findings and risk score will be shown here.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Analyzing data for suspicious patterns...</p>
                </div>
              )}
              {result && (
                <div className="space-y-6">
                    <div>
                        <Label>Overall Risk Score</Label>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="w-full bg-muted rounded-full h-4">
                               <div
                                className={cn("h-4 rounded-full transition-all duration-500", getRiskColor(result.riskScore))}
                                style={{ width: `${result.riskScore}%`}}
                               />
                            </div>
                            <span className="font-bold text-xl">{result.riskScore}</span>
                        </div>
                    </div>
                    <div>
                        <Label>Anomaly Summary</Label>
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans mt-2 border bg-secondary/50 rounded-md p-4">
                            {result.summary}
                        </div>
                    </div>
                </div>
              )}
              {!isLoading && !result && (
                 <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <ShieldAlert className="w-12 h-12 mb-4" />
                    <p>Analysis results will be displayed here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
