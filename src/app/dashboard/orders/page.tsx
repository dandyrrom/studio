
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplierNames, setSupplierNames] = useState<Record<string, string>>({});

  const fetchOrders = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const field = userProfile.role === 'client' ? 'clientId' : 'supplierId';
      const q = query(
        collection(db, 'orders'),
        where(field, '==', userProfile.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Order;
      });
      setOrders(ordersList);

      // Preload supplier names for client view
      if (userProfile.role === 'client') {
        const ids = Array.from(new Set(
          ordersList
            .map(o => o.supplierId)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        ));
        if (ids.length > 0) {
          const entries = await Promise.all(ids.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, 'users', uid));
              const name = (snap.exists() ? (snap.data() as any).displayName : null) || 'Supplier';
              return [uid, name] as const;
            } catch {
              return [uid, 'Supplier'] as const;
            }
          }));
          setSupplierNames(Object.fromEntries(entries));
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch orders.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userProfile]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast({ title: 'Success', description: 'Order status updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order status.' });
    }
  };
  
  const statusVariant = (status: OrderStatus) => {
    switch(status) {
        case 'pending': return 'default';
        case 'shipped': return 'secondary';
        case 'delivered': return 'outline';
        case 'cancelled': return 'destructive';
        default: return 'default';
    }
  }

  const isSupplier = userProfile?.role === 'supplier';

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">
        {isSupplier ? 'Manage Orders' : 'Your Orders'}
      </h2>
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            {isSupplier ? "A list of all orders from your clients." : "A list of your past orders."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>{isSupplier ? 'Client' : 'Supplier'}</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                    <TableCell>{isSupplier ? (order.clientName || 'Unknown client') : (supplierNames[order.supplierId] || 'Supplier')}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      {isSupplier ? (
                        <Select
                          defaultValue={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={statusVariant(order.status)} className="capitalize">{order.status}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
