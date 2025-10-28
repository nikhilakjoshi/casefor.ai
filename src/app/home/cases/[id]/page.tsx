import { SidebarWithCases } from "@/components/sidebar-with-cases";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, FileText, User, Clock, DollarSign, Phone, Mail, MapPin, Upload, MessageSquare, Edit, AlertCircle } from "lucide-react";
import { getCaseById } from "@/actions/case";
import { notFound } from "next/navigation";
import { ClientInformationPanel } from "@/components/client-information-panel";
import { DocumentManagementPanel } from "@/components/document-management-panel";
import { CaseStrategyPanel } from "@/components/case-strategy-panel";


export default async function CaseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCaseById(id);
  
  if (!result.success || !result.data) {
    notFound();
  }
  
  const caseData = result.data;

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
      <SidebarWithCases />
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
                <BreadcrumbPage>{caseData.title}</BreadcrumbPage>
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

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Client</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {caseData.client?.name || "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {caseData.documents?.length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Case Type
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {caseData.type || "Immigration"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Assigned To
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {caseData.assignedTo?.name || "Unassigned"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Case Overview</TabsTrigger>
              <TabsTrigger value="client">Client Information</TabsTrigger>
              <TabsTrigger value="documents">Case Documents</TabsTrigger>
              <TabsTrigger value="strategy">Case Strategy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
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
                      <span className="text-sm font-medium">Created:</span>
                      <span className="text-sm">
                        {new Date(caseData.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Assigned To:</span>
                      <span className="text-sm">
                        {caseData.assignedTo?.name || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Status:</span>
                      <Badge className={`${getStatusColor(caseData.status)} text-white`}>
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
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common case management tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Add Note
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Document
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Case
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Update Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates and events for this case</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Case Creation Activity */}
                    <div className="flex items-start gap-4 pb-4 border-b">
                      <div className="bg-green-100 rounded-full p-2">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Case created</p>
                        <p className="text-xs text-muted-foreground">
                          Case {caseData.caseNumber} was created with {caseData.documents?.length || 0} documents
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(caseData.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Document Activities */}
                    {caseData.documents && caseData.documents.slice(0, 2).map((doc) => (
                      <div key={doc.id} className="flex items-start gap-4 pb-4 border-b">
                        <div className="bg-blue-100 rounded-full p-2">
                          <Upload className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Document uploaded</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.title} was categorized as {doc.category}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Assignment Activity */}
                    {caseData.assignedTo && (
                      <div className="flex items-start gap-4">
                        <div className="bg-purple-100 rounded-full p-2">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Case assigned</p>
                          <p className="text-xs text-muted-foreground">
                            Case assigned to {caseData.assignedTo.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(caseData.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="client" className="space-y-4">
              <ClientInformationPanel 
                client={caseData.client}
                caseMetadata={caseData.case_metadata}
              />
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4">
              <DocumentManagementPanel 
                documents={caseData.documents || []}
                caseId={caseData.id}
              />
            </TabsContent>
            
            <TabsContent value="strategy" className="space-y-4">
              <CaseStrategyPanel 
                notes={caseData.notes || []}
                strategies={caseData.strategies || []}
                caseId={caseData.id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
