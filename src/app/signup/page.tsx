'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from '@/lib/types'; // Uses the updated Product type
import { Button, buttonVariants } from '@/components/ui/button'; // Corrected import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash, Edit } from 'lucide-react';
import { AddProductDialog } from '@/components/dashboard/AddProductDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), where('supplierId', '==', userProfile.uid));
      const querySnapshot = await getDocs(q);
      const productsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsList);
    } catch (error) {
      console.error("Error fetching products: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch products.' });
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
      await deleteDoc(doc(db, 'products', productId));
      toast({ title: 'Success', description: 'Product deleted successfully.' });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete product.' });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">MANAGE PRODUCTS TEST</h2>
        <Button onClick={handleAddProduct}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Product Catalog</CardTitle>
          <CardDescription>View, edit, and manage all your products.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                    <TableRow key={product.id}>
                      {/* *** CORRECTED IMAGE CELL *** */}
                      <TableCell className="hidden sm:table-cell">
                        {/* Explicitly check for a non-empty string */}
                        {product.imageDataUrl && product.imageDataUrl.length > 0 ? (
                          <Image
                            alt={product.name}
                            className="aspect-square rounded-md object-cover"
                            height={64}
                            src={product.imageDataUrl} // Now guaranteed to be a non-empty string
                            width={64}
                          />
                        ) : (
                          // Fallback when imageDataUrl is null, undefined, or empty string
                          <div className="aspect-square h-16 w-16 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            No Image
                          </div>
                        )}
                      </TableCell>
                      {/* *** END CORRECTED IMAGE CELL *** */}

                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">
                        {product.description}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <DropdownMenu>
                            {/* ... rest of the dropdown/dialog code ... */}
                          </DropdownMenu>
                          <AlertDialogContent>
                            {/* ... dialog content ... */}
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                 )) // Closing parenthesis for map
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No products found. Click &quot;Add Product&quot; to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
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