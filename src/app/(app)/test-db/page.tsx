'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { testDbWrite } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestDbPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTestWrite = async () => {
    setIsLoading(true);
    const result = await testDbWrite();
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Success!',
        description: `Successfully wrote document with ID: ${result.docId}`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Firestore Write Failed',
        description: result.error || 'An unknown error occurred.',
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Firestore Connection Test"
        description="Use this page to verify that the app can write to the Firestore database."
      />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Database Write Test</CardTitle>
          <CardDescription>
            Click the button below to attempt to write a test document to a
            collection named 'test_writes' in your Firestore database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTestWrite} disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : (
              <Database className="mr-2" />
            )}
            Test Firestore Write
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
