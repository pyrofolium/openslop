import { BaseConnector } from "../base";
import { AttributeSchema } from "../attributes/schema";
import {
	durationDef,
	timelineDurationDef,
	trimStartDef,
} from "../attributes/common";
import { HttpLLMGateway } from "@/lib/gateway/http";
import { SLIDE_INSTRUCTION, SLIDE_SYSTEM_PROMPT } from "@/lib/slides/prompt";
import { parseSlide } from "@/lib/slides/schema";
import type { AssetResult, ConnectorGenerateParams } from "../types";

export class SlideConnector extends BaseConnector<
	ConnectorGenerateParams & { duration?: number | string },
	AssetResult
> {
	readonly type = "slide" as const;

	static attributesFor() {
		return AttributeSchema.from([
			durationDef,
			trimStartDef,
			timelineDurationDef,
		]);
	}

	protected async _generate(
		params: ConnectorGenerateParams & { duration?: number | string },
		signal?: AbortSignal,
	): Promise<AssetResult> {
		const durationSec = Number(params.duration ?? 10);
		if (!Number.isFinite(durationSec) || durationSec <= 0)
			throw new Error("Slide duration must be a positive number.");
		const gateway = new HttpLLMGateway(this.model);
		let text = "";
		for await (const chunk of gateway.stream(
			{
				...this.model,
				prompt: `${SLIDE_INSTRUCTION}\nDuration: ${durationSec} seconds.\n${params.prompt}`,
				systemPrompt: SLIDE_SYSTEM_PROMPT,
				maxTokens: 12000,
			},
			signal,
		)) {
			text += chunk.text;
			if (text.length > 400_000)
				throw new Error("Generated slide is too large.");
		}
		return { slide: parseSlide(text), durationSec };
	}
}
