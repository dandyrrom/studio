
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Trash, Loader2 } from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount } = useCart();
  const { userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!userProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to checkout.' });
      router.push('/login');
      return;
    }
    if (cart.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Your cart is empty.' });
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        clientId: userProfile.uid,
        clientName: userProfile.displayName,
        supplierId: cart[0].product.supplierId,
        items: cart.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
        })),
        total: cartTotal,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      toast({ title: 'Success', description: 'Your order has been placed!' });
      clearCart();
      router.push('/dashboard/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to place order. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Shopping Cart</h2>
      {cart.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Items</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center py-4">
                    {item.product.imageDataUrl && item.product.imageDataUrl.length > 0 ? (
                      <Image
                        src={item.product.imageDataUrl}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                    <div className="ml-4 flex-1">
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">${item.product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                        className="w-16 h-9"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your order before checking out.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleCheckout} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <h3 className="text-xl font-semibold">Your cart is empty</h3>
            <p className="text-muted-foreground mt-2">
              Browse products and add them to your cart to get started.
            </p>
            <Button asChild className="mt-4">
              <a href="/dashboard">Continue Shopping</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
