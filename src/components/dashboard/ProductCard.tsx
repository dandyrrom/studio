'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const moq = product.moq || 1; // Get MOQ, default to 1

  return (
    <Card className="flex flex-col">
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
          {product.imageDataUrl ? (
            <Image
                src={product.imageDataUrl}
                alt={product.name}
                fill
                className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              No Image Available
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          By {product.supplierName}
        </CardDescription>
        <p className="mt-2 text-foreground/90 text-sm line-clamp-2">{product.description}</p>
        {/* --- ADDED MOQ DISPLAY --- */}
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Min. Order: {moq} {moq > 1 ? 'units' : 'unit'}
        </p>
        {/* --- END MOQ DISPLAY --- */}
      </CardContent>

      {/* --- UPDATED CARD FOOTER --- */}
      <CardFooter className="p-4 flex items-center justify-between">
        <p className="text-xl font-bold text-primary">
          ${product.price.toFixed(2)}
        </p>
        {product.stockQuantity > 0 ? (
          <Button onClick={() => addToCart(product, moq)}>
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to cart
          </Button>
        ) : (
          <Badge variant="destructive">Out of Stock</Badge>
        )}
      </CardFooter>
      {/* --- END UPDATED CARD FOOTER --- */}
    </Card>
  );
}