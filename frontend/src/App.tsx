import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { IdentityProvider } from "@/context/IdentityProvider";
import { CandidatesPage } from "@/pages/CandidatesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LandingPage } from "@/pages/LandingPage";
import { OrganizerStubPage } from "@/pages/OrganizerStubPage";
import { ParticipantDetailPage } from "@/pages/ParticipantDetailPage";
import { ParticipantsPage } from "@/pages/ParticipantsPage";
import { ProjectCreatePage } from "@/pages/ProjectCreatePage";
import { RebalancePage } from "@/pages/RebalancePage";
import { TeamDetailPage } from "@/pages/TeamDetailPage";
import { TeamsCompareStubPage } from "@/pages/TeamsCompareStubPage";
import { TeamsPage } from "@/pages/TeamsPage";

export default function App() {
  return (
    <IdentityProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<LandingPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="participants" element={<ParticipantsPage />} />
          <Route path="participants/:id" element={<ParticipantDetailPage />} />
          <Route path="candidates" element={<CandidatesPage />} />
          <Route path="projects/new" element={<ProjectCreatePage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="teams/compare" element={<TeamsCompareStubPage />} />
          <Route path="teams/:id" element={<TeamDetailPage />} />
          <Route path="rebalance/:id" element={<RebalancePage />} />
          <Route path="organizer" element={<OrganizerStubPage />} />
        </Route>
      </Routes>
    </IdentityProvider>
  );
}
