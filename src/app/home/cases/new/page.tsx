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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewCasePage() {
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
                <BreadcrumbPage>New Case</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Create New Case
            </h1>
            <p className="text-muted-foreground mt-1">
              Enter the details for the new case below
            </p>
          </div>

          <form className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential details about the case
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="case-title">Case Title *</Label>
                    <Input
                      id="case-title"
                      placeholder="e.g., Smith vs. Corporation Inc."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="case-number">Case Number *</Label>
                    <Input
                      id="case-number"
                      placeholder="e.g., 2024-CV-001"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="case-type">Case Type *</Label>
                    <Select>
                      <SelectTrigger id="case-type">
                        <SelectValue placeholder="Select case type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="civil">Civil Litigation</SelectItem>
                        <SelectItem value="criminal">
                          Criminal Defense
                        </SelectItem>
                        <SelectItem value="estate">Estate Planning</SelectItem>
                        <SelectItem value="property">Property Law</SelectItem>
                        <SelectItem value="contract">Contract Law</SelectItem>
                        <SelectItem value="ip">
                          Intellectual Property
                        </SelectItem>
                        <SelectItem value="family">Family Law</SelectItem>
                        <SelectItem value="corporate">Corporate Law</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select defaultValue="active">
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Case Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a brief description of the case..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>
                  Details about the client for this case
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Client Name *</Label>
                    <Input
                      id="client-name"
                      placeholder="e.g., John Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Client Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="client@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="client-phone">Client Phone</Label>
                    <Input
                      id="client-phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-address">Client Address</Label>
                    <Input
                      id="client-address"
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case Details */}
            <Card>
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
                <CardDescription>
                  Additional information and assignments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="filing-date">Filing Date</Label>
                    <Input id="filing-date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assigned-attorney">Assigned Attorney</Label>
                    <Select>
                      <SelectTrigger id="assigned-attorney">
                        <SelectValue placeholder="Select attorney" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sarah">Sarah Johnson</SelectItem>
                        <SelectItem value="michael">Michael Brown</SelectItem>
                        <SelectItem value="jennifer">Jennifer Davis</SelectItem>
                        <SelectItem value="david">David Wilson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated-value">Estimated Value</Label>
                    <Input
                      id="estimated-value"
                      placeholder="$0.00"
                      type="text"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes or comments about the case..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <a href="/home">Cancel</a>
              </Button>
              <Button type="submit">Create Case</Button>
            </div>
          </form>

          {/* Placeholder Notice */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                ℹ️ This is a placeholder form. Case creation functionality will
                be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
