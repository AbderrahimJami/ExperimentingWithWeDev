import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import LandingPage from "../pages/LandingPage";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: null, isInitializing: false }),
}));

describe("LandingPage", () => {
  it("renders the hero message", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: /Launch a login experience that feels finished on day one/i,
      })
    ).toBeInTheDocument();
  });
});
