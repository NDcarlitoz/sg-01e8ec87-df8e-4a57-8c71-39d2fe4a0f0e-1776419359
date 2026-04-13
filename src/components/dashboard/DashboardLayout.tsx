import { ReactNode } from "react";
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
} from "@/components/ui/sidebar";
import { 
  Bot, 
  Users, 
  Radio, 
  TrendingUp, 
  UserCheck, 
  BarChart3,
  Settings 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

const menuItems = [
  { title: "Bot Settings", icon: Bot, href: "/dashboard" },
  { title: "Groups", icon: Users, href: "/dashboard/groups" },
  { title: "Broadcast", icon: Radio, href: "/dashboard/broadcast" },
  { title: "Affiliates", icon: TrendingUp, href: "/dashboard/affiliates" },
  { title: "Leads", icon: UserCheck, href: "/dashboard/leads" },
  { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-6">
                <div className="flex items-center gap-2">
                  <Bot className="h-8 w-8 text-primary" />
                  <span className="font-heading text-lg font-bold">Telegram Bot</span>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={router.pathname === item.href}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                <span className="text-sm font-medium text-success">Bot Active</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}