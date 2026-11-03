import type { Slide } from "./schema";

const policy =
	"default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data:; font-src data:; frame-src blob:; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'";
const json = (value: unknown) =>
	JSON.stringify(value).replaceAll("<", "\\u003c");
const style =
	"html,body{margin:0;width:100%;height:100%;overflow:hidden}iframe{border:0;width:100%;height:100%;display:block}";

export function slideDocument(slide: Slide): string {
	const inner = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><style>${style}</style></head><body><script>
const slide = ${json(slide)};
const reply = (message) => parent.postMessage(message, '*');
let failure;
try {
  document.body.insertAdjacentHTML('afterbegin', slide.html);
  const style = document.createElement('style');
  style.textContent = slide.css;
  document.head.append(style);
  new Function(slide.js)();
  if (typeof window.renderAt !== 'function') throw new Error('Slide JavaScript must define window.renderAt(timeInSeconds).');
} catch (error) { failure = String(error); }
window.addEventListener('error', event => { failure = event.message; });
window.addEventListener('message', async event => {
  if (event.source !== parent || event.data?.type !== 'slide-frame') return;
  const { id, time } = event.data;
  try {
    if (failure) throw new Error(failure);
    if (!Number.isFinite(time) || time < 0) throw new Error('Invalid slide time.');
    window.renderAt(time);
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = time * 1000;
    }
    await document.fonts.ready;
    // Browsers suspend animation frames in offscreen card previews.
    const painted = () => reply({type:'slide-rendered', id});
    const timer = setTimeout(painted, 100);
    requestAnimationFrame(() => { clearTimeout(timer); painted(); });
  } catch (error) { reply({type:'slide-error', id, error:String(error)}); }
});
reply({type:'slide-ready'});
</script></body></html>`;
	// The trusted outer frame's CSP also blocks navigation of the untrusted child to network URLs.
	return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><style>${style}</style></head><body><script>
const child = document.createElement('iframe');
child.title = 'Slide content';
child.sandbox = 'allow-scripts';
child.referrerPolicy = 'no-referrer';
let loads = 0;
let requestId;
child.addEventListener('load', () => {
  if (++loads > 1) parent.postMessage({type:'slide-error', id:requestId, error:'Slide navigation is blocked.'}, '*');
});
window.addEventListener('message', event => {
  if (event.source === parent && event.data?.type === 'slide-frame') {
    requestId = event.data.id;
    child.contentWindow.postMessage(event.data, '*');
  } else if (event.source === child.contentWindow && ['slide-ready','slide-rendered','slide-error'].includes(event.data?.type)) {
    parent.postMessage(event.data, '*');
  }
});
child.src = URL.createObjectURL(new Blob([${json(inner)}], {type:'text/html'}));
document.body.append(child);
</script></body></html>`;
}
