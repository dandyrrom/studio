import type { User as FirebaseUser } from 'firebase/auth';
import { z } from 'zod'; // <-- ADD THIS IMPORT

export type UserRole = 'supplier' | 'client';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageDataUrl?: string; // Changed from imageUrl/imageHint
  supplierId: string;
  supplierName: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: OrderStatus;
  createdAt: Date; 
  supplierId: string;
}

// --- ADD ALL THE CODE BELOW ---

// Schema for AI Report Input (pre-processed data)
export const ReportInputSchema = z.object({
  totalRevenue: z.number().describe("Total revenue from delivered/shipped orders."),
  totalOrders: z.number().describe("Total number of delivered/shipped orders."),
  averageOrderValue: z.number().describe("The average value of each order."),
  totalClients: z.number().describe("Total number of unique clients in this period."),
  topSellingItems: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number(),
      })
    )
    .describe("A list of the top-selling items and their quantities."),
  dateRange: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .describe("The date range for this report."),
});
export type ReportInput = z.infer<typeof ReportInputSchema>;

// Schema for AI Report Output (structured JSON)
export const ReportOutputSchema = z.object({
  headline: z
    .string()
    .describe("A single, insightful headline for this report. (e.g., 'Strong Growth in March Driven by Top Products')"),
  salesTrend: z
    .string()
    .describe("A one-sentence analysis of the sales trend over the period (e.g., 'Sales remained stable.', 'A significant increase in revenue was observed.')."),
  keyInsights: z
    .array(z.string())
    .describe("A list of 3-5 key, data-driven bullet-point insights (e.g., 'Product X drove 40% of sales')."),
  actionableSuggestions: z
    .array(z.string())
    .describe("A list of 2-3 concrete, actionable suggestions for the supplier (e.g., 'Restock Product X', 'Market to new clients')."),
  totalRevenue: z.number(),
  totalOrders: z.number(),
  averageOrderValue: z.number(),
});
export type ReportOutput = z.infer<typeof ReportOutputSchema>;