
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const chartData = [
  { name: 'Jan', total: 0 },
  { name: 'Feb', total: 0 },
  { name: 'Mar', total: 0 },
  { name: 'Apr', total: 0 },
  { name: 'May', total: 0 },
  { name: 'Jun', total: 0 },
  { name: 'Jul', total: 0 },
  { name: 'Aug', total: 0 },
  { name: 'Sep', total: 0 },
  { name: 'Oct', total: 0 },
  { name: 'Nov', total: 0 },
  { name: 'Dec', total: 0 },
];

function RevenueDelta({ salesByMonth }: { salesByMonth: Array<{ name: string; total: number }> }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const prevMonth = (currentMonth + 11) % 12;
  const cur = salesByMonth[currentMonth]?.total ?? 0;
  const prev = salesByMonth[prevMonth]?.total ?? 0;
  const diff = cur - prev;
  const up = diff >= 0;
  const pct = prev > 0 ? Math.abs(diff) / prev * 100 : (cur > 0 ? 100 : 0);
  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
      {up ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
      <span className={up ? 'text-emerald-600' : 'text-red-600'}>
        {up ? '+' : '-'}{pct.toFixed(0)}%
      </span>
      <span>vs last month</span>
    </div>
  );
}

export default function SupplierDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({ totalRevenue: 0, totalSales: 0, activeProducts: 0, newClients: 0 });
  const [recentSales, setRecentSales] = useState<Order[]>([]);
  const [salesByMonth, setSalesByMonth] = useState(chartData);
  const [loading, setLoading] = useState(true);

  const currency = (v: number) =>
    v.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  useEffect(() => {
    if (!userProfile) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const ordersQuery = query(collection(db, 'orders'), where('supplierId', '==', userProfile.uid));
        const ordersSnapshot = await getDocs(ordersQuery);
        
        let totalRevenue = 0;
        const salesByMonthData = [...chartData];
        const clientIds = new Set<string>();

        ordersSnapshot.forEach(doc => {
          const data = doc.data() as any;
          const total = typeof data.total === 'number' ? data.total : Number(data.total) || 0;
          const createdAt: Date | null = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : (data.createdAt ? new Date(data.createdAt) : null);
          const status = data.status as Order['status'];

          if(status === 'delivered' || status === 'shipped') {
            totalRevenue += total;
            if (createdAt && !Number.isNaN(createdAt.getTime())) {
              const month = createdAt.getMonth();
              if (month >= 0 && month < salesByMonthData.length) {
                if (!salesByMonthData[month]) {
                  salesByMonthData[month] = { name: chartData[month]?.name || String(month + 1), total: 0 } as any;
                }
                salesByMonthData[month].total += total;
              }
            }
          }
          if (typeof data.clientId === 'string' && data.clientId.length > 0) {
            clientIds.add(data.clientId);
          }
        });
        
        setSalesByMonth(salesByMonthData);

        const productsQuery = query(collection(db, 'products'), where('supplierId', '==', userProfile.uid));
        const productsSnapshot = await getDocs(productsQuery);

        setStats({
          totalRevenue,
          totalSales: ordersSnapshot.size,
          activeProducts: productsSnapshot.size,
          newClients: clientIds.size,
        });

        const recentSalesQuery = query(
          collection(db, 'orders'),
          where('supplierId', '==', userProfile.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSalesSnapshot = await getDocs(recentSalesQuery);
        const sales = recentSalesSnapshot.docs.map(d => {
          const data = d.data() as any;
          const createdAt: Date | null = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : (data.createdAt ? new Date(data.createdAt) : null);
          const total = typeof data.total === 'number' ? data.total : Number(data.total) || 0;
          return {
            id: d.id,
            ...data,
            createdAt: createdAt || new Date(0),
            total,
          } as Order;
        });
        setRecentSales(sales);

      } catch (error) {
        console.error("Error fetching supplier dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);


  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currency(stats.totalRevenue)}</div>
                <RevenueDelta salesByMonth={salesByMonth} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.totalSales}</div>
                <p className="text-xs text-muted-foreground">Total orders received</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeProducts}</div>
                <p className="text-xs text-muted-foreground">Products in your catalog</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.newClients}</div>
                <p className="text-xs text-muted-foreground">Clients who have ordered</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loading ? <Skeleton className="h-[350px]" /> :
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <RechartsTooltip formatter={(v: any) => currency(Number(v) || 0)} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>}
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>You made {recentSales.length} sales recently.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </div> : 
            <div className="space-y-6">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{sale.clientName.substring(0,2)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{sale.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString()} · <span className="font-mono">{sale.id}</span>
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <Badge variant={sale.status === 'delivered' ? 'outline' : (sale.status === 'shipped' ? 'secondary' : 'default')} className="capitalize">
                      {sale.status}
                    </Badge>
                    <div className="font-medium">+{currency(sale.total)}</div>
                  </div>
                </div>
              ))}
              {recentSales.length === 0 && <p className="text-sm text-muted-foreground text-center">No recent sales found.</p>}
            </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
