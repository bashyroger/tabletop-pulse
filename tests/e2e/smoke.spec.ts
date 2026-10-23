import { test, expect } from "@playwright/test";

test.describe("TabletopPulse End-to-End Smoke Verification", () => {
  test("renders Dashboard, Game Closet, ELO Leaderboard, Rivalries, Share Studio, and Public Share Card with zero console errors", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    // 1. Club Pulse Dashboard
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Amsterdam Meeple Society", exact: true })
    ).toBeVisible();
    await expect(page.getByText("Rogier van der Berg").first()).toBeVisible();
    await expect(page.getByText("Ark Nova").first()).toBeVisible();

    // 2. Match Log
    await page.goto("/sessions");
    await expect(
      page.getByRole("heading", { name: "Match Log & Table Nights" })
    ).toBeVisible();
    await expect(
      page.getByText("The Great Birmingham Rail Monopoly")
    ).toBeVisible();

    // 3. Board Game Closet
    await page.goto("/games");
    await expect(
      page.getByRole("heading", { name: "Board Game Closet" })
    ).toBeVisible();
    await expect(page.getByText("Brass: Birmingham").first()).toBeVisible();

    // 4. ELO Leaderboard
    await page.goto("/players");
    await expect(
      page.getByRole("heading", { name: "Club ELO Leaderboard" })
    ).toBeVisible();
    await expect(page.getByText("Sanne de Vries").first()).toBeVisible();

    // 5. Rivalries H2H
    await page.goto("/rivalries");
    await expect(
      page.getByRole("heading", { name: "Rivalry Analyzer (H2H)" })
    ).toBeVisible();

    // 6. Share Card Studio
    await page.goto("/share-studio");
    await expect(
      page.getByRole("heading", { name: "Shareable Stat Card Studio" })
    ).toBeVisible();

    // 7. Public Share Card Route
    await page.goto("/share/amsterdam-autumn-season-2026");
    await expect(
      page.getByText("Amsterdam Meeple Society • Autumn 2026 Wrapped")
    ).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
