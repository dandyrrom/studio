'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash, Edit, Package, Search } from 'lucide-react';
import { AddProductDialog } from '@/components/dashboard/AddProductDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "products"),
        where("supplierId", "==", userProfile.uid)
      );
      const querySnapshot = await getDocs(q);
      const productsList = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setProducts(productsList);
    } catch (error) {
      console.error("Error fetching products: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchProducts();
    }
  }, [userProfile]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, "products", productId));
      toast({ title: "Success", description: "Product deleted successfully." });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete product.' });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const renderLoadingSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="hidden sm:table-cell">Status</TableHead>
          <TableHead className="hidden sm:table-cell">Stock</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell className="hidden sm:table-cell"><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderProductTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="hidden sm:table-cell">Status</TableHead>
          <TableHead className="hidden sm:table-cell">Stock</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedProducts.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="hidden sm:table-cell">
              {product.imageDataUrl && product.imageDataUrl.length > 0 ? (
                <Image
                  alt={product.name}
                  className="aspect-square rounded-md object-cover"
                  height={64}
                  src={product.imageDataUrl}
                  width={64}
                />
              ) : (
                <div className="aspect-square h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </TableCell>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell className="hidden sm:table-cell">
              {product.stockQuantity > 0 ? (
                 <Badge variant="outline">Published</Badge>
              ) : (
                <Badge variant="destructive">Archived</Badge>
              )}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {product.stockQuantity > 0 ? (
                `${product.stockQuantity} in stock`
              ) : (
                <span className="text-destructive">Out of Stock</span>
              )}
            </TableCell>
            <TableCell>${product.price.toFixed(2)}</TableCell>
            <TableCell>
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-red-600 focus:text-red-600">
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the product
                      &quot;{product.name}&quot;.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
      <Package className="h-16 w-16 text-muted-foreground" />
      <h3 className="text-xl font-semibold">No Products Yet</h3>
      <p className="text-muted-foreground">
        Get started by adding your first product to your catalog.
      </p>
      <Button onClick={handleAddProduct}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Product
      </Button>
    </div>
  );

  const renderNoResults = () => (
    <div className="py-16 text-center">
      <Search className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-xl font-semibold">No Products Found</h3>
      <p className="mt-2 text-muted-foreground">
        Your search for &quot;{searchTerm}&quot; did not match any products.
      </p> {/* <-- *** THIS IS THE CORRECTED LINE *** */}
      <Button variant="link" onClick={() => setSearchTerm('')}>
        Clear Search
      </Button>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Manage Products</h2>
        <Button onClick={handleAddProduct}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            View, edit, and manage all your products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            renderLoadingSkeleton()
          ) : products.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter products by name or description..."
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              
              {paginatedProducts.length > 0
                ? renderProductTable()
                : renderNoResults()
              }
            </>
          )}
        </CardContent>

        {!loading && products.length > 0 && totalPages > 1 && (
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

      <AddProductDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />
    </>
  );
}