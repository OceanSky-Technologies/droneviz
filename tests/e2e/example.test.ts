import { test, expect } from "@playwright/test";

// THESE TESTS START THE SERVER TOGETHER WITH THE TESTS

test("basic test", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  // console.log(await page.innerHTML("body"));

  const name = await page.innerText("#mainToolbar");
  expect(name).toBeDefined();
});
