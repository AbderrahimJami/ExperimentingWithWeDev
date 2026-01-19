import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "../pages/DashboardPage";
import { fetchExperiencesForUser } from "../services/catalogService";

const { mockExperiences } = vi.hoisted(() => ({
  mockExperiences: [
    {
      id: "exp-1",
      title: "Orbital Drift",
      description: "Test experience.",
      hasAccess: true,
      status: "available",
    },
    {
      id: "exp-2",
      title: "Neon Forge",
      description: "Locked experience.",
      hasAccess: false,
      status: "locked",
      lockReason: "Upgrade to unlock.",
    },
  ],
}));

vi.mock("../services/catalogService", () => ({
  isCatalogConfigured: true,
  fetchExperiencesForUser: vi.fn().mockResolvedValue(mockExperiences),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "tester@example.com" },
    signOut: vi.fn(),
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const renderDashboard = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("DashboardPage", () => {
  it("renders skeletons while loading", () => {
    fetchExperiencesForUser.mockImplementationOnce(
      () => new Promise(() => {})
    );
    renderDashboard();

    expect(screen.getByTestId("dashboard-skeleton")).toBeInTheDocument();
  });

  it("shows unlocked experiences by default and reveals locked ones on toggle", async () => {
    renderDashboard();

    expect(await screen.findByText("Orbital Drift")).toBeInTheDocument();
    expect(screen.queryByText("Neon Forge")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/show locked experiences/i));

    expect(await screen.findByText("Neon Forge")).toBeInTheDocument();
  });
});
