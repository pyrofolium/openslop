import type { Slide } from "./schema";

export const MOCK_SLIDE: Slide = {
	version: 1,
	html: '<main><p>LOCAL PREVIEW</p><h1>Ideas in motion</h1><div class="track"><div id="bar"></div></div><strong id="count">0%</strong><footer>Mock slide · No AI credits used</footer></main>',
	css: "html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#171526;color:#faf7f2;font-family:Arial,sans-serif}main{box-sizing:border-box;height:100%;padding:10vmin;display:flex;flex-direction:column;justify-content:center;gap:3vmin}p{font-size:2.5vmin;letter-spacing:.2em;color:#bcb0ff;margin:0}h1{font-size:9vmin;margin:0;line-height:1.05}.track{height:3vmin;background:#373149;border-radius:2vmin;overflow:hidden}#bar{height:100%;width:100%;background:#bcb0ff;transform-origin:left;transform:scaleX(0)}strong{font-size:6vmin}footer{font-size:2.5vmin;color:#b7b1c3}",
	js: 'window.renderAt = (time) => { const progress = Math.min(1, Math.max(0, time / 3)); document.querySelector("#bar").style.transform = `scaleX(${progress})`; document.querySelector("#count").textContent = `${Math.round(progress * 100)}%`; };',
};
