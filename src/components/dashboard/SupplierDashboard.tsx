
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function SupplierDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({ totalRevenue: 0, totalSales: 0, activeProducts: 0, newClients: 0 });
  const [recentSales, setRecentSales] = useState<Order[]>([]);
  const [salesByMonth, setSalesByMonth] = useState(chartData);
  const [loading, setLoading] = useState(true);

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
          const order = doc.data() as Order;
          if(order.status === 'delivered' || order.status === 'shipped') {
            totalRevenue += order.total;
            const month = new Date(order.createdAt).getMonth();
            salesByMonthData[month].total += order.total;
          }
          clientIds.add(order.clientId);
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

        const recentSalesQuery = query(collection(db, 'orders'), where('supplierId', '==', userProfile.uid), orderBy('createdAt', 'desc'), limit(5));
        const recentSalesSnapshot = await getDocs(recentSalesQuery);
        const sales = recentSalesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
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
                <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">From all completed sales</p>
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
            <div className="space-y-8">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{sale.clientName.substring(0,2)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{sale.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">+${sale.total.toFixed(2)}</div>
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
