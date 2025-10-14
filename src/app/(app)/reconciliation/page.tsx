"use client"

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const EXPECTED_AMOUNT = 1254.75;

export default function ReconciliationPage() {
  const [countedAmount, setCountedAmount] = useState('');
  const [discrepancy, setDiscrepancy] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = parseFloat(countedAmount);
    if (!isNaN(counted)) {
      setDiscrepancy(counted - EXPECTED_AMOUNT);
      setIsDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCountedAmount('');
    setDiscrepancy(null);
  }

  return (
    <>
      <PageHeader
        title="Blind Cash Reconciliation"
        description="Count and submit the cash drawer total for your shift."
      />
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>End of Shift Reconciliation</CardTitle>
              <CardDescription>
                Please count the total amount in your cash drawer and enter it below. Do not include the initial float.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="counted-amount">Total Counted Amount</Label>
                  <Input
                    id="counted-amount"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 1255.50"
                    value={countedAmount}
                    onChange={(e) => setCountedAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Submit Count</Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reconciliation Summary</AlertDialogTitle>
            <AlertDialogDescription>
              The system has compared your count with the expected total.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {discrepancy !== null && (
            <div className="space-y-4 my-4 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Amount:</span>
                    <span className="font-mono">${EXPECTED_AMOUNT.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Counted Amount:</span>
                    <span className="font-mono">${parseFloat(countedAmount).toFixed(2)}</span>
                </div>
                <div className={cn("flex justify-between font-bold p-2 rounded-md", 
                    discrepancy === 0 ? "bg-green-100 dark:bg-green-900/50" : "bg-red-100 dark:bg-red-900/50"
                )}>
                    <span className={cn(discrepancy === 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")}>
                        Discrepancy:
                    </span>
                    <span className={cn("font-mono", discrepancy === 0 ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")}>
                        {discrepancy > 0 ? '+' : ''}${discrepancy.toFixed(2)}
                    </span>
                </div>
                {discrepancy !== 0 && (
                     <p className="text-xs text-destructive">A discrepancy has been flagged and reported to management.</p>
                )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseDialog}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
