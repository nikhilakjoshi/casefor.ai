import { LegalAppSidebar } from "@/components/legal-app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, User, Clock, DollarSign } from "lucide-react";

// Mock case data - in a real app, this would come from a database
interface CaseData {
  id: string;
  title: string;
  caseNumber: string;
  status: string;
  client?: string;
  type?: string;
  filingDate?: string;
  nextHearing?: string;
  assignedAttorney?: string;
  estimatedValue?: string;
  description?: string;
}

const mockCases: Record<string, CaseData> = {
  "1": {
    id: "1",
    title: "Smith vs. Corporation Inc.",
    caseNumber: "2024-CV-001",
    status: "active",
    client: "John Smith",
    type: "Civil Litigation",
    filingDate: "2024-01-15",
    nextHearing: "2024-11-15",
    assignedAttorney: "Sarah Johnson",
    estimatedValue: "$250,000",
    description:
      "Contract dispute regarding breach of service agreement between client and corporation.",
  },
  "2": {
    id: "2",
    title: "Johnson Estate Planning",
    caseNumber: "2024-EP-045",
    status: "active",
    client: "Mary Johnson",
    type: "Estate Planning",
    filingDate: "2024-02-20",
    nextHearing: "2024-11-20",
    assignedAttorney: "Michael Brown",
    estimatedValue: "$1,500,000",
    description:
      "Comprehensive estate planning including will, trusts, and power of attorney documents.",
  },
  "3": {
    id: "3",
    title: "Brown Property Dispute",
    caseNumber: "2024-PD-023",
    status: "pending",
    client: "Robert Brown",
    type: "Property Law",
    filingDate: "2024-03-10",
    nextHearing: "2024-12-01",
    assignedAttorney: "Jennifer Davis",
    estimatedValue: "$180,000",
    description: "Property boundary dispute with neighboring property owner.",
  },
  "4": {
    id: "4",
    title: "Davis Contract Review",
    caseNumber: "2024-CR-089",
    status: "active",
    client: "Lisa Davis",
    type: "Contract Law",
    filingDate: "2024-04-05",
    nextHearing: "2024-11-10",
    assignedAttorney: "David Wilson",
    estimatedValue: "$75,000",
    description:
      "Review and negotiation of commercial lease agreement for retail space.",
  },
  "5": {
    id: "5",
    title: "Miller Trademark Registration",
    caseNumber: "2024-TM-012",
    status: "completed",
    client: "Miller Technologies",
    type: "Intellectual Property",
    filingDate: "2024-01-08",
    nextHearing: "-",
    assignedAttorney: "Sarah Johnson",
    estimatedValue: "$25,000",
    description:
      "Trademark registration and protection for company brand and logo.",
  },
};

export default function CaseDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const caseData = mockCases[params.id] || {
    title: "Case Not Found",
    caseNumber: "N/A",
    status: "unknown",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <SidebarProvider>
      <LegalAppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/home">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/home">Cases</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{caseData.caseNumber}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {/* Case Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {caseData.title}
              </h1>
              <p className="text-muted-foreground mt-1">
                Case #{caseData.caseNumber}
              </p>
            </div>
            <Badge className={`${getStatusColor(caseData.status)} text-white`}>
              {caseData.status?.toUpperCase()}
            </Badge>
          </div>

          {/* Case Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Client</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {caseData.client || "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Case Type</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {caseData.type || "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Next Hearing
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {caseData.nextHearing || "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Est. Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {caseData.estimatedValue || "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Case Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Case Information</CardTitle>
                <CardDescription>
                  Essential details about this case
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filing Date:</span>
                  <span className="text-sm">
                    {caseData.filingDate || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Assigned Attorney:
                  </span>
                  <span className="text-sm">
                    {caseData.assignedAttorney || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Status:</span>
                  <Badge
                    className={`${getStatusColor(caseData.status)} text-white`}
                  >
                    {caseData.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Case Description</CardTitle>
                <CardDescription>Overview of the case matter</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {caseData.description || "No description available."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common case management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button>Add Note</Button>
                <Button variant="outline">Upload Document</Button>
                <Button variant="outline">Schedule Hearing</Button>
                <Button variant="outline">Update Status</Button>
                <Button variant="outline">Send Email</Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates and events for this case
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b">
                  <div className="bg-muted rounded-full p-2">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Document uploaded</p>
                    <p className="text-xs text-muted-foreground">
                      Contract_Draft_v2.pdf was added to the case files
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      2 days ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 pb-4 border-b">
                  <div className="bg-muted rounded-full p-2">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Hearing scheduled</p>
                    <p className="text-xs text-muted-foreground">
                      Next hearing set for {caseData.nextHearing}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      5 days ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-muted rounded-full p-2">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Case assigned</p>
                    <p className="text-xs text-muted-foreground">
                      Case assigned to {caseData.assignedAttorney}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      1 week ago
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
