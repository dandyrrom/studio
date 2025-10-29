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

        // Calculate new dimensions while maintaining aspect ratio
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

        // Create a canvas to draw the resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Could not get canvas context for resizing.'));
        }

        // Draw the image onto the canvas (resizing it)
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to data URL (JPEG for compression)
        const resizedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

        console.log(`Original size: ~${Math.round(originalDataUrl.length / 1024)} KB`);
        console.log(`Resized size: ~${Math.round(resizedDataUrl.length / 1024)} KB`);

        // Validate the size of the final Base64 string
        if (resizedDataUrl.length > MAX_BASE64_LENGTH) {
          return reject(new Error(`Image is too large (${Math.round(resizedDataUrl.length / 1024)} KB) even after resizing. Max size is ~${Math.round(MAX_BASE64_LENGTH / 1024)} KB. Please use a smaller or less complex image.`));
        }

        resolve(resizedDataUrl); // Return the valid data URL
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


// Schema *without* the image field, as it's handled separately
const formSchema = z.object({
  name: z.string().min(3, { message: 'Product name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
});

interface AddProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null; // Note: Product type now uses imageDataUrl
  onSuccess: () => void;
}

export function AddProductDialog({ isOpen, setIsOpen, product, onSuccess }: AddProductDialogProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null); // Raw file state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null); // Processed data URL state
  const [imageError, setImageError] = useState<string | null>(null); // Image processing/validation error

  // Define the type for the form values based on the schema
  type FormValues = Omit<z.infer<typeof formSchema>, 'image'>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
    },
  });

  // Effect to reset form and image state when dialog opens or product changes
  useEffect(() => {
    if (isOpen) {
        if (product) {
            form.reset({
                name: product.name,
                description: product.description,
                price: product.price,
            });
            // Set initial imageDataUrl from existing product (for preview)
            setImageDataUrl(product.imageDataUrl || null);
        } else {
            form.reset({
                name: '',
                description: '',
                price: 0,
            });
            setImageDataUrl(null); // Clear image for new product
        }
        // Always reset file input state when dialog opens
        setImageFile(null);
        setImageError(null);
    }
  }, [product, form, isOpen]);


  async function onSubmit(values: FormValues) {
    if (!userProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    // --- Validation ---
    // Determine the imageDataUrl we intend to save
    const finalImageDataUrl = imageDataUrl || product?.imageDataUrl;

    // If adding a new product, an image MUST be present (either newly processed or somehow pre-loaded)
    if (!product && !finalImageDataUrl) {
        setImageError('Please select and process an image.'); // Set error state
        toast({ variant: 'destructive', title: 'Error', description: 'Product image is missing.' });
        return;
    }
    // If an image processing error occurred previously
    if (imageError) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fix the image error before saving.' });
        return;
    }
    // --- End Validation ---

    setLoading(true);

    try {
      const productData = {
        name: values.name,
        description: values.description,
        price: values.price,
        imageDataUrl: finalImageDataUrl || null, // Save the final data URL
        supplierId: userProfile.uid,
        supplierName: userProfile.displayName || 'Unknown Supplier', // Handle possible null displayName
      };

      if (product) {
        // Update existing document
        await setDoc(doc(db, 'products', product.id), productData, { merge: true });
        toast({ title: 'Success', description: 'Product updated successfully.' });
      } else {
        // Add new document
        await addDoc(collection(db, 'products'), productData);
        toast({ title: 'Success', description: 'Product added successfully.' });
      }
      onSuccess(); // Refresh list
      setIsOpen(false); // Close dialog
      // Reset component state fully after success
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

            {/* File Input */}
             <FormItem>
                <FormLabel>Product Image</FormLabel>
                <FormControl>
                    <Input
                    type="file"
                    accept="image/png, image/jpeg, image/webp" // Specify acceptable image types
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        setImageFile(file || null); // Store the raw file
                        setImageError(null); // Clear previous errors
                        setImageDataUrl(null); // Clear previous preview/data

                        if (file) {
                        // --- Start Image Processing ---
                        setLoading(true); // Show loading indicator during processing
                        try {
                            const processedDataUrl = await processImageForFirestore(file);
                            setImageDataUrl(processedDataUrl); // Store the result for submission & preview
                        } catch (error: any) {
                            console.error("Image processing error:", error);
                            setImageError(error.message || "Failed to process image.");
                            setImageFile(null); // Clear the invalid file
                        } finally {
                            setLoading(false); // Hide loading indicator
                        }
                        // --- End Image Processing ---
                        }
                    }}
                    className="file:text-foreground"
                    />
                </FormControl>
                {/* Display validation error */}
                {imageError && <p className="text-sm font-medium text-destructive">{imageError}</p>}
                {/* Display image preview */}
                {imageDataUrl && !imageError && (
                    <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">Image Preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageDataUrl} alt="Preview" className="max-h-32 rounded border" />
                    </div>
                )}
                {/* Display current image if editing and no new image is selected/processed yet */}
                {!imageDataUrl && product?.imageDataUrl && !imageError && (
                    <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">Current Image:</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.imageDataUrl} alt="Current product image" className="max-h-32 rounded border" />
                        <p className="text-xs text-muted-foreground mt-1">Select a new file above to replace it.</p>
                    </div>
                )}
                <FormMessage /> {/* Renders Zod errors, though we handle image errors manually */}
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