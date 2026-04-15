import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { menuService, type ButtonType, type ActionType, type PageType } from "@/services/menuService";
import type { Tables } from "@/integrations/supabase/types";
import { 
  Menu, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Move,
  FileText,
  Link,
  Command,
  ChevronRight,
  Smartphone,
  Download,
  Upload,
  GripVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BotMenuPage() {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<Tables<"bot_menu_items">[]>([]);
  const [pages, setPages] = useState<Tables<"bot_pages">[]>([]);
  const [showCreateMenuDialog, setShowCreateMenuDialog] = useState(false);
  const [showCreatePageDialog, setShowCreatePageDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Tables<"bot_menu_items"> | null>(null);
  const [editingPage, setEditingPage] = useState<Tables<"bot_pages"> | null>(null);

  const [menuForm, setMenuForm] = useState({
    title: "",
    description: "",
    icon: "",
    button_type: "command" as ButtonType,
    action_type: "run_command" as ActionType,
    action_value: "",
    parent_id: "",
    position: 0,
    is_active: true,
    show_in_main_menu: true,
  });

  const [pageForm, setPageForm] = useState({
    title: "",
    content: "",
    page_type: "text" as PageType,
    image_url: "",
    is_active: true,
    show_back_button: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [menuRes, pagesRes] = await Promise.all([
      menuService.getMenuItems(),
      menuService.getPages()
    ]);
    
    if (menuRes.data) setMenuItems(menuRes.data);
    if (pagesRes.data) setPages(pagesRes.data);
  };

  const handleCreateMenuItem = async () => {
    const { error } = await menuService.createMenuItem({
      ...menuForm,
      parent_id: menuForm.parent_id || undefined,
    });

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Menu item created" });
      setShowCreateMenuDialog(false);
      resetMenuForm();
      loadData();
    }
  };

  const handleUpdateMenuItem = async () => {
    if (!editingItem) return;

    const { error } = await menuService.updateMenuItem(editingItem.id, menuForm);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Menu item updated" });
      setEditingItem(null);
      resetMenuForm();
      loadData();
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;

    const { error } = await menuService.deleteMenuItem(id);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Menu item deleted" });
      loadData();
    }
  };

  const handleCreatePage = async () => {
    const { error } = await menuService.createPage(pageForm);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Page created" });
      setShowCreatePageDialog(false);
      resetPageForm();
      loadData();
    }
  };

  const handleUpdatePage = async () => {
    if (!editingPage) return;

    const { error } = await menuService.updatePage(editingPage.id, pageForm);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Page updated" });
      setEditingPage(null);
      resetPageForm();
      loadData();
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("Delete this page?")) return;

    const { error } = await menuService.deletePage(id);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Page deleted" });
      loadData();
    }
  };

  const handleExport = async () => {
    const { data, error } = await menuService.exportMenuConfig();
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bot-menu-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    
    toast({ title: "Success", description: "Menu configuration exported" });
  };

  const resetMenuForm = () => {
    setMenuForm({
      title: "",
      description: "",
      icon: "",
      button_type: "command",
      action_type: "run_command",
      action_value: "",
      parent_id: "",
      position: 0,
      is_active: true,
      show_in_main_menu: true,
    });
  };

  const resetPageForm = () => {
    setPageForm({
      title: "",
      content: "",
      page_type: "text",
      image_url: "",
      is_active: true,
      show_back_button: true,
    });
  };

  const openEditMenuItem = (item: Tables<"bot_menu_items">) => {
    setEditingItem(item);
    setMenuForm({
      title: item.title,
      description: item.description || "",
      icon: item.icon || "",
      button_type: item.button_type as ButtonType,
      action_type: (item.action_type as ActionType) || "run_command",
      action_value: item.action_value || "",
      parent_id: item.parent_id || "",
      position: item.position,
      is_active: item.is_active,
      show_in_main_menu: item.show_in_main_menu,
    });
  };

  const openEditPage = (page: Tables<"bot_pages">) => {
    setEditingPage(page);
    setPageForm({
      title: page.title,
      content: page.content,
      page_type: page.page_type as PageType,
      image_url: page.image_url || "",
      is_active: page.is_active,
      show_back_button: page.show_back_button,
    });
  };

  const getButtonTypeIcon = (type: string) => {
    switch (type) {
      case "text": return <FileText className="h-4 w-4" />;
      case "link": return <Link className="h-4 w-4" />;
      case "command": return <Command className="h-4 w-4" />;
      case "submenu": return <ChevronRight className="h-4 w-4" />;
      default: return <Menu className="h-4 w-4" />;
    }
  };

  const mainMenuItems = menuItems.filter(item => item.show_in_main_menu && !item.parent_id);

  return (
    <ProtectedRoute>
      <SEO title="Bot Menu - Dashboard" description="Customize bot menu and pages" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">Bot Menu Customization</h1>
              <p className="text-muted-foreground mt-1">Create custom buttons, pages, and menu flows for your Telegram bot</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreviewDialog(true)}>
                <Smartphone className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Menu className="h-4 w-4" /> Menu Items
              </div>
              <div className="text-3xl font-bold">{menuItems.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {mainMenuItems.length} in main menu
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <FileText className="h-4 w-4" /> Custom Pages
              </div>
              <div className="text-3xl font-bold">{pages.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {pages.filter(p => p.is_active).length} active
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Command className="h-4 w-4" /> Commands
              </div>
              <div className="text-3xl font-bold">
                {menuItems.filter(m => m.button_type === "command").length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Bot commands</div>
            </Card>
          </div>

          <Tabs defaultValue="menu" className="space-y-6">
            <TabsList>
              <TabsTrigger value="menu">Menu Items ({menuItems.length})</TabsTrigger>
              <TabsTrigger value="pages">Pages ({pages.length})</TabsTrigger>
            </TabsList>

            {/* Menu Items Tab */}
            <TabsContent value="menu" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={showCreateMenuDialog || !!editingItem} onOpenChange={(open) => {
                  setShowCreateMenuDialog(open);
                  if (!open) {
                    setEditingItem(null);
                    resetMenuForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Edit Menu Item" : "Create Menu Item"}</DialogTitle>
                      <DialogDescription>
                        Configure a button for your bot menu
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title *</Label>
                          <Input
                            placeholder="Menu item title"
                            value={menuForm.title}
                            onChange={(e) => setMenuForm({ ...menuForm, title: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Icon (Emoji)</Label>
                          <Input
                            placeholder="🏠"
                            value={menuForm.icon}
                            onChange={(e) => setMenuForm({ ...menuForm, icon: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Brief description"
                          value={menuForm.description}
                          onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Button Type *</Label>
                          <Select
                            value={menuForm.button_type}
                            onValueChange={(val) => setMenuForm({ ...menuForm, button_type: val as ButtonType })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text Message</SelectItem>
                              <SelectItem value="link">External Link</SelectItem>
                              <SelectItem value="command">Bot Command</SelectItem>
                              <SelectItem value="page">Show Page</SelectItem>
                              <SelectItem value="submenu">Submenu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Position</Label>
                          <Input
                            type="number"
                            value={menuForm.position}
                            onChange={(e) => setMenuForm({ ...menuForm, position: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>

                      {menuForm.button_type !== "submenu" && (
                        <div className="space-y-2">
                          <Label>Action Value *</Label>
                          <Input
                            placeholder={
                              menuForm.button_type === "link" ? "https://example.com" :
                              menuForm.button_type === "command" ? "/start" :
                              menuForm.button_type === "page" ? "page-id" :
                              "action value"
                            }
                            value={menuForm.action_value}
                            onChange={(e) => setMenuForm({ ...menuForm, action_value: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            {menuForm.button_type === "link" && "Full URL including https://"}
                            {menuForm.button_type === "command" && "Bot command (e.g., /start, /help)"}
                            {menuForm.button_type === "page" && "Select a page from Pages tab"}
                            {menuForm.button_type === "text" && "Text message to send"}
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Active</Label>
                            <p className="text-xs text-muted-foreground">Show in bot menu</p>
                          </div>
                          <Switch
                            checked={menuForm.is_active}
                            onCheckedChange={(checked) => setMenuForm({ ...menuForm, is_active: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Main Menu</Label>
                            <p className="text-xs text-muted-foreground">Show in main menu</p>
                          </div>
                          <Switch
                            checked={menuForm.show_in_main_menu}
                            onCheckedChange={(checked) => setMenuForm({ ...menuForm, show_in_main_menu: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowCreateMenuDialog(false);
                        setEditingItem(null);
                        resetMenuForm();
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={editingItem ? handleUpdateMenuItem : handleCreateMenuItem}>
                        {editingItem ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                {menuItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Menu className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No menu items yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Create your first menu button to customize your bot
                    </p>
                    <Button onClick={() => setShowCreateMenuDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{item.icon}</span>
                              <div>
                                <div className="font-medium">{item.title}</div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground">{item.description}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              {getButtonTypeIcon(item.button_type)}
                              <span className="capitalize">{item.button_type}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {item.action_value || "-"}
                          </TableCell>
                          <TableCell>{item.position}</TableCell>
                          <TableCell>
                            <Badge variant={item.is_active ? "default" : "secondary"}>
                              {item.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditMenuItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMenuItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            {/* Pages Tab */}
            <TabsContent value="pages" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={showCreatePageDialog || !!editingPage} onOpenChange={(open) => {
                  setShowCreatePageDialog(open);
                  if (!open) {
                    setEditingPage(null);
                    resetPageForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Page
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingPage ? "Edit Page" : "Create Page"}</DialogTitle>
                      <DialogDescription>
                        Create a custom page for your bot
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Page Title *</Label>
                        <Input
                          placeholder="Page title"
                          value={pageForm.title}
                          onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Page Type</Label>
                        <Select
                          value={pageForm.page_type}
                          onValueChange={(val) => setPageForm({ ...pageForm, page_type: val as PageType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text Only</SelectItem>
                            <SelectItem value="image">Image + Text</SelectItem>
                            <SelectItem value="video">Video + Text</SelectItem>
                            <SelectItem value="interactive">Interactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Content * (Markdown supported)</Label>
                        <Textarea
                          placeholder="Enter your content here...

**Markdown formatting:**
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- Bullet points
- And more!"
                          value={pageForm.content}
                          onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                          rows={10}
                          className="font-mono text-sm"
                        />
                      </div>

                      {pageForm.page_type === "image" && (
                        <div className="space-y-2">
                          <Label>Image URL</Label>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            value={pageForm.image_url}
                            onChange={(e) => setPageForm({ ...pageForm, image_url: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Active</Label>
                            <p className="text-xs text-muted-foreground">Make page available</p>
                          </div>
                          <Switch
                            checked={pageForm.is_active}
                            onCheckedChange={(checked) => setPageForm({ ...pageForm, is_active: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Back Button</Label>
                            <p className="text-xs text-muted-foreground">Show back to menu button</p>
                          </div>
                          <Switch
                            checked={pageForm.show_back_button}
                            onCheckedChange={(checked) => setPageForm({ ...pageForm, show_back_button: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowCreatePageDialog(false);
                        setEditingPage(null);
                        resetPageForm();
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={editingPage ? handleUpdatePage : handleCreatePage}>
                        {editingPage ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                {pages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg">No pages yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Create custom pages with rich content for your bot
                    </p>
                    <Button onClick={() => setShowCreatePageDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Page
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Content Preview</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.map((page) => (
                        <TableRow key={page.id}>
                          <TableCell className="font-medium">{page.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{page.page_type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                            {page.content.substring(0, 100)}...
                          </TableCell>
                          <TableCell>
                            <Badge variant={page.is_active ? "default" : "secondary"}>
                              {page.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditPage(page)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePage(page.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bot Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Bot Menu Preview</DialogTitle>
              <DialogDescription>How your menu looks in Telegram</DialogDescription>
            </DialogHeader>

            <div className="bg-[#0088cc] p-4 rounded-lg">
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="text-sm font-medium text-gray-500 mb-3">Main Menu</div>
                {mainMenuItems.map((item) => (
                  <button
                    key={item.id}
                    className="w-full text-left p-3 rounded bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}