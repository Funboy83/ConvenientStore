
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  History,
  Calculator,
  FileText,
  ShieldCheck,
  Users,
  Package,
  Database,
  Clock,
  CheckCircle2,
  UserCog,
} from "lucide-react";

import { useUser } from "@/contexts/user-context";
import type { NavItem } from "@/lib/types";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    role: ['Admin', 'Manager', 'Cashier'],
  },
  {
    title: "POS",
    href: "/pos",
    icon: ShoppingCart,
    role: ['Manager', 'Cashier'],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Boxes,
    role: ['Admin', 'Manager'],
  },
  {
    title: "Purchase",
    href: "/purchase",
    icon: ShoppingCart,
    role: ['Admin', 'Manager'],
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
    role: ['Admin', 'Manager'],
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    role: ['Admin', 'Manager'],
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: Users,
    role: ['Admin', 'Manager'],
  },
  {
    title: "Pending Transactions",
    href: "/pending-transactions",
    icon: Clock,
    role: ['Admin', 'Manager'],
  },
  {
    title: "Final Invoices",
    href: "/final-invoices",
    icon: CheckCircle2,
    role: ['Admin', 'Manager'],
  },
  {
    title: "Audit Trail",
    href: "/audit-trail",
    icon: History,
    role: ['Admin', 'Manager'],
  },
  {
    title: "Reconciliation",
    href: "/reconciliation",
    icon: Calculator,
    role: ['Manager'],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    role: ['Admin', 'Manager'],
  },
  {
    title: "Analysis",
    href: "/analysis",
    icon: ShieldCheck,
    role: ['Admin', 'Manager'],
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    role: ['Admin'],
  },
  {
    title: "Role Management",
    href: "/roles",
    icon: UserCog,
    role: ['Admin'],
  },
  {
    title: "DB Test",
    href: "/test-db",
    icon: Database,
    role: ['Admin'],
  },
];

export function Nav() {
  const pathname = usePathname();
  const { currentUser } = useUser();

  if (!currentUser) {
    return null;
  }

  const filteredNavItems = navItems.filter(item => 
    !item.role || item.role.includes(currentUser.role)
  );

  return (
    <SidebarMenu>
      {filteredNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={item.title}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
