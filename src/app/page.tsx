'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Building, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    router.push('/dashboard');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between px-6">
        <h1 className="text-2xl font-bold text-primary">TradeFlow</h1>
        <div className="space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="default" className="bg-accent hover:bg-accent/90" asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl">
          <h2 className="font-headline text-5xl font-extrabold tracking-tight text-primary sm:text-6xl md:text-7xl">
            Streamline Your Business Transactions
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-foreground/80 md:text-xl">
            TradeFlow connects suppliers and clients on a seamless platform. Manage your catalog, process orders, and gain insights with AI-powered reports.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        <div className="mt-20 grid max-w-5xl gap-8 sm:grid-cols-2 lg:gap-12">
            <div className="rounded-lg border bg-card p-6 text-left">
                <div className="inline-block rounded-lg bg-accent/20 p-3 text-accent">
                    <Building className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-primary">For Suppliers</h3>
                <p className="mt-2 text-foreground/70">Effortlessly manage your product catalog, track orders in real-time, and leverage AI to understand your sales performance.</p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-left">
                <div className="inline-block rounded-lg bg-accent/20 p-3 text-accent">
                    <ShoppingCart className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-primary">For Clients</h3>
                <p className="mt-2 text-foreground/70">Browse extensive catalogs, place orders with ease, and keep track of your purchase history all in one place.</p>
            </div>
        </div>
      </main>
      <footer className="py-6 px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} TradeFlow. All rights reserved.
      </footer>
    </div>
  );
}
