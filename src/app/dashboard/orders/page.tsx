'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  documentId,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Package, Clipboard } from 'lucide-react'; // Added Clipboard icon

const ITEMS_PER_PAGE = 10;

export default function OrdersPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplierNames, setSupplierNames] = useState<Record<string, string>>({});

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

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
      const ordersList: Order[] = [];
      const supplierIds = new Set<string>();

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const order = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Order;
        ordersList.push(order);
        
        if (userProfile.role === 'client') {
          supplierIds.add(order.supplierId);
        }
      });
      
      setOrders(ordersList);

      if (userProfile.role === 'client' && supplierIds.size > 0) {
        const suppliersQuery = query(
          collection(db, 'users'),
          where(documentId(), 'in', Array.from(supplierIds))
        );
        const suppliersSnapshot = await getDocs(suppliersQuery);
        const namesMap: Record<string, string> = {};
        suppliersSnapshot.forEach(doc => {
          namesMap[doc.id] = doc.data().displayName || 'Unknown Supplier';
        });
        setSupplierNames(namesMap);
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch orders.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchOrders();
    }
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
      console.error("Error updating status:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order status.' });
    }
  };
  
  const getStatusVariant = (status: OrderStatus) => {
    switch(status) {
        case 'pending': return 'default';
        case 'shipped': return 'secondary';
        case 'delivered': return 'outline';
        case 'cancelled': return 'destructive';
        default: return 'default';
    }
  }

  const isSupplier = userProfile?.role === 'supplier';

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  const renderLoadingSkeleton = () => (
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-8 w-28" /></TableCell>
      </TableRow>
    ))
  );
  
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
      <Package className="h-16 w-16 text-muted-foreground" />
      <h3 className="text-xl font-semibold">No Orders Found</h3>
      <p className="text-muted-foreground">
        {isSupplier 
          ? "You haven't received any orders yet." 
          : "You haven't placed any orders yet."
        }
      </p>
    </div>
  );
  
  const renderNoResults = () => (
    <TableRow>
      <TableCell colSpan={5} className="h-24 text-center">
        No orders found for the &quot;{statusFilter}&quot; status.
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">
        {isSupplier ? 'Manage Orders' : 'Your Orders'}
      </h2>
      
      <Tabs defaultValue="all" onValueChange={(value) => {
        setStatusFilter(value as OrderStatus | 'all');
        setCurrentPage(1);
      }}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value={statusFilter}>
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                {isSupplier ? "A list of all orders from your clients." : "A list of your past orders."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>{isSupplier ? 'Client' : 'Supplier'}</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderLoadingSkeleton()}
                  </TableBody>
                </Table>
              ) : orders.length === 0 ? (
                renderEmptyState()
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>{isSupplier ? 'Client' : 'Supplier'}</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.length > 0 ? paginatedOrders.map((order) => (
                      <TableRow key={order.id}>
                        {/* --- UPDATED CELL --- */}
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span>...{order.id.slice(-6)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(order.id);
                                toast({ title: "Copied!", description: "Order ID copied to clipboard." });
                              }}
                            >
                              <Clipboard className="h-3 w-3" />
                              <span className="sr-only">Copy Order ID</span>
                            </Button>
                          </div>
                        </TableCell>
                        {/* --- END UPDATED CELL --- */}
                        
                        <TableCell>
                          {isSupplier ? order.clientName : (supplierNames[order.supplierId] || <Skeleton className="h-4 w-32" />)}
                        </TableCell>
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
                            <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      renderNoResults()
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>

            {!loading && orders.length > 0 && totalPages > 1 && (
              <CardFooter>
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}

          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}