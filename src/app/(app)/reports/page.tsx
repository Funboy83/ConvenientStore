"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getTheftReport } from "./actions";
import { Loader2, FileText } from "lucide-react";
import { SAMPLE_SALES_DATA, SAMPLE_INVENTORY_DATA, SAMPLE_EMPLOYEE_ACTIVITY_DATA } from "@/lib/constants";

export default function ReportsPage() {
  const [salesData, setSalesData] = useState(SAMPLE_SALES_DATA);
  const [inventoryData, setInventoryData] = useState(SAMPLE_INVENTORY_DATA);
  const [employeeActivityData, setEmployeeActivityData] = useState(SAMPLE_EMPLOYEE_ACTIVITY_DATA);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setReport(null);

    const result = await getTheftReport({
      salesData,
      inventoryData,
      employeeActivityData,
    });

    setIsLoading(false);
    if (result.success) {
      setReport(result.report!);
      toast({
        title: "Report Generated",
        description: "The theft analysis report has been successfully created.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
  };

  return (
    <>
      <PageHeader
        title="AI-Powered Reporting"
        description="Generate intelligent reports by analyzing system data for potential theft."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Generate Theft Report</CardTitle>
                <CardDescription>
                  Provide data in JSON format to generate an AI-powered theft analysis report. Sample data is pre-filled.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sales-data" className="font-headline">Sales Data</Label>
                  <Textarea
                    id="sales-data"
                    value={salesData}
                    onChange={(e) => setSalesData(e.target.value)}
                    className="h-32 font-code"
                    placeholder="Enter sales data as JSON..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inventory-data" className="font-headline">Inventory Data</Label>
                  <Textarea
                    id="inventory-data"
                    value={inventoryData}
                    onChange={(e) => setInventoryData(e.target.value)}
                    className="h-32 font-code"
                    placeholder="Enter inventory data as JSON..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-activity-data" className="font-headline">Employee Activity Data</Label>
                  <Textarea
                    id="employee-activity-data"
                    value={employeeActivityData}
                    onChange={(e) => setEmployeeActivityData(e.target.value)}
                    className="h-32 font-code"
                    placeholder="Enter employee activity data as JSON..."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Generate Report
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Generated Report</CardTitle>
              <CardDescription>The results of the AI analysis will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Analyzing data and generating report...</p>
                </div>
              )}
              {report && (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
                    {report}
                </div>
              )}
              {!isLoading && !report && (
                 <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4" />
                    <p>Your report will be displayed here after generation.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
