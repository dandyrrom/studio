
'use client';

import { useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { generateTransactionSummaryReport } from '@/ai/flows/generate-transaction-summary-report';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ReportsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!userProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    setLoading(true);
    setReport(null);
    setError(null);

    try {
      // 1. Fetch completed orders for the supplier
      const ordersQuery = query(
        collection(db, 'orders'),
        where('supplierId', '==', userProfile.uid),
        where('status', 'in', ['delivered', 'shipped']),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(ordersQuery);

      if (querySnapshot.empty) {
        setError("No completed orders found to generate a report. Fulfill some orders first!");
        setLoading(false);
        return;
      }

      const ordersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          orderId: doc.id,
          total: data.total,
          status: data.status,
          createdAt: data.createdAt.toDate().toISOString(),
          items: data.items,
        };
      });

      // 2. Call the AI flow
      const result = await generateTransactionSummaryReport({
        transactionHistory: JSON.stringify(ordersData),
      });

      if (result.summaryReport) {
        setReport(result.summaryReport);
      } else {
        throw new Error('The AI model did not return a summary report.');
      }
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'An unexpected error occurred while generating the report.');
      toast({
        variant: 'destructive',
        title: 'Report Generation Failed',
        description: 'Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">AI-Powered Reports</h2>
      <Card>
        <CardHeader>
          <CardTitle>Sales Performance Summary</CardTitle>
          <CardDescription>
            Generate a concise summary report of your transaction history highlighting key sales performance indicators and trends using AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateReport} disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Generate Summary Report</>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Summary Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {report}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
