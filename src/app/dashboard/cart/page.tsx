"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Trash,
  Loader2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Shield,
  Truck,
  Clock,
} from "lucide-react";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    itemCount,
  } = useCart();
  const { userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    // Find the product to check its MOQ
    const item = cart.find(i => i.product.id === productId);
    const moq = item?.product.moq || 1;

    if (newQuantity < moq) {
      // Don't remove, just enforce MOQ (updateQuantity will handle it)
      updateQuantity(productId, newQuantity);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleIncrement = (productId: string, currentQuantity: number) => {
    handleQuantityChange(productId, currentQuantity + 1);
  };

  const handleDecrement = (productId: string, currentQuantity: number) => {
    // Find the product to check its MOQ
    const item = cart.find(i => i.product.id === productId);
    const moq = item?.product.moq || 1;

    // Prevent decrementing below MOQ, but allow removal if desired
    // The updateQuantity context logic will catch < MOQ and reset to MOQ
    const newQuantity = currentQuantity - 1;
    if (newQuantity < moq) {
      updateQuantity(productId, newQuantity); // Let context handle toast and reset
    } else {
      handleQuantityChange(productId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (!userProfile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to checkout.",
      });
      router.push("/login");
      return;
    }
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Your cart is empty.",
      });
      return;
    }

    setLoading(true);
    try {
      // Create separate orders for each supplier
      const ordersBySupplier = cart.reduce((acc, item) => {
        const supplierId = item.product.supplierId;
        if (!acc[supplierId]) {
          acc[supplierId] = {
            clientId: userProfile.uid,
            clientName: userProfile.displayName,
            supplierId: supplierId,
            items: [],
            total: 0,
            status: "pending",
            createdAt: serverTimestamp(),
          };
        }
        acc[supplierId].items.push({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          imageDataUrl: item.product.imageDataUrl,
        });
        acc[supplierId].total += item.product.price * item.quantity;
        return acc;
      }, {} as any);

      // Create orders for each supplier
      const orderPromises = Object.values(ordersBySupplier).map((order: any) =>
        addDoc(collection(db, "orders"), order)
      );

      await Promise.all(orderPromises);

      toast({
        title: "Order Placed Successfully!",
        description: `Your ${itemCount} item${
          itemCount > 1 ? "s" : ""
        } will be processed soon.`,
      });
      clearCart();
      router.push("/dashboard/orders");
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to place order. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const shippingFee = 0; // Free shipping
  const tax = cartTotal * 0.08; // 8% tax
  const finalTotal = cartTotal + shippingFee + tax;

  // Group items by supplier
  const itemsBySupplier = cart.reduce((acc, item) => {
    const supplierId = item.product.supplierId;
    if (!acc[supplierId]) {
      acc[supplierId] = [];
    }
    acc[supplierId].push(item);
    return acc;
  }, {} as any);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Shopping Cart</h2>
          <p className="text-muted-foreground">Review and manage your items</p>
        </div>
      </div>

      {cart.length > 0 ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Summary Badge */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-sm">
                <ShoppingBag className="h-3 w-3 mr-1" />
                {itemCount} item{itemCount > 1 ? "s" : ""} in cart
              </Badge>
              <Button variant="outline" size="sm" onClick={clearCart}>
                <Trash className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </div>

            {/* Items Grouped by Supplier */}
            {Object.entries(itemsBySupplier).map(([supplierId, items]) => (
              <Card key={supplierId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>Supplier Order</span>
                    <Badge variant="outline">
                      {(items as any[]).length} items
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {(items as any[]).map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center p-6"
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {item.product.imageDataUrl &&
                        item.product.imageDataUrl.length > 0 ? (
                          <Image
                            src={item.product.imageDataUrl}
                            alt={item.product.name}
                            width={96}
                            height={96}
                            className="rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground border">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="ml-4 flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-muted-foreground mt-1 line-clamp-2">
                          {item.product.description ||
                            "No description available"}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-2xl font-bold text-primary">
                            ${item.product.price.toFixed(2)}
                          </span>
                          <Badge variant="secondary">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </Badge>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleDecrement(item.product.id, item.quantity)
                            }
                            className="h-8 w-8"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min={item.product.moq || 1} // <-- SET MIN TO MOQ
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.product.id,
                                parseInt(e.target.value) || (item.product.moq || 1) // Fallback to MOQ
                              )
                            }
                            className="w-16 h-8 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleIncrement(item.product.id, item.quantity)
                            }
                            className="h-8 w-8"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your order details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({itemCount} items)</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                {/* Coupon Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Coupon Code</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">
                      Apply
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Including ${tax.toFixed(2)} in taxes
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex-col space-y-4">
                <Button
                  className="w-full h-12 text-lg"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Checkout - $${finalTotal.toFixed(2)}`
                  )}
                </Button>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <Shield className="h-4 w-4 mb-1" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Truck className="h-4 w-4 mb-1" />
                    <span>Free Shipping</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Clock className="h-4 w-4 mb-1" />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </CardFooter>
            </Card>

            {/* Continue Shopping */}
            <Card>
              <CardContent className="p-4">
                <Button variant="outline" className="w-full" asChild>
                  <a href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continue Shopping
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Empty Cart State */
        <Card className="text-center py-16 max-w-md mx-auto">
          <CardContent className="space-y-6">
            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Your cart is empty</h3>
              <p className="text-muted-foreground mt-2">
                Looks like you haven't added any products to your cart yet.
              </p>
            </div>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <a href="/dashboard">Browse Products</a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href="/dashboard/orders">View Past Orders</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}