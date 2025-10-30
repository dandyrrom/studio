'use client';

import { useState } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
// --- IMPORT PATH UPDATED ---
import { generateTransactionSummaryReport } from '@/ai/flows/generate-transaction-summary-report';
import { type ReportInput, type ReportOutput } from '@/lib/types'; // <-- THIS LINE IS CHANGED
// ---
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Calendar as CalendarIcon, Check, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { type Order } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// Helper: Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export default function ReportsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const handleGenerateReport = async () => {
    if (!userProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    if (!date || !date.from || !date.to) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a valid date range.' });
      return;
    }

    setLoading(true);
    setReport(null);
    setError(null);

    try {
      const dateFrom = new Date(date.from.setHours(0, 0, 0, 0));
      const dateTo = new Date(date.to.setHours(23, 59, 59, 999));

      const startDate = Timestamp.fromDate(dateFrom);
      const endDate = Timestamp.fromDate(dateTo);

      const ordersQuery = query(
        collection(db, 'orders'),
        where('supplierId', '==', userProfile.uid),
        where('status', 'in', ['delivered', 'shipped']),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      const querySnapshot = await getDocs(ordersQuery);

      let totalRevenue = 0;
      const clientIds = new Set<string>();
      const itemMap = new Map<string, { quantity: number }>();

      querySnapshot.forEach(doc => {
        const order = doc.data() as Omit<Order, 'id' | 'createdAt'> & { createdAt: Timestamp };
        totalRevenue += order.total;
        clientIds.add(order.clientId);

        order.items.forEach(item => {
          const existing = itemMap.get(item.name) || { quantity: 0 };
          itemMap.set(item.name, {
            quantity: existing.quantity + item.quantity,
          });
        });
      });

      const totalOrders = querySnapshot.size;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      const topSellingItems = Array.from(itemMap.entries())
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 5)
        .map(([name, data]) => ({ name, quantity: data.quantity }));

      const reportInput: ReportInput = {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        totalClients: clientIds.size,
        topSellingItems,
        dateRange: {
          from: format(date.from, 'LLL dd, y'),
          to: format(date.to, 'LLL dd, y'),
        },
      };

      const result = await generateTransactionSummaryReport(reportInput);

      if (result) {
        setReport(result);
      } else {
        throw new Error('The AI model did not return a valid report.');
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
            Select a date range to generate an AI-powered report on your sales performance, key trends, and actionable insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

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

      {loading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Separator />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {report && !loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{report.headline}</CardTitle>
            <CardDescription>{report.salesTrend}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(report.totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{report.totalOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(report.averageOrderValue)}</p>
                </CardContent>
              </Card>
            </div>
            
            <Separator />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  Key Insights
                </h3>
                <ul className="list-disc list-outside space-y-2 pl-5 text-foreground/90">
                  {report.keyInsights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5 text-accent-foreground fill-accent" />
                  Actionable Suggestions
                </h3>
                <ol className="list-decimal list-outside space-y-2 pl-5 text-foreground/90">
                  {report.actionableSuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}