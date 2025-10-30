'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Interface for our aggregated client data
interface ClientStat {
  id: string;
  name: string;
  orderCount: number;
  totalValue: number;
}

export default function ClientsPage() {
  const { userProfile } = useAuth();
  const [clientStats, setClientStats] = useState<ClientStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to get initials from a name
  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };

  // Memoized aggregation of orders into client stats
  const aggregateClientData = (orders: Order[]): ClientStat[] => {
    const statsMap = new Map<string, ClientStat>();

    orders.forEach(order => {
      // Ensure clientName exists before processing
      if (!order.clientName) return;
      
      const client = statsMap.get(order.clientId);

      if (client) {
        // Update existing client
        client.orderCount += 1;
        client.totalValue += order.total;
      } else {
        // Add new client
        statsMap.set(order.clientId, {
          id: order.clientId,
          name: order.clientName,
          orderCount: 1,
          totalValue: order.total,
        });
      }
    });

    // Convert map to array and sort by total value (descending)
    return Array.from(statsMap.values()).sort((a, b) => b.totalValue - a.totalValue);
  };

  useEffect(() => {
    const fetchClientData = async () => {
      if (!userProfile) return;
      setLoading(true);
      try {
        // Fetch all orders for this supplier
        const q = query(
          collection(db, 'orders'),
          where('supplierId', '==', userProfile.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const ordersList = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Ensure createdAt is converted from Timestamp if needed
              createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            } as Order;
        });

        // Aggregate the data
        const aggregatedData = aggregateClientData(ordersList);
        setClientStats(aggregatedData);

      } catch (error) {
        console.error('Error fetching client data:', error);
        // You might want to add a toast here
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
        fetchClientData();
    }
  }, [userProfile]);

  const renderLoadingSkeleton = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
      </TableRow>
    ))
  );

  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={3}>
        <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
          <Users className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">No Clients Found</h3>
          <p className="text-muted-foreground">
            Once clients place orders, their information will appear here.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Your Clients</h2>
      <Card>
        <CardHeader>
          <CardTitle>Client Overview</CardTitle>
          <CardDescription>
            A summary of all clients who have placed orders with you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? renderLoadingSkeleton()
                : clientStats.length > 0
                  ? clientStats.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{client.orderCount}</TableCell>
                      <TableCell>{client.totalValue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                  : renderEmptyState()
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}