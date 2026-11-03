"use client";

import { Badge } from "@/components/ui/badge";
import { Pin } from "@/components/ui/icon";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { useElementGeneration } from "../element-generation-context";

export function UploadedBadge({ label = "Uploaded" }: { label?: string }) {
	const { pinned, hasResult } = useElementGeneration();
	if (!pinned || !hasResult) return null;
	return (
		<SimpleTooltip label={`${label}; protected from Generate All`}>
			<Badge variant="onMedia">
				<Pin className="h-3 w-3" />
				{label}
			</Badge>
		</SimpleTooltip>
	);
}
