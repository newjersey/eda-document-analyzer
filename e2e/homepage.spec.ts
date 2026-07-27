import { expect, test } from "@playwright/test";

test("homepage loads and has expected title", async ({ page }) => {
  await page.goto("/");

  const heading = page.getByRole("heading", { level: 1 });
  const text = await heading.textContent();

  expect(text).toEqual("NJ EASEEntrepreneurial Application Screening Engine");
});

// test("get started link", async ({ page }) => {
//   await page.goto("https://playwright.dev/");

//   // Click the get started link.
//   await page.getByRole("link", { name: "Get started" }).click();

//   // Expects page to have a heading with the name of Installation.
//   await expect(page.getByRole("heading", { name: "Installation" })).toBeVisible();
// });
