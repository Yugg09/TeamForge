import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { IdentityProvider } from "@/context/IdentityProvider";
import { DashboardPage } from "@/pages/DashboardPage";
import { LandingPage } from "@/pages/LandingPage";
import { ParticipantDetailPage } from "@/pages/ParticipantDetailPage";
import { ParticipantsPage } from "@/pages/ParticipantsPage";
import { TeamDetailPage } from "@/pages/TeamDetailPage";
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
          <Route path="teams" element={<TeamsPage />} />
          <Route path="teams/:id" element={<TeamDetailPage />} />
        </Route>
      </Routes>
    </IdentityProvider>
  );
}
