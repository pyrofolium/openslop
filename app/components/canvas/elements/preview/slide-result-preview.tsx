import { ASPECT_RATIO_DIMENSIONS } from "@/lib/project/aspect-ratio";
import { useVideoSetting } from "@/lib/project/use-video-setting";
import { Player } from "@remotion/player";
import { HtmlSlide } from "@/remotion/components/html-slide";
import { DEFAULT_FPS } from "@/lib/render/types";
import type { ElementPreviewProps } from "./status";
import { MediaPlaceholder } from "./results";
import { ErrorMessage, PreviewChrome, ResultOverlay } from "./overlays";

export function SlideResultPreview({ result, ...state }: ElementPreviewProps) {
	const aspectRatio = useVideoSetting("aspectRatio");
	const { width, height } = ASPECT_RATIO_DIMENSIONS[aspectRatio].output;
	if (!result?.slide) return <MediaPlaceholder {...state} />;
	return (
		<div className="group relative w-full overflow-hidden rounded-lg border border-border">
			<Player
				key={JSON.stringify(result.slide)}
				component={HtmlSlide}
				inputProps={{ slide: result.slide }}
				durationInFrames={Math.max(
					1,
					Math.round(result.durationSec * DEFAULT_FPS),
				)}
				fps={DEFAULT_FPS}
				compositionWidth={width}
				compositionHeight={height}
				controls
				style={{ width: "100%" }}
			/>
			{state.error && <ErrorMessage message={state.error} />}
			<ResultOverlay status={state.status} startedAt={state.startedAt} />
			<PreviewChrome topRight={state.topRight} />
		</div>
	);
}
