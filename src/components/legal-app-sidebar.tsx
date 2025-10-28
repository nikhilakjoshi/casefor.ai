"use client";
import * as React from "react";
import {
  Briefcase,
  Calendar,
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  Users,
  Scale,
  Clock,
  Plus,
  ChevronRight,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CaseItem {
  id: string;
  title: string;
  status: string;
  caseNumber: string;
  createdAt: string;
  client: {
    name: string;
  };
}

// Legal case management navigation data
const data = {
  user: {
    name: "Legal Firm",
    email: "contact@legalfirm.com",
    avatar: "/avatars/legal-firm.jpg",
  },
  navMain: [
    {
      title: "Overview",
      url: "#",
      icon: Home,
      items: [
        {
          title: "Dashboard",
          url: "/home",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Clients",
      url: "#",
      icon: Users,
      items: [
        {
          title: "All Clients",
          url: "/home/clients",
          icon: Users,
        },
        {
          title: "Add Client",
          url: "/home/clients/new",
          icon: Users,
        },
      ],
    },
    {
      title: "Schedule",
      url: "#",
      icon: Calendar,
      items: [
        {
          title: "Calendar",
          url: "/home/calendar",
          icon: Calendar,
        },
        {
          title: "Hearings",
          url: "/home/hearings",
          icon: Clock,
        },
        {
          title: "Deadlines",
          url: "/home/deadlines",
          icon: Clock,
        },
      ],
    },
    {
      title: "Documents",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "All Documents",
          url: "/home/documents",
          icon: FileText,
        },
        {
          title: "Templates",
          url: "/home/templates",
          icon: FileText,
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Profile",
      url: "/home/profile",
      icon: Users,
    },
    {
      title: "Settings",
      url: "/home/settings",
      icon: Settings,
    },
  ],
};

interface LegalAppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  cases?: CaseItem[];
}

export function LegalAppSidebar({
  cases = [],
  ...props
}: LegalAppSidebarProps) {
  const [pathname] = React.useState("/home");

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Scale className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Legal Case Manager</span>
                  <span className="text-xs">Case Management System</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>Cases</SidebarGroupLabel>
            <SidebarMenuButton size="sm" asChild>
              <a
                href="/home/cases/new"
                title="New Case"
                className="ml-auto w-min"
              >
                <Plus className="size-4" />
              </a>
            </SidebarMenuButton>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Briefcase className="size-4" />
                      <span>My Cases</span>
                      <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {cases.length > 0 ? (
                        cases.map((caseItem) => (
                          <SidebarMenuSubItem key={caseItem.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === `/home/cases/${caseItem.id}`}
                            >
                              <a href={`/home/cases/${caseItem.id}`}>
                                <span className="truncate">{caseItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <div className="text-xs text-muted-foreground px-2 py-1">
                              No cases yet. Create your first case!
                            </div>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Main navigation sections */}
        {data.navMain.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <a href={item.url}>
                        {item.icon && <item.icon className="size-4" />}
                        {item.title}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Cases Section with Collapsible List */}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {data.navSecondary.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon className="size-4" />
                  {item.title}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
