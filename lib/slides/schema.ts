import { z } from "zod";

export const SlideSchema = z.object({
	version: z.literal(1),
	html: z.string().min(1).max(100_000),
	css: z.string().max(100_000),
	js: z.string().max(100_000),
});

export type Slide = z.infer<typeof SlideSchema>;

export function parseSlide(text: string): Slide {
	const json = text
		.trim()
		.replace(/^```(?:json)?\s*/, "")
		.replace(/\s*```$/, "");
	return SlideSchema.parse(JSON.parse(json));
}
