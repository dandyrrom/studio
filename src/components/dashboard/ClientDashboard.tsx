'use client';

import { useState, useEffect } from 'react';
// --- IMPORT 'where' ---
import { collection, getDocs, query, where } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsCollection = collection(db, 'products');
        
        // --- UPDATED QUERY ---
        // Only fetch products where stockQuantity is greater than 0
        const productQuery = query(
          productsCollection, 
          where("stockQuantity", ">", 0)
        );
        // --- END UPDATED QUERY ---

        const productSnapshot = await getDocs(productQuery);
        const productsList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsList);
      } catch (error) {
        console.error("Error fetching products:", error);
        // This error will likely appear in the console on first run.
        // See the note about Firestore Index below.
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Product Catalog</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-2/5" />
              </div>
            </div>
          ))
        ) : products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p className="text-muted-foreground col-span-full text-center">
            No products available at the moment.
          </p>
        )}
      </div>
    </div>
  );
}