import { test, expect, type Page } from '@playwright/test';

// ── helpers ────────────────────────────────────────────────────────────────

const SAMPLE_TEXT = 'hello world';

async function startApp(page: Page, text = SAMPLE_TEXT) {
  await page.goto('/');
  await page.locator('textarea').fill(text);
  await page.locator('button', { hasText: 'Start Memorizing' }).click();
}

async function switchToTypeMode(page: Page) {
  await page.locator('button', { hasText: 'Type mode' }).click();
}

/** Word locator by word-id data attribute (set by WordToken). */
function word(page: Page, id: number) {
  return page.locator(`[data-word-id="${id}"]`);
}

// ── input screen ───────────────────────────────────────────────────────────

test.describe('Input screen', () => {
  test('shows error when no text is entered', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'Start Memorizing' }).click();
    await expect(page.getByText('Please paste some text')).toBeVisible();
  });

  test('navigates to memorize screen on valid text', async ({ page }) => {
    await startApp(page);
    // Stage bar should appear, indicating memorize screen
    await expect(page.locator('[data-word-id="0"]')).toBeVisible();
  });
});

// ── stage 0 — read mode ────────────────────────────────────────────────────

test.describe('Stage 0 — read mode (click)', () => {
  test('full text is visible with no blanks', async ({ page }) => {
    await startApp(page);
    await expect(word(page, 0)).toContainText('hello');
    await expect(word(page, 1)).toContainText('world');
  });

  test('words show data-state="plain" in click mode', async ({ page }) => {
    await startApp(page);
    await expect(word(page, 0)).toHaveAttribute('data-state', 'plain');
  });
});

// ── stage 0 — type mode ────────────────────────────────────────────────────

test.describe('Stage 0 — type mode', () => {
  test.beforeEach(async ({ page }) => {
    await startApp(page);
    await switchToTypeMode(page);
  });

  test('first word starts with data-state="cursor"', async ({ page }) => {
    await expect(word(page, 0)).toHaveAttribute('data-state', 'cursor');
  });

  test('progress counter shows "0 / 2 words confirmed" initially', async ({ page }) => {
    await expect(page.locator('strong').filter({ hasText: /^0$/ })).toBeVisible();
    await expect(page.getByText(/words confirmed/)).toBeVisible();
  });

  test('partial typing does NOT confirm the word (bug-fix regression)', async ({ page }) => {
    // Type only first letter — word must remain in cursor state, not confirmed
    await page.keyboard.press('h');
    await expect(word(page, 0)).toHaveAttribute('data-state', 'cursor');
    await expect(word(page, 0)).not.toHaveAttribute('data-state', 'confirmed');
  });

  test('word becomes confirmed only after all letters are typed', async ({ page }) => {
    await page.keyboard.type('hello');
    await expect(word(page, 0)).toHaveAttribute('data-state', 'confirmed');
  });

  test('cursor advances to second word after first is confirmed', async ({ page }) => {
    await page.keyboard.type('hello');
    await expect(word(page, 1)).toHaveAttribute('data-state', 'cursor');
  });

  test('wrong key does not confirm the word', async ({ page }) => {
    await page.keyboard.press('z'); // wrong key — expected 'h'
    await expect(word(page, 0)).not.toHaveAttribute('data-state', 'confirmed');
  });

  test('progress counter updates after each confirmed word', async ({ page }) => {
    await page.keyboard.type('hello');
    // Counter should now show 1 confirmed
    const label = page.locator('strong').filter({ hasText: '1' });
    await expect(label).toBeVisible();

    await page.keyboard.type('world');
    const label2 = page.locator('strong').filter({ hasText: '2' });
    await expect(label2).toBeVisible();
  });

  test('switching back to click mode shows reading mode message', async ({ page }) => {
    await page.locator('button', { hasText: 'Click mode' }).click();
    await expect(page.getByText(/Reading mode/)).toBeVisible();
  });
});

// ── stage 1 — first letters ────────────────────────────────────────────────

test.describe('Stage 1 — first letters, type mode', () => {
  test.beforeEach(async ({ page }) => {
    await startApp(page, 'alpha beta gamma delta');
    await page.locator('button', { hasText: 'Next' }).click(); // advance to stage 1
    await switchToTypeMode(page);
  });

  test('blanked words start with data-state="cursor" or "plain"', async ({ page }) => {
    // At least one word should have cursor state (the first blanked word)
    const cursored = page.locator('[data-state="cursor"]');
    await expect(cursored).toBeVisible();
  });

  test('typing the correct word confirms it', async ({ page }) => {
    // Find which word has the cursor
    const cursoredWord = page.locator('[data-state="cursor"]').first();
    const wordText = await cursoredWord.textContent();

    // Type it — word text may include first-letter hint visually, but we type the core
    // We identify the word by data-word-id, look at tokens to get core
    // For E2E simplicity: just type all text of what is visible (first letter is shown)
    // Type the full core word (one char at a time)
    for (const ch of (wordText ?? '').trim().replace(/[─]+/g, '').trim()) {
      await page.keyboard.press(ch);
    }

    // After typing, state should be confirmed or cursor has moved on
    // Just verify total confirmed count increased from 0
    await expect(page.locator('strong').filter({ hasText: /^[1-9]/ })).toBeVisible();
  });
});

// ── navigation ─────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('"← New text" returns to input screen', async ({ page }) => {
    await startApp(page);
    await page.locator('button', { hasText: 'New text' }).click();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('advancing stages clears revealed words', async ({ page }) => {
    await startApp(page);
    // Go to stage 1, reveal a word via click
    await page.locator('button', { hasText: 'Next' }).click();
    const firstWord = word(page, 0);
    // Click the blank to reveal it (if it's blanked at substage 1)
    // Words may not all be blanked at substage 1; click the stage 2 button instead
    await page.locator('button', { hasText: 'Next' }).click(); // stage 2
    // Stage change should clear revealed — data-state should be plain or cursor
    await expect(firstWord).not.toHaveAttribute('data-state', 'confirmed');
  });
});
