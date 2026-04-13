import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface DataItem {
  id: string;
  name: string;
  status: string;
  date: string;
  value: string;
}

const mockData: DataItem[] = [
  { id: "1", name: "Project Alpha", status: "Active", date: "2026-04-10", value: "$12,450" },
  { id: "2", name: "Project Beta", status: "Completed", date: "2026-04-08", value: "$8,900" },
  { id: "3", name: "Project Gamma", status: "Active", date: "2026-04-12", value: "$15,200" },
  { id: "4", name: "Project Delta", status: "Pending", date: "2026-04-11", value: "$6,750" },
  { id: "5", name: "Project Epsilon", status: "Active", date: "2026-04-09", value: "$9,300" },
];

export function DataTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<keyof DataItem>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (key: keyof DataItem) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const filteredData = mockData
    .filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const modifier = sortOrder === "asc" ? 1 : -1;
      return aVal > bVal ? modifier : -modifier;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1 p-0 hover:bg-transparent"
                >
                  Name
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1 p-0 hover:bg-transparent"
                >
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("date")}
                  className="flex items-center gap-1 p-0 hover:bg-transparent"
                >
                  Date
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("value")}
                  className="flex items-center gap-1 p-0 hover:bg-transparent"
                >
                  Value
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    item.status === "Active" ? "bg-green-100 text-green-800" :
                    item.status === "Completed" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.date}</TableCell>
                <TableCell className="text-right font-medium">{item.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}