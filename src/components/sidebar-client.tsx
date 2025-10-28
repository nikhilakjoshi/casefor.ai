"use client";

import { useEffect, useState } from "react";
import { LegalAppSidebar } from "./legal-app-sidebar";
import { getAllCases } from "@/actions/case";

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

export function SidebarClient() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCases() {
      try {
        const result = await getAllCases();
        if (result.success) {
          setCases(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch cases:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCases();
  }, []);

  if (isLoading) {
    return <LegalAppSidebar cases={[]} />;
  }

  return <LegalAppSidebar cases={cases} />;
}