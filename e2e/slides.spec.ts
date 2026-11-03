import { test, expect, type Page } from "@playwright/test";
import { slideDocument } from "../lib/slides/document";
import { MOCK_SLIDE } from "../lib/slides/mock";
import type { Slide } from "../lib/slides/schema";

async function openSlide(page: Page, slide: Slide) {
	await page.setContent(
		'<iframe title="sandbox" sandbox="allow-scripts" style="width:640px;height:360px"></iframe>',
	);
	await page.evaluate((srcDoc) => {
		const iframe = document.querySelector("iframe");
		if (!iframe) throw new Error("Missing sandbox");
		window.addEventListener("message", (event) => {
			if (event.source === iframe.contentWindow)
				document.body.dataset.reply = JSON.stringify(event.data);
		});
		iframe.srcdoc = srcDoc;
	}, slideDocument(slide));
	await expect(page.locator("body")).toHaveAttribute(
		"data-reply",
		/slide-ready/,
	);
}

async function seek(page: Page, time: number) {
	await page.evaluate((time) => {
		delete document.body.dataset.reply;
		document
			.querySelector("iframe")
			?.contentWindow?.postMessage(
				{ type: "slide-frame", id: time, time },
				"*",
			);
	}, time);
	await expect(page.locator("body")).toHaveAttribute(
		"data-reply",
		/slide-rendered/,
	);
}

const content = (page: Page) =>
	page.frameLocator("iframe").frameLocator("iframe");

test("slides seek backward deterministically and keep CSS inside the sandbox", async ({
	page,
}) => {
	await openSlide(page, MOCK_SLIDE);
	await expect(content(page).locator("footer")).toHaveText(
		"Mock slide · No AI credits used",
	);
	await seek(page, 1.5);
	await expect(content(page).locator("#count")).toHaveText("50%");
	await seek(page, 3);
	await expect(content(page).locator("#count")).toHaveText("100%");
	await seek(page, 0);
	await expect(content(page).locator("#count")).toHaveText("0%");
	await expect(page.locator("body")).not.toHaveCSS(
		"background-color",
		"rgb(23, 21, 38)",
	);
});

test("sandbox denies host DOM, storage, network requests and navigation", async ({
	page,
}) => {
	const requests: string[] = [];
	await page.route("https://example.com/**", (route) => {
		requests.push(route.request().url());
		return route.abort();
	});
	await openSlide(page, {
		...MOCK_SLIDE,
		js: `
		let parentBlocked = false, storageBlocked = false;
		try { parent.document.body.textContent = 'escaped'; } catch { parentBlocked = true; }
		try { localStorage.setItem('escape', 'yes'); } catch { storageBlocked = true; }
		fetch('https://example.com/fetch').catch(() => {});
		const image = new Image(); image.src = 'https://example.com/image';
		window.renderAt = time => {
			document.querySelector('#count').textContent = parentBlocked && storageBlocked ? 'isolated' : 'escaped';
			if(time > 0) location.href = 'https://example.com/navigation';
		};
	`,
	});
	await seek(page, 0);
	await expect(content(page).locator("#count")).toHaveText("isolated");
	await page.evaluate(() => {
		delete document.body.dataset.reply;
		document
			.querySelector("iframe")
			?.contentWindow?.postMessage(
				{ type: "slide-frame", id: 1, time: 1 },
				"*",
			);
	});
	await expect(page.locator("body")).toHaveAttribute(
		"data-reply",
		/slide-error.*navigation is blocked/,
	);
	expect(requests).toEqual([]);
});

test("invalid JavaScript reports an error instead of silently rendering a blank frame", async ({
	page,
}) => {
	await openSlide(page, {
		...MOCK_SLIDE,
		js: 'throw new Error("Broken slide")',
	});
	await page.evaluate(() =>
		document
			.querySelector("iframe")
			?.contentWindow?.postMessage(
				{ type: "slide-frame", id: 1, time: 0 },
				"*",
			),
	);
	await expect(page.locator("body")).toHaveAttribute(
		"data-reply",
		/slide-error.*Broken slide/,
	);
});

test("offscreen previews still acknowledge seeks", async ({ page }) => {
	await openSlide(page, MOCK_SLIDE);
	await page.locator("iframe").evaluate((iframe) => {
		iframe.style.position = "absolute";
		iframe.style.top = "10000px";
	});
	await seek(page, 1.5);
	await expect(content(page).locator("#count")).toHaveText("50%");
});
