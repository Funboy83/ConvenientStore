import { UserProvider } from '@/contexts/user-context';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { Nav } from '@/components/nav';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { ScanLine } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SidebarProvider>
        <div className="bg-background">
          <Sidebar>
            <SidebarHeader className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                  <Logo className="h-6 w-6" />
                </div>
                <h1 className="font-semibold text-xl tracking-tight text-primary-foreground group-data-[collapsible=icon]:hidden">
                  <span className="text-foreground">SecureStock</span>
                </h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <Nav />
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <header className="flex items-center justify-end h-16 px-4 border-b shrink-0 md:px-6">
               <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" aria-label="Scan Barcode">
                  <ScanLine className="h-4 w-4" />
                </Button>
                <UserNav />
               </div>
            </header>
            <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-background">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </UserProvider>
  );
}
