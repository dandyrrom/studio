<<<<<<< HEAD
'use client';

import { useState, useEffect, useMemo } from 'react';
=======
"use client";

import { useState, useEffect } from "react";
>>>>>>> cmb-sidev1
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  getDoc,
<<<<<<< HEAD
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
=======
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Order, OrderStatus } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Calendar,
  User,
  Package,
} from "lucide-react";
>>>>>>> cmb-sidev1

export default function OrdersPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplierNames, setSupplierNames] = useState<Record<string, string>>(
    {}
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const field = userProfile.role === "client" ? "clientId" : "supplierId";
      const q = query(
        collection(db, "orders"),
        where(field, "==", userProfile.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
<<<<<<< HEAD
      const ordersList: Order[] = [];
      const supplierIds = new Set<string>();

      querySnapshot.forEach(doc => {
=======
      const ordersList = querySnapshot.docs.map((doc) => {
>>>>>>> cmb-sidev1
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
      setFilteredOrders(ordersList);

<<<<<<< HEAD
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
=======
      // Preload supplier names for client view
      if (userProfile.role === "client") {
        const ids = Array.from(
          new Set(
            ordersList
              .map((o) => o.supplierId)
              .filter(
                (id): id is string => typeof id === "string" && id.length > 0
              )
          )
        );
        if (ids.length > 0) {
          const entries = await Promise.all(
            ids.map(async (uid) => {
              try {
                const snap = await getDoc(doc(db, "users", uid));
                const name =
                  (snap.exists() ? (snap.data() as any).displayName : null) ||
                  "Supplier";
                return [uid, name] as const;
              } catch {
                return [uid, "Supplier"] as const;
              }
            })
          );
          setSupplierNames(Object.fromEntries(entries));
        }
>>>>>>> cmb-sidev1
      }
      
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch orders.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchOrders();
    }
  }, [userProfile]);

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (userProfile?.role === "supplier" &&
            order.clientName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (userProfile?.role === "client" &&
            supplierNames[order.supplierId]
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(
            (order) => order.createdAt.toDateString() === now.toDateString()
          );
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter((order) => order.createdAt >= filterDate);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter((order) => order.createdAt >= filterDate);
          break;
      }
    }

    setFilteredOrders(filtered);
  }, [
    orders,
    searchTerm,
    statusFilter,
    dateFilter,
    supplierNames,
    userProfile?.role,
  ]);

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast({ title: "Success", description: "Order status updated." });
    } catch (error) {
<<<<<<< HEAD
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
=======
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status.",
      });
    }
  };
>>>>>>> cmb-sidev1

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handlePrintOrder = (order: Order) => {
    const printContent = `
      <html>
        <head>
          <title>Order ${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ORDER RECEIPT</h1>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Date:</strong> ${new Date(
              order.createdAt
            ).toLocaleDateString()} ${new Date(
      order.createdAt
    ).toLocaleTimeString()}</p>
            <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Information</div>
            <p><strong>${isSupplier ? "Client" : "Supplier"}:</strong> ${
      isSupplier ? order.clientName : supplierNames[order.supplierId]
    }</p>
          </div>

          <div class="section">
            <div class="section-title">Order Items</div>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${
                  order.items
                    ?.map(
                      (item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price?.toFixed(2)}</td>
                    <td>$${(item.quantity * item.price)?.toFixed(2)}</td>
                  </tr>
                `
                    )
                    .join("") || '<tr><td colspan="4">No items found</td></tr>'
                }
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                  <td><strong>$${order.total.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Order Summary</div>
            <p><strong>Total Items:</strong> ${
              order.items?.reduce(
                (sum: number, item: any) => sum + item.quantity,
                0
              ) || 0
            }</p>
            <p><strong>Order Total:</strong> $${order.total.toFixed(2)}</p>
            <p><strong>Order Date:</strong> ${new Date(
              order.createdAt
            ).toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleExportOrders = () => {
    const headers = ["Order ID", "Client/Supplier", "Date", "Total", "Status"];
    const csvData = filteredOrders.map((order) => [
      order.id,
      isSupplier ? order.clientName : supplierNames[order.supplierId],
      new Date(order.createdAt).toLocaleDateString(),
      `$${order.total.toFixed(2)}`,
      order.status,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Success", description: "Orders exported successfully." });
  };

  const statusVariant = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "shipped":
        return "default";
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
  };

  const isSupplier = userProfile?.role === "supplier";

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

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
<<<<<<< HEAD
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
=======
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isSupplier ? "Manage Orders" : "Your Orders"}
          </h2>
          <p className="text-muted-foreground">
            {isSupplier
              ? "Track and manage client orders"
              : "View your order history and status"}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleExportOrders}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{orderStats.total}</div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {orderStats.pending}
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {orderStats.shipped}
            </div>
            <p className="text-sm text-muted-foreground">Shipped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {orderStats.delivered}
            </div>
            <p className="text-sm text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: OrderStatus | "all") =>
                    setStatusFilter(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            {filteredOrders.length} of {orders.length} orders shown
            {searchTerm && ` • Searching for "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>{isSupplier ? "Client" : "Supplier"}</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      #{order.id.slice(-8)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {isSupplier
                        ? order.clientName || "Unknown client"
                        : supplierNames[order.supplierId] || "Supplier"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${order.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {isSupplier ? (
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            handleStatusChange(order.id, value as OrderStatus)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
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
                        <Badge
                          variant={statusVariant(order.status)}
                          className="capitalize"
                        >
                          {order.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handlePrintOrder(order)}
                        >
                          <FileText className="h-4 w-4" />
                          Print
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="text-muted-foreground">
                      No orders found.{" "}
                      {searchTerm && "Try adjusting your search or filters."}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              Complete information for order #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Order Date</p>
                    <p className="text-sm">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {isSupplier ? "Client" : "Supplier"}
                    </p>
                    <p className="text-sm">
                      {isSupplier
                        ? selectedOrder.clientName
                        : supplierNames[selectedOrder.supplierId]}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant={statusVariant(selectedOrder.status)}
                    className="capitalize mt-1"
                  >
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.price?.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            $
                            {((item.quantity || 0) * (item.price || 0)).toFixed(
                              2
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>Total Items:</span>
                  <span>
                    {selectedOrder.items?.reduce(
                      (sum: number, item: any) => sum + (item.quantity || 0),
                      0
                    ) || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
>>>>>>> cmb-sidev1
    </div>
  );
}