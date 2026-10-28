import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const screenshots = "test-results/screenshots";
test.beforeAll(() => mkdir(screenshots, { recursive: true }));

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Email or Index Number").fill("admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill("BrowserTestPassword123!");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true })).toBeVisible();
  await expect(page.getByText("Loading dashboard...", { exact: true })).toHaveCount(0);
}

test("announcement CRUD, persistence, validation, filtering and safe deletion", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  const manager = page.getByRole("region", { name: "Manage Announcements" });
  await manager.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${screenshots}/01-announcement-management.png` });
  await expect(manager.getByRole("article")).toHaveCount(5);
  await manager.getByRole("button", { name: "Next", exact: true }).click();
  await expect(manager.getByRole("article")).toHaveCount(2);
  await manager.getByRole("button", { name: "Reset filters" }).click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  expect(
    await page
      .getByLabel("Title", { exact: true })
      .first()
      .evaluate((input) => input.validity.valueMissing),
  ).toBe(true);
  await page.getByLabel("Title", { exact: true }).first().fill("Dreamway examination notice");
  await page
    .getByLabel("Summary", { exact: true })
    .fill("Examination information is available from the Dreamway page.");
  await page.getByLabel("Event Date", { exact: true }).fill("2026-10-31");
  await page.getByLabel("Title", { exact: true }).first().scrollIntoViewIfNeeded();
  await page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Publish Announcement", exact: true }) })
    .screenshot({ path: `${screenshots}/05-announcement-create.png` });
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("Announcement published.", { exact: true })).toBeVisible();
  await page.reload();
  await manager.getByLabel("Search title or summary").fill("dreamway examination");
  await expect(manager.getByRole("article")).toHaveCount(1);
  await manager.getByText("View details", { exact: false }).click();
  await expect(
    manager.getByText("Examination information is available from the Dreamway page.", {
      exact: true,
    }),
  ).toBeVisible();
  await manager.getByLabel("Filter by category").selectOption("Resources");
  await expect(manager.getByRole("article")).toHaveCount(0);
  await manager.getByLabel("Filter by category").selectOption("Dreamway");
  await expect(manager.getByRole("article")).toHaveCount(1);
  await manager
    .getByRole("button", { name: "Edit Dreamway examination notice", exact: true })
    .click();
  const title = page.getByLabel("Title", { exact: true }).first();
  await title.fill("Should not be saved");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    manager.getByRole("heading", { name: "Dreamway examination notice", exact: true }),
  ).toBeVisible();
  await manager
    .getByRole("button", { name: "Edit Dreamway examination notice", exact: true })
    .click();
  await title.fill("   ");
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Provide category");
  await title.fill("Dreamway examination update");
  await title.scrollIntoViewIfNeeded();
  await page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Edit Announcement", exact: true }) })
    .screenshot({ path: `${screenshots}/02-announcement-edit.png` });
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(page.getByText("Announcement updated.", { exact: true })).toBeVisible();
  await page.goto("/announcements");
  await expect(
    page.getByRole("heading", { name: "Dreamway examination update", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("heading", { name: "Dreamway examination update", exact: true })
    .scrollIntoViewIfNeeded();
  await page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Dreamway examination update", exact: true }),
    })
    .screenshot({ path: `${screenshots}/03-public-announcement.png` });
  await page.goto("/admin");
  await manager.getByLabel("Search title or summary").fill("Dreamway examination update");
  page.once("dialog", (dialog) => dialog.dismiss());
  await manager
    .getByRole("button", { name: "Delete Dreamway examination update", exact: true })
    .click();
  await expect(manager.getByRole("article")).toHaveCount(1);
  page.once("dialog", (dialog) => dialog.accept());
  await manager
    .getByRole("button", { name: "Delete Dreamway examination update", exact: true })
    .click();
  await expect(page.getByText("Announcement deleted.", { exact: true })).toBeVisible();
  await page.reload();
  await manager.getByLabel("Search title or summary").fill("Dreamway examination update");
  await expect(manager.getByRole("article")).toHaveCount(0);
  await manager.getByRole("button", { name: "Reset filters" }).click();
  await manager.getByLabel("Sort announcements").selectOption("oldest");
  await expect(manager.getByRole("article").first()).toContainText("Sample 1:");
  await manager.getByLabel("Sort announcements").selectOption("newest");
  await expect(manager.getByRole("article").first()).toContainText("Sample 7:");
  await manager.getByLabel("Sort announcements").selectOption("title");
  await expect(manager.getByRole("article").first()).toContainText("Sample 1:");
  expect(errors).toEqual([]);
});

test("mobile layout, keyboard controls and public navigation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  const manager = page.getByRole("region", { name: "Manage Announcements" });
  await manager.getByLabel("Search title or summary").fill("Sample 1:");
  await manager.getByLabel("Search title or summary").focus();
  await page.keyboard.press("Tab");
  await expect(manager.getByLabel("Filter by category")).toBeFocused();
  await manager.scrollIntoViewIfNeeded();
  await manager.screenshot({ path: `${screenshots}/04-mobile-management.png` });
  for (const width of [375, 768, 1365]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/admin",
      "/login",
      "/register",
      "/announcements",
      "/contact",
      "/past-papers",
      "/results",
    ]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        `${route} at ${width}px`,
      ).toBe(true);
    }
  }
});
