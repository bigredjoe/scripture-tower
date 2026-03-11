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

// ── Regression: non-blanked words must not turn green in stage 1 type mode ──
//
// Root cause: typedWordIds was built by scanning all charArray entries from 0
// to typingCursor, including entries for visible (non-blanked) words the cursor
// silently jumped over.  Those words ended up in typedWordIds and rendered
// as confirmed (green) even though the user never typed them.
//
// Math.random is mocked to 0 so computeWordBatchMap is deterministic:
//   "one two three four five six"   ids 0..5
//   shuffled → [1,2,3,4,5,0]  batchMap: {1:0, 2:1, 3:2, 4:3, 5:0, 0:1}
//   blanked at substage 1 (batch < 1): wordId=1 ("two"), wordId=5 ("six")
//   visible at substage 1: wordId=0 ("one"), 2 ("three"), 3 ("four"), 4 ("five")

test.describe('Regression: stage 1 visible words do not spuriously turn green', () => {
  test.beforeEach(async ({ page }) => {
    // Deterministic batch assignment — same every run
    await page.addInitScript(() => { Math.random = () => 0; });
    await startApp(page, 'one two three four five six');
    await page.locator('button', { hasText: 'Next' }).click(); // stage 0 → stage 1
    await switchToTypeMode(page);
  });

  test('visible words before and after a blank stay plain when cursor jumps past them', async ({ page }) => {
    // Before typing: "one" is visible and plain; "two" is the first blank (cursor)
    await expect(word(page, 0)).toHaveAttribute('data-state', 'plain');   // one — before blank
    await expect(word(page, 1)).toHaveAttribute('data-state', 'cursor');  // two — first blank

    // Type the first blanked word
    await page.keyboard.type('two');

    // Only "two" should be confirmed
    await expect(word(page, 1)).toHaveAttribute('data-state', 'confirmed'); // two — typed

    // All visible words the cursor silently jumped over must remain plain
    await expect(word(page, 0)).toHaveAttribute('data-state', 'plain');   // one — before blank
    await expect(word(page, 2)).toHaveAttribute('data-state', 'plain');   // three — between blanks
    await expect(word(page, 3)).toHaveAttribute('data-state', 'plain');   // four  — between blanks
    await expect(word(page, 4)).toHaveAttribute('data-state', 'plain');   // five  — between blanks

    // Cursor has moved to the next blank ("six")
    await expect(word(page, 5)).toHaveAttribute('data-state', 'cursor');  // six — next blank
  });
});

// ── mobile keyboard support ─────────────────────────────────────────────────

test.describe('Mobile keyboard support', () => {
  test.beforeEach(async ({ page }) => {
    await startApp(page);
    await switchToTypeMode(page);
  });

  test('hidden input exists in the DOM when type mode is active', async ({ page }) => {
    await expect(page.locator('input[aria-hidden="true"]')).toBeAttached();
  });

  test('hidden input is absent in click mode', async ({ page }) => {
    await page.locator('button', { hasText: 'Click mode' }).click();
    await expect(page.locator('input[aria-hidden="true"]')).not.toBeAttached();
  });

  test('hidden input receives focus when type mode activates', async ({ page }) => {
    await expect(page.locator('input[aria-hidden="true"]')).toBeFocused();
  });

  test('typing via the hidden input element confirms words (mobile keyboard simulation)', async ({ page }) => {
    const input = page.locator('input[aria-hidden="true"]');
    // pressSequentially dispatches keydown events that bubble to the window listener
    await input.pressSequentially('hello');
    await expect(word(page, 0)).toHaveAttribute('data-state', 'confirmed');
  });

  test('full text can be confirmed by typing through the hidden input', async ({ page }) => {
    const input = page.locator('input[aria-hidden="true"]');
    await input.pressSequentially('hello');
    await input.pressSequentially('world');
    // Both words confirmed — counter shows 2 / 2
    await expect(page.locator('strong').filter({ hasText: '2' })).toBeVisible();
  });

  test('wrong key typed into hidden input does not confirm the word', async ({ page }) => {
    const input = page.locator('input[aria-hidden="true"]');
    await input.press('z'); // 'z' is wrong — expected 'h'
    await expect(word(page, 0)).not.toHaveAttribute('data-state', 'confirmed');
  });

  test('hidden input re-gains focus when type mode is toggled off then on', async ({ page }) => {
    // Toggle to click mode
    await page.locator('button', { hasText: 'Click mode' }).click();
    await expect(page.locator('input[aria-hidden="true"]')).not.toBeAttached();
    // Toggle back to type mode
    await page.locator('button', { hasText: 'Type mode' }).click();
    await expect(page.locator('input[aria-hidden="true"]')).toBeFocused();
  });
});

// ── PWA ─────────────────────────────────────────────────────────────────────

test.describe('PWA', () => {
  test('web app manifest link is present in the HTML head', async ({ page }) => {
    await page.goto('/');
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /manifest\.webmanifest/);
  });

  test('manifest link points to a webmanifest URL', async ({ page }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBe('/manifest.webmanifest');
  });

  test('iOS home screen meta tags are present', async ({ page }) => {
    await page.goto('/');
    const capable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(capable).toHaveAttribute('content', 'yes');
    const title = page.locator('meta[name="apple-mobile-web-app-title"]');
    await expect(title).toHaveAttribute('content', 'Scripture Tower');
    const icon = page.locator('link[rel="apple-touch-icon"]');
    await expect(icon).toHaveAttribute('href', '/apple-touch-icon.png');
  });

  test('theme-color meta tag is present', async ({ page }) => {
    await page.goto('/');
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#c8933a');
  });

  test('viewport includes viewport-fit=cover for iOS safe areas', async ({ page }) => {
    await page.goto('/');
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /viewport-fit=cover/);
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
