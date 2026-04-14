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
  Hash,
  UserCog,
} from "lucide-react";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
}

const botManagementNav = [
  { name: "Bot Settings", href: "/dashboard", icon: Bot },
  { name: "Groups", href: "/dashboard/groups", icon: Users },
  { name: "Channels", href: "/dashboard/channels", icon: Hash },
  { name: "Broadcast", href: "/dashboard/broadcast", icon: Send },
];

const businessToolsNav = [
  { name: "Users", href: "/dashboard/users", icon: UserCog },
  { name: "Affiliates", href: "/dashboard/affiliates", icon: DollarSign },
  { name: "Leads", href: "/dashboard/leads", icon: MessageSquare },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

const accountNav = [
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.signOut();
    router.push("/login");
  };

  const renderMenuItem = (item: { name: string; href: string; icon: any }) => {
    const isActive = router.pathname === item.href;
    return (
      <SidebarMenuItem key={item.name}>
        <SidebarMenuButton
          onClick={() => router.push(item.href)}
          isActive={isActive}
          className={`w-full text-[15px] ${
            isActive
              ? "bg-accent text-accent-foreground font-semibold hover:bg-accent/90"
              : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
          }`}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.name}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <div className="border-b bg-background px-4 py-4">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-accent" />
              <span className="font-heading text-lg font-bold">Telegram Bot Admin</span>
            </div>
          </div>

          <SidebarContent className="bg-muted/30">
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bot Management
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1 px-2">
                  {botManagementNav.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Business Tools
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1 px-2">
                  {businessToolsNav.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1 px-2">
                  {accountNav.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="border-t bg-background p-4">
            <div className="mb-3 rounded-lg bg-success/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                <span className="text-sm font-medium text-success">Bot Active</span>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
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