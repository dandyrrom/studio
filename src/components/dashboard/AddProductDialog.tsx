'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Define maximum Base64 string length (slightly less than 1 MiB to be safe)
const MAX_BASE64_LENGTH = 950 * 1024; // Approx 950 KB
// Define target dimensions for resizing
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const JPEG_QUALITY = 0.75; // Compression quality (0.0 to 1.0)

async function processImageForFirestore(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Invalid file type. Please select an image.'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file); // Read the original file first

    reader.onload = (readerEvent) => {
      const originalDataUrl = readerEvent.target?.result as string;
      if (!originalDataUrl) {
        return reject(new Error('Could not read file data.'));
      }
      const img = new Image();
      img.src = originalDataUrl;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Could not get canvas context for resizing.'));
        }

        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

        if (resizedDataUrl.length > MAX_BASE64_LENGTH) {
          return reject(new Error(`Image is too large (${Math.round(resizedDataUrl.length / 1024)} KB) even after resizing. Max size is ~${Math.round(MAX_BASE64_LENGTH / 1024)} KB.`));
        }
        resolve(resizedDataUrl);
      };
      img.onerror = (error) => {
        console.error("Image loading error:", error);
        reject(new Error('Could not load image for processing.'));
      };
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(new Error('Could not read file.'));
    };
  });
}


// --- UPDATED SCHEMA ---
const formSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  stockQuantity: z.coerce.number().int().nonnegative({ message: 'Stock must be 0 or more.' }),
  moq: z.coerce.number().int().positive({ message: 'MOQ must be at least 1.' }), // <-- ADDED
});
// --- END UPDATED SCHEMA ---

interface AddProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
  onSuccess: () => void;
}

export function AddProductDialog({ isOpen, setIsOpen, product, onSuccess }: AddProductDialogProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // --- UPDATED FORM TYPE ---
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      moq: 1, // <-- ADDED
    },
  });

  // --- UPDATED EFFECT ---
  useEffect(() => {
    if (isOpen) {
        if (product) {
            form.reset({
                name: product.name,
                description: product.description,
                price: product.price,
                stockQuantity: product.stockQuantity,
                moq: product.moq || 1, // <-- ADDED
            });
            setImageDataUrl(product.imageDataUrl || null);
        } else {
            form.reset({
                name: '',
                description: '',
                price: 0,
                stockQuantity: 0,
                moq: 1, // <-- ADDED
            });
            setImageDataUrl(null);
        }
        setImageFile(null);
        setImageError(null);
    }
  }, [product, form, isOpen]);
  // --- END UPDATED EFFECT ---


  // --- UPDATED ONSUBMIT ---
  async function onSubmit(values: FormValues) {
    if (!userProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    const finalImageDataUrl = imageDataUrl || product?.imageDataUrl;

    if (!product && !finalImageDataUrl) {
        setImageError('Please select and process an image.');
        toast({ variant: 'destructive', title: 'Error', description: 'Product image is missing.' });
        return;
    }
    if (imageError) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fix the image error before saving.' });
        return;
    }

    setLoading(true);

    try {
      const productData = {
        name: values.name,
        description: values.description,
        price: values.price,
        stockQuantity: values.stockQuantity,
        moq: values.moq, // <-- ADDED
        imageDataUrl: finalImageDataUrl || null,
        supplierId: userProfile.uid,
        supplierName: userProfile.displayName || 'Unknown Supplier',
      };

      if (product) {
        await setDoc(doc(db, 'products', product.id), productData, { merge: true });
        toast({ title: 'Success', description: 'Product updated successfully.' });
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast({ title: 'Success', description: 'Product added successfully.' });
      }
      onSuccess();
      setIsOpen(false);
      setImageFile(null);
      setImageDataUrl(null);
      setImageError(null);

    } catch (error: any) {
      console.error("Firestore save error:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save product data.' });
    } finally {
      setLoading(false);
    }
  }
  // --- END UPDATED ONSUBMIT ---

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the details of your product.' : 'Fill in the details for your new product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Heavy Duty Gearbox" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the product..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* --- PRICE AND STOCK/MOQ ON SAME ROW --- */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="99.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Qty</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="moq"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MOQ</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* --- END PRICE/STOCK/MOQ ROW --- */}

             <FormItem>
                <FormLabel>Product Image</FormLabel>
                <FormControl>
                    <Input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        setImageFile(file || null);
                        setImageError(null);
                        setImageDataUrl(null);

                        if (file) {
                        setLoading(true);
                        try {
                            const processedDataUrl = await processImageForFirestore(file);
                            setImageDataUrl(processedDataUrl);
                        } catch (error: any) {
                            console.error("Image processing error:", error);
                            setImageError(error.message || "Failed to process image.");
                            setImageFile(null);
                        } finally {
                            setLoading(false);
                        }
                        }
                    }}
                    className="file:text-foreground"
                    />
                </FormControl>
                {imageError && <p className="text-sm font-medium text-destructive">{imageError}</p>}
                {imageDataUrl && !imageError && (
                    <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">Image Preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageDataUrl} alt="Preview" className="max-h-32 rounded border" />
                    </div>
                )}
                {!imageDataUrl && product?.imageDataUrl && !imageError && (
                    <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">Current Image:</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.imageDataUrl} alt="Current product image" className="max-h-32 rounded border" />
                        <p className="text-xs text-muted-foreground mt-1">Select a new file above to replace it.</p>
                    </div>
                )}
                <FormMessage />
            </FormItem>


            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Processing...' : (product ? 'Save Changes' : 'Add Product')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
