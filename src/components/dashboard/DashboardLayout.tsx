import { ReactNode } from "react";
import { useRouter } from "next/router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Settings,
  BarChart3,
  Send,
  Users,
  MessageSquare,
  DollarSign,
  LogOut,
  User,
  Bot,
} from "lucide-react";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
}

const mainNavigation = [
  { name: "Bot Settings", href: "/dashboard", icon: Bot },
  { name: "Groups", href: "/dashboard/groups", icon: Users },
  { name: "Broadcast", href: "/dashboard/broadcast", icon: Send },
];

const businessNavigation = [
  { name: "Affiliates", href: "/dashboard/affiliates", icon: DollarSign },
  { name: "Leads", href: "/dashboard/leads", icon: MessageSquare },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

const accountNavigation = [
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.signOut();
    router.push("/login");
  };

  const renderMenuSection = (items: typeof mainNavigation) => {
    return items.map((item) => {
      const isActive = router.pathname === item.href;
      return (
        <SidebarMenuItem key={item.name}>
          <SidebarMenuButton
            onClick={() => router.push(item.href)}
            isActive={isActive}
            className={`
              w-full transition-all duration-200
              ${isActive 
                ? "bg-accent text-accent-foreground font-semibold shadow-sm" 
                : "hover:bg-accent/10 text-foreground/80 hover:text-foreground"
              }
            `}
          >
            <item.icon className={`h-5 w-5 ${isActive ? "text-accent-foreground" : ""}`} />
            <span className="text-[15px]">{item.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-border/40">
          <SidebarContent className="bg-muted/30">
            {/* Header */}
            <div className="border-b border-border/40 bg-background px-4 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Bot className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h1 className="font-heading text-lg font-bold text-foreground">Telegram Bot</h1>
                  <p className="text-xs text-muted-foreground">Admin Dashboard</p>
                </div>
              </div>
            </div>

            {/* Main Navigation */}
            <SidebarGroup className="px-3 py-4">
              <SidebarGroupLabel className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bot Management
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {renderMenuSection(mainNavigation)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Business Navigation */}
            <SidebarGroup className="px-3 py-4">
              <SidebarGroupLabel className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Business Tools
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {renderMenuSection(businessNavigation)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Account Navigation */}
            <SidebarGroup className="px-3 py-4">
              <SidebarGroupLabel className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {renderMenuSection(accountNavigation)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="border-t border-border/40 bg-background p-4">
            <div className="mb-3 rounded-lg bg-success/10 px-3 py-2.5 ring-1 ring-success/20">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success shadow-sm shadow-success/50" />
                <span className="text-sm font-semibold text-success">Bot Active</span>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}