import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { LiveChatViewer } from "@/components/dashboard/LiveChatViewer";
import { DigitalClock } from "@/components/dashboard/DigitalClock";
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
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Radio,
  Settings,
  MessageSquare,
  Send,
  Filter,
  UserCircle,
  LogOut,
  ChevronDown,
  UserPlus,
  BarChart3,
  Menu as MenuIcon,
  DollarSign,
  FileText,
  Zap,
  Bot,
  Hash,
  Shield,
  User,
  UserCog,
} from "lucide-react";
import { profileService } from "@/services/profileService";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<{ full_name?: string; email?: string } | null>(null);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const pathname = router.pathname;

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    const { data } = await profileService.getCurrentProfile();
    if (data) {
      setUserProfile(data);
    } else {
      // Fallback to user email if profile not found
      setUserProfile({ email: user.email });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const getUserInitials = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (userProfile?.email) {
      return userProfile.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const botManagementNav = [
    { name: "Bot Settings", href: "/dashboard", icon: Bot },
    { name: "Groups", href: "/dashboard/groups", icon: Users },
    { name: "Channels", href: "/dashboard/channels", icon: Hash },
    { name: "Broadcast", href: "/dashboard/broadcast", icon: Send },
  ];

  const automationNav = [
    { name: "Auto-Reply", href: "/dashboard/auto-reply", icon: Zap },
    { name: "Segments", href: "/dashboard/segments", icon: Filter },
    { name: "Moderation", href: "/dashboard/moderation", icon: Shield },
    { name: "Livegram", href: "/dashboard/livegram", icon: Radio },
  ];

  const accountNav = [
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  // Build business tools nav dynamically
  const affiliateEnabled = true; // Feature flag for affiliate system
  const businessToolsNav = [
    { name: "Users", href: "/dashboard/users", icon: UserCog },
    ...(affiliateEnabled ? [
      { name: "Affiliates", href: "/dashboard/affiliates", icon: DollarSign }
    ] : []),
    { name: "Affiliate Settings", href: "/dashboard/affiliate-settings", icon: Settings },
    { name: "Leads", href: "/dashboard/leads", icon: MessageSquare },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Bot Menu", href: "/dashboard/bot-menu", icon: Bot },
  ];

  const renderMenuItem = (item: { name: string; href: string; icon: any }) => {
    const isActive = router.pathname === item.href;
    return (
      <SidebarMenuItem key={item.name}>
        <SidebarMenuButton
          onClick={() => router.push(item.href)}
          isActive={isActive}
          className={`w-full text-sm ${
            isActive
              ? "bg-accent text-accent-foreground font-semibold hover:bg-accent/90"
              : "text-foreground/70 hover:bg-accent/10 hover:text-foreground"
          }`}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.name}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r bg-card">
          <div className="border-b bg-card px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent" />
              <span className="font-heading text-base font-bold">Telegram Bot Admin</span>
            </div>
          </div>

          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={router.pathname === "/dashboard"}>
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={router.pathname === "/dashboard/users"}>
                    <Link href="/dashboard/users">
                      <Users className="h-4 w-4" />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={router.pathname === "/dashboard/logs"}>
                    <Link href="/dashboard/logs">
                      <FileText className="h-4 w-4" />
                      <span>Logs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={router.pathname === "/dashboard/channels"}>
                    <Link href="/dashboard/channels">
                      <Radio className="h-4 w-4" />
                      <span>Channels</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Bot Management
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 px-2">
                  {botManagementNav.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Automation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 px-2">
                  {automationNav.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Business Tools
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 px-2">
                  {businessToolsNav.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 px-2">
                  {accountNav.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="border-t bg-card p-3">
            <div className="mb-2 rounded-lg bg-success/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                <span className="text-xs font-medium text-success">Bot Active</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <DigitalClock />
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLiveChatOpen(true)}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Live Chat</span>
            </Button>
            <ThemeSwitch />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>

      {/* Live Chat Viewer Dialog */}
      <LiveChatViewer open={isLiveChatOpen} onOpenChange={setIsLiveChatOpen} />
    </SidebarProvider>
  );
}