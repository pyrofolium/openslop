"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ContentElement } from "@/lib/canvas/types";
import { getDuration } from "@/lib/canvas/element-attributes";
import { useGenerationQueue } from "@/lib/generation/generation-queue-provider";
import { isGenerationActive } from "@/lib/generation/snapshots";
import { SlideSchema, type Slide } from "@/lib/slides/schema";
import { errorMessage } from "@/lib/errors";
import { useElementGeneration } from "./element-generation-context";

const EMPTY_SLIDE: Slide = {
	version: 1,
	html: "<main>New slide</main>",
	css: "",
	js: "window.renderAt = (timeInSeconds) => {};",
};
const FIELDS = ["html", "css", "js"] as const;
const LABELS = { html: "HTML", css: "CSS", js: "JavaScript" };

export function SlideCodeButton({ element }: { element: ContentElement }) {
	const { result, node, status } = useElementGeneration();
	const queue = useGenerationQueue();
	const [draft, setDraft] = useState<Slide | null>(null);
	const [error, setError] = useState<string | null>(null);
	const save = () => {
		try {
			const slide = SlideSchema.parse(draft);
			queue.commitResult(
				node,
				{ slide, durationSec: result?.durationSec ?? getDuration(element) },
				{ pinned: true },
			);
			setDraft(null);
		} catch (cause) {
			setError(errorMessage(cause));
		}
	};
	return (
		<>
			<Button
				variant="secondary"
				size="sm"
				disabled={isGenerationActive(status)}
				onClick={() => {
					setDraft(result?.slide ?? EMPTY_SLIDE);
					setError(null);
				}}
			>
				Edit code
			</Button>
			<Dialog
				open={draft !== null}
				onOpenChange={(open) => {
					if (!open) setDraft(null);
				}}
			>
				<DialogContent className="sm:max-w-3xl">
					<DialogHeader>
						<DialogTitle>Slide code</DialogTitle>
						<DialogDescription>
							HTML, CSS and JavaScript for this slide. Define
							window.renderAt(timeInSeconds) to draw any moment, including
							backward seeks. External resources are blocked.
						</DialogDescription>
					</DialogHeader>
					{draft && (
						<Tabs defaultValue="html">
							<TabsList>
								{FIELDS.map((field) => (
									<TabsTrigger key={field} value={field}>
										{LABELS[field]}
									</TabsTrigger>
								))}
							</TabsList>
							{FIELDS.map((field) => (
								<TabsContent key={field} value={field}>
									<Textarea
										aria-label={`${LABELS[field]} source`}
										value={draft[field]}
										onChange={(event) =>
											setDraft({ ...draft, [field]: event.target.value })
										}
										rows={14}
										spellCheck={false}
									/>
								</TabsContent>
							))}
						</Tabs>
					)}
					{error && (
						<p role="alert" className="text-body text-destructive">
							{error}
						</p>
					)}
					<DialogFooter>
						<Button variant="secondary" onClick={() => setDraft(null)}>
							Cancel
						</Button>
						<Button onClick={save}>Save slide</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
