
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
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
  XCircle,
  UserCog,
  Wrench,
  ShoppingBag,
  Receipt,
  TruckIcon,
} from "lucide-react";

import { useUser } from "@/contexts/user-context";
import type { NavItem } from "@/lib/types";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface NavGroup {
  title: string;
  items: NavItem[];
  role?: string[];
}

const navGroups: NavGroup[] = [
  {
    title: "Main",
    items: [
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
    ],
  },
  {
    title: "Inventory",
    items: [
      {
        title: "Inventory",
        href: "/inventory",
        icon: Boxes,
        role: ['Admin', 'Manager'],
      },
      {
        title: "Products",
        href: "/products",
        icon: Package,
        role: ['Admin', 'Manager'],
      },
      {
        title: "Services",
        href: "/services",
        icon: Wrench,
        role: ['Admin', 'Manager'],
      },
    ],
  },
  {
    title: "Purchasing",
    items: [
      {
        title: "Purchase",
        href: "/purchase",
        icon: ShoppingBag,
        role: ['Admin', 'Manager'],
      },
      {
        title: "Purchase History",
        href: "/purchase-history",
        icon: Receipt,
        role: ['Admin', 'Manager'],
      },
      {
        title: "Suppliers",
        href: "/suppliers",
        icon: TruckIcon,
        role: ['Admin', 'Manager'],
      },
    ],
  },
  {
    title: "Transactions",
    items: [
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
        title: "Voided Transactions",
        href: "/voided-transactions",
        icon: XCircle,
        role: ['Admin', 'Manager'],
      },
    ],
  },
  {
    title: "People",
    items: [
      {
        title: "Customers",
        href: "/customers",
        icon: Users,
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
    ],
  },
  {
    title: "Reports & Analysis",
    items: [
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
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "DB Test",
        href: "/test-db",
        icon: Database,
        role: ['Admin'],
      },
    ],
    role: ['Admin'],
  },
];

export function Nav() {
  const pathname = usePathname();
  const { currentUser } = useUser();

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {navGroups.map((group) => {
        // Filter group items by role
        const filteredItems = group.items.filter(item => 
          !item.role || item.role.includes(currentUser.role)
        );

        // Skip group if no items or group role doesn't match
        if (filteredItems.length === 0 || (group.role && !group.role.includes(currentUser.role))) {
          return null;
        }

        return (
          <Collapsible key={group.title} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md">
                  <span>{group.title}</span>
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredItems.map((item) => (
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
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        );
      })}
    </div>
  );
}
