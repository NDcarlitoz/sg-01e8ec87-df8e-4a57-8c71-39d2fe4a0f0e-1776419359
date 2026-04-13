import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DataPage() {
  return (
    <>
      <SEO title="Data Management" />
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Data</h1>
              <p className="mt-2 text-muted-foreground">Manage and analyze your project data</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </div>

          <DataTable />
        </div>
      </DashboardLayout>
    </>
  );
}