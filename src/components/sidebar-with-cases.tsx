import { getAllCases } from "@/actions/case";
import { LegalAppSidebar } from "./legal-app-sidebar";

export async function SidebarWithCases() {
  const result = await getAllCases();
  const cases = result.success ? result.data : [];

  return <LegalAppSidebar cases={cases} />;
}