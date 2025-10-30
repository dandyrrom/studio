'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users, // <-- IMPORTED
  BarChart,
  ShoppingBag
} from 'lucide-react';
import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';

export function DashboardNav() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const { itemCount } = useCart();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  type NavLink = {
    href: string;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    badge?: number | undefined;
  };

  const clientLinks: NavLink[] = [
    { href: '/dashboard', label: 'Browse Products', icon: ShoppingBag },
    { href: '/dashboard/orders', label: 'My Orders', icon: Package },
    { href: '/dashboard/cart', label: 'Cart', icon: ShoppingCart, badge: itemCount > 0 ? itemCount : undefined },
  ];

  // --- UPDATED SUPPLIER LINKS ---
  const supplierLinks: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/products', label: 'Manage Products', icon: Package },
    { href: '/dashboard/orders', label: 'Manage Orders', icon: ShoppingCart },
    { href: '/dashboard/clients', label: 'Clients', icon: Users }, // <-- ADDED THIS LINK
    { href: '/dashboard/reports', label: 'AI Reports', icon: BarChart },
  ];
  // --- END UPDATED LINKS ---

  const links: NavLink[] = userProfile?.role === 'supplier' ? supplierLinks : clientLinks;

  return (
    <SidebarMenu>
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href} className="w-full">
            <SidebarMenuButton isActive={isActive(link.href)}>
              <link.icon />
              <span>{link.label}</span>
              {mounted && link.badge !== undefined && (
                <Badge className="ml-auto">{link.badge}</Badge>
              )}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}