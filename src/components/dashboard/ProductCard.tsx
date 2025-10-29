'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types'; // Uses the updated Product type
import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <Card className="flex flex-col">
      {/* *** MODIFIED IMAGE HEADER *** */}
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted"> {/* Added bg-muted for fallback */}
          {product.imageDataUrl ? (
            <Image
                src={product.imageDataUrl} // Use the Base64 data URL
                alt={product.name}
                fill
                className="object-cover"
                // Removed data-ai-hint
            />
          ) : (
            // Display placeholder text or icon if no image
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              No Image Available
            </div>
          )}
        </div>
      </CardHeader>
      {/* *** END MODIFIED IMAGE HEADER *** */}

      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold">{product.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          By {product.supplierName}
        </CardDescription>
        <p className="mt-2 text-foreground/90 text-sm line-clamp-2">{product.description}</p>
      </CardContent>
      <CardFooter className="p-4 flex items-center justify-between">
        <p className="text-xl font-bold text-primary">
          ${product.price.toFixed(2)}
        </p>
        <Button onClick={() => addToCart(product, 1)}>
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to cart
        </Button>
      </CardFooter>
    </Card>
  );
}