"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { PlusCircle, MinusCircle, X, Percent, FileWarning, ShoppingCart } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import type { Product } from '@/lib/types';
import { products as allProducts } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type CartItem = {
  product: Product;
  quantity: number;
};

export default function POSPage() {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter((item) => item.product.id !== productId);
    });
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleRestrictedAction = (action: string) => {
    toast({
      variant: "destructive",
      title: "Permission Denied",
      description: `Your role (${currentUser.role}) does not have permission to perform this action.`,
    })
  };

  const ManagerApprovalButton = ({ children, onApprove }: { children: React.ReactNode, onApprove: () => void }) => {
    if (currentUser.role === 'Manager' || currentUser.role === 'Admin') {
      return <Button variant="outline" className="w-full" onClick={onApprove}>{children}</Button>;
    }
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">{children}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Manager Approval Required</AlertDialogTitle>
                <AlertDialogDescription>
                    A manager must approve this action. For demo purposes, you can approve this yourself.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onApprove}>Approve</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
  }

  return (
    <>
      <PageHeader title="Point of Sale" description="Create new transactions and manage sales." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Products</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {allProducts.map((product) => (
                        <Card key={product.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => addToCart(product)}>
                            <Image
                                src={product.image}
                                alt={product.name}
                                width={200}
                                height={200}
                                className="w-full h-32 object-cover"
                                data-ai-hint={product.imageHint}
                            />
                            <div className="p-3">
                                <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                                <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                            </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Current Sale</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                    <ShoppingCart className="w-12 h-12 mb-4" />
                    <p>Your cart is empty.</p>
                    <p className="text-sm">Click on a product to add it to the sale.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                        data-ai-hint={item.product.imageHint}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">${item.product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.product.id)}>
                            <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addToCart(item.product)}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {cart.length > 0 && (
                <>
                <Separator />
                <CardContent className="pt-6 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (8%)</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button className="w-full" size="lg" onClick={() => {
                      toast({ title: 'Sale Complete!', description: `Total: $${total.toFixed(2)}`});
                      clearCart();
                  }}>
                    Complete Payment
                  </Button>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <ManagerApprovalButton onApprove={() => {
                        toast({ title: "Transaction Voided", description: "The current sale has been voided."});
                        clearCart();
                    }}>
                        <FileWarning className="w-4 h-4 mr-2" /> Void
                    </ManagerApprovalButton>
                    <ManagerApprovalButton onApprove={() => {
                        toast({ title: "Return Processed", description: "Return mode activated."});
                    }}>
                        <Percent className="w-4 h-4 mr-2" /> Return/Discount
                    </ManagerApprovalButton>
                  </div>
                </CardFooter>
                </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
