import { describe, expect, it } from "vitest";
import { parseSlide } from "../schema";
import { MOCK_SLIDE } from "../mock";
import { AssetResultSchema } from "@/lib/connectors/types";
import { resultIdentity } from "@/lib/connectors/asset-url";
import { parseOSML } from "@/lib/canvas/osml-stream-parser";
import { serializeOSMLWithScenes } from "@/lib/canvas/osml-serializer";
import { resolveElements } from "@/lib/render/resolve";
import { buildRenderLayout } from "@/lib/render/scene-builder";
import { VideoSettingsSchema } from "@/lib/project/video-settings";
import type { Scene } from "@/lib/canvas/types";
import type { ElementSnapshot } from "@/lib/generation/snapshots";

const result = { durationSec: 6, slide: MOCK_SLIDE };

describe("slides", () => {
	it("validates generated JSON and rejects missing code or unsupported versions", () => {
		expect(
			parseSlide("```json\n" + JSON.stringify(MOCK_SLIDE) + "\n```"),
		).toEqual(MOCK_SLIDE);
		expect(() => parseSlide('{"version":2}')).toThrow();
		expect(() => parseSlide("<main>Not JSON</main>")).toThrow();
	});
	it("preserves source in saved results and distinguishes edited versions", () => {
		expect(AssetResultSchema.parse(JSON.parse(JSON.stringify(result)))).toEqual(
			result,
		);
		expect(resultIdentity(result)).not.toBe(
			resultIdentity({
				...result,
				slide: { ...MOCK_SLIDE, css: "body {color:red}" },
			}),
		);
	});
	it("round trips OSML prompts and places generated slides on the timeline without a media URL", () => {
		const [element] = parseOSML('<slide duration="6">Show A &amp; B</slide>');
		if (!element || element.type !== "slide") throw new Error("Missing slide");
		const scene: Scene = { id: "scene", type: "scene", children: [element] };
		expect(serializeOSMLWithScenes([scene])).toContain(
			"Show A &amp; B</slide>",
		);
		const snapshot: ElementSnapshot = {
			result,
			status: "idle",
			pinned: false,
			error: null,
			startedAt: null,
			resultInputs: null,
			connectorType: "slide",
		};
		const elements = resolveElements([scene], () => snapshot, {
			captionsEnabled: false,
		});
		expect(elements[0]).toMatchObject({
			type: "slide",
			slide: MOCK_SLIDE,
			durationSec: 6,
		});
		const layout = buildRenderLayout(elements, VideoSettingsSchema.parse({}));
		expect(layout.totalFrames).toBe(144);
		expect(layout.series).toHaveLength(1);
	});
});
