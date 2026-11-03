export const SLIDE_INSTRUCTION = "Create an animated HTML slide.";

export const SLIDE_SYSTEM_PROMPT = `${SLIDE_INSTRUCTION}
Return only JSON: {"version":1,"html":"...","css":"...","js":"..."}.
HTML is a body fragment, CSS is a stylesheet, JS defines window.renderAt = (timeInSeconds) => { ... }.
Create the requested design freely with HTML, CSS, SVG and JavaScript. Do not use templates or preset names.
The slide fills its viewport. Use responsive layout and viewport units so it works in landscape, portrait and square videos.
Use legible text and accurate supplied data. Never invent factual chart values.
The host controls time. renderAt must synchronously draw the exact requested moment, independently of previous calls, including backward seeks.
CSS/Web Animations are paused and seeked by the host. Do not use timers, requestAnimationFrame loops, Date, randomness, network requests, external libraries, fonts, scripts, images or media.
Use inline SVG and CSS for illustrations. No links, forms, popups, frames, navigation, storage or parent-window access.
Do not include script or style tags in HTML. Keep JS separate. Do not throw for frames after the nominal duration; hold the final design.`;
