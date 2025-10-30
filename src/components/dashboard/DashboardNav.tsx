
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart,
  ShoppingBag
} from 'lucide-react';
import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
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

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

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

  const supplierOverview: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];
  const supplierManagement: NavLink[] = [
    { href: '/dashboard/products', label: 'Products', icon: Package },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  ];
  const supplierInsights: NavLink[] = [
    { href: '/dashboard/reports', label: 'AI Reports', icon: BarChart },
  ];

  const isSupplier = userProfile?.role === 'supplier';

  if (isSupplier) {
    return (
      <>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supplierOverview.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <Link href={link.href} className="w-full" aria-current={isActive(link.href) ? 'page' : undefined}>
                    <SidebarMenuButton isActive={isActive(link.href)} tooltip={link.label}>
                      <link.icon />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supplierManagement.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <Link href={link.href} className="w-full" aria-current={isActive(link.href) ? 'page' : undefined}>
                    <SidebarMenuButton isActive={isActive(link.href)} tooltip={link.label}>
                      <link.icon />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supplierInsights.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <Link href={link.href} className="w-full" aria-current={isActive(link.href) ? 'page' : undefined}>
                    <SidebarMenuButton isActive={isActive(link.href)} tooltip={link.label}>
                      <link.icon />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </>
    );
  }

  return (
    <SidebarMenu>
      {clientLinks.map((link) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href} className="w-full" aria-current={isActive(link.href) ? 'page' : undefined}>
            <SidebarMenuButton isActive={isActive(link.href)} tooltip={link.label}>
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
