import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
	useCurrentFrame,
	useDelayRender,
	useRemotionEnvironment,
	useVideoConfig,
} from "remotion";
import type { Slide } from "@/lib/slides/schema";
import { slideDocument } from "@/lib/slides/document";

export type HtmlSlideProps = { slide: Slide; trimStartSec?: number };

export function HtmlSlide({ slide, trimStartSec = 0 }: HtmlSlideProps) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const { isRendering } = useRemotionEnvironment();
	const { delayRender, continueRender, cancelRender } = useDelayRender();
	const ref = useRef<HTMLIFrameElement>(null);
	const request = useRef(0);
	const loading = useRef<number | null>(null);
	const [ready, setReady] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const document = useMemo(() => slideDocument(slide), [slide]);

	useLayoutEffect(() => {
		const handle = delayRender("Loading HTML slide");
		loading.current = handle;
		const timeout = window.setTimeout(() => {
			setError("The slide did not load. Regenerate it or check its code.");
			if (isRendering) cancelRender(new Error("HTML slide load timed out"));
			continueRender(handle);
		}, 10000);
		const loaded = (event: MessageEvent) => {
			if (
				event.source !== ref.current?.contentWindow ||
				event.data?.type !== "slide-ready"
			)
				return;
			window.clearTimeout(timeout);
			setReady(true);
		};
		window.addEventListener("message", loaded);
		return () => {
			window.clearTimeout(timeout);
			window.removeEventListener("message", loaded);
			continueRender(handle);
		};
	}, [delayRender, continueRender, cancelRender, isRendering]);

	useLayoutEffect(() => {
		if (!ready) return;
		const id = ++request.current;
		const handle = delayRender(`Drawing slide frame ${frame}`);
		const fail = (message: string) => {
			setError(message);
			if (loading.current !== null) continueRender(loading.current);
			if (isRendering) cancelRender(new Error(message));
			continueRender(handle);
		};
		const timeout = window.setTimeout(
			() => fail("The slide did not draw this frame."),
			10000,
		);
		const rendered = (event: MessageEvent) => {
			if (event.source !== ref.current?.contentWindow || event.data?.id !== id)
				return;
			if (event.data.type === "slide-error") {
				window.clearTimeout(timeout);
				fail(String(event.data.error).slice(0, 500));
			} else if (event.data.type === "slide-rendered") {
				setError(null);
				window.clearTimeout(timeout);
				continueRender(handle);
				if (loading.current !== null) continueRender(loading.current);
			}
		};
		window.addEventListener("message", rendered);
		ref.current?.contentWindow?.postMessage(
			{
				type: "slide-frame",
				id,
				time: Math.max(0, frame / fps + trimStartSec),
			},
			"*",
		);
		return () => {
			window.clearTimeout(timeout);
			window.removeEventListener("message", rendered);
			continueRender(handle);
		};
	}, [
		frame,
		fps,
		trimStartSec,
		ready,
		delayRender,
		continueRender,
		cancelRender,
		isRendering,
	]);

	return (
		<>
			<iframe
				ref={ref}
				title="Animated slide"
				srcDoc={document}
				sandbox="allow-scripts"
				referrerPolicy="no-referrer"
				tabIndex={-1}
				style={{
					border: 0,
					width: "100%",
					height: "100%",
					pointerEvents: "none",
				}}
			/>
			{error && (
				<div
					role="alert"
					style={{
						position: "absolute",
						inset: 0,
						padding: "5%",
						background: "Canvas",
						color: "CanvasText",
					}}
				>
					{error}
				</div>
			)}
		</>
	);
}
