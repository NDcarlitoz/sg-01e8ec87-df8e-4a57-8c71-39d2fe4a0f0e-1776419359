import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { segmentService, type SegmentFilter } from "@/services/segmentService";
import type { Tables } from "@/integrations/supabase/types";
import { Plus, Trash2, Users, Filter, Eye } from "lucide-react";

export default function SegmentsPage() {
  const { toast } = useToast();
  const [segments, setSegments] = useState<Tables<"user_segments">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Tables<"user_segments"> | null>(null);
  const [previewMembers, setPreviewMembers] = useState<Tables<"bot_users">[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [filters, setFilters] = useState<SegmentFilter[]>([]);

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    setIsLoading(true);
    const { data, error } = await segmentService.getSegments();
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      setSegments(data);
    }
    setIsLoading(false);
  };

  const openCreateDialog = () => {
    setFormData({ name: "", description: "" });
    setFilters([]);
    setIsCreateDialogOpen(true);
  };

  const addFilter = () => {
    setFilters([
      ...filters,
      { field: "is_active", operator: "equals", value: true },
    ]);
  };

  const updateFilter = (index: number, updates: Partial<SegmentFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleCreateSegment = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a segment name",
        variant: "destructive",
      });
      return;
    }

    if (filters.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one filter condition",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await segmentService.createSegment({
      name: formData.name,
      description: formData.description || undefined,
      filter_conditions: filters,
    });

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Segment created successfully",
      });
      setIsCreateDialogOpen(false);
      loadSegments();
    }
    setIsLoading(false);
  };

  const handleDeleteSegment = async () => {
    if (!selectedSegment) return;

    setIsLoading(true);
    const { error } = await segmentService.deleteSegment(selectedSegment.id);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Segment deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      loadSegments();
    }
    setIsLoading(false);
  };

  const handlePreviewMembers = async (segment: Tables<"user_segments">) => {
    setSelectedSegment(segment);
    setIsLoading(true);
    const { data, error } = await segmentService.getSegmentMembers(segment.id);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      setPreviewMembers(data);
      setIsPreviewDialogOpen(true);
    }
    setIsLoading(false);
  };

  const getFieldOptions = () => [
    { value: "is_active", label: "Is Active" },
    { value: "is_bot", label: "Is Bot" },
    { value: "language_code", label: "Language" },
    { value: "tags", label: "Tags" },
    { value: "created_at", label: "Join Date" },
    { value: "last_interaction", label: "Last Interaction" },
  ];

  const getOperatorOptions = (field: string) => {
    if (field === "is_active" || field === "is_bot") {
      return [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Not Equals" },
      ];
    }
    if (field === "tags") {
      return [
        { value: "contains", label: "Contains" },
      ];
    }
    if (field === "created_at" || field === "last_interaction") {
      return [
        { value: "greater_than", label: "After" },
        { value: "less_than", label: "Before" },
      ];
    }
    return [
      { value: "equals", label: "Equals" },
      { value: "not_equals", label: "Not Equals" },
      { value: "contains", label: "Contains" },
    ];
  };

  return (
    <ProtectedRoute>
      <SEO title="User Segments - Telegram Bot Dashboard" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">User Segments</h1>
              <p className="text-muted-foreground mt-1">
                Create targeted user groups based on criteria
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              New Segment
            </Button>
          </div>

          <div className="grid gap-4">
            {segments.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No segments yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first user segment to start targeting specific audiences
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Segment
                </Button>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Filters</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segments.map((segment) => (
                      <TableRow key={segment.id}>
                        <TableCell className="font-medium">
                          {segment.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {segment.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {segment.member_count || 0} users
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Filter className="w-3 h-3 mr-1" />
                            {((segment.filter_conditions as unknown) as SegmentFilter[])?.length || 0} conditions
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={segment.is_active ? "default" : "secondary"}>
                            {segment.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(segment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewMembers(segment)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedSegment(segment);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </div>

        {/* Create Segment Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create User Segment</DialogTitle>
              <DialogDescription>
                Define filters to automatically group users
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Segment Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Active English Speakers"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What does this segment represent?"
                  rows={3}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Filter Conditions *</Label>
                  <Button size="sm" variant="outline" onClick={addFilter}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Filter
                  </Button>
                </div>

                {filters.length === 0 ? (
                  <Card className="p-6 text-center">
                    <Filter className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No filters added yet. Click "Add Filter" to start.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filters.map((filter, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex gap-3 items-start">
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Field</Label>
                              <Select
                                value={filter.field}
                                onValueChange={(value) =>
                                  updateFilter(index, { field: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {getFieldOptions().map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs">Operator</Label>
                              <Select
                                value={filter.operator}
                                onValueChange={(value) =>
                                  updateFilter(index, { operator: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {getOperatorOptions(filter.field).map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs">Value</Label>
                              {filter.field === "is_active" || filter.field === "is_bot" ? (
                                <Select
                                  value={String(filter.value)}
                                  onValueChange={(value) =>
                                    updateFilter(index, { value: value === "true" })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">True</SelectItem>
                                    <SelectItem value="false">False</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : filter.field === "created_at" || filter.field === "last_interaction" ? (
                                <Input
                                  type="date"
                                  value={filter.value}
                                  onChange={(e) =>
                                    updateFilter(index, { value: e.target.value })
                                  }
                                />
                              ) : (
                                <Input
                                  value={filter.value}
                                  onChange={(e) =>
                                    updateFilter(index, { value: e.target.value })
                                  }
                                  placeholder="Enter value"
                                />
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFilter(index)}
                            className="mt-6"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSegment} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Segment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Members Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Segment Members: {selectedSegment?.name}
              </DialogTitle>
              <DialogDescription>
                {previewMembers.length} members match this segment
              </DialogDescription>
            </DialogHeader>

            {previewMembers.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No users match this segment criteria
                </p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewMembers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name || ""}
                      </TableCell>
                      <TableCell>
                        {user.username ? `@${user.username}` : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {((user.tags as string[]) || []).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(!user.tags || (user.tags as string[]).length === 0) && (
                            <span className="text-sm text-muted-foreground">No tags</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Segment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedSegment?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSegment}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}