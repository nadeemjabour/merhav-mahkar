export function entranceMarkup(mark, localized) {
  return `<section id="entrance" aria-labelledby="entrance-name">
  <div class="entrance-bar"><div class="brand" id="entrance-name">${mark}${localized('brand')}</div><button type="button" data-skip>${localized('skipFilm')}</button></div>
  <div class="entrance-stage"><svg width="0" height="0" class="entrance-grade" aria-hidden="true"><defs><filter id="entrance-palette" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="table" tableValues=".125 .259 .443 .667 .890 .965 1"/><feFuncG type="table" tableValues=".173 .329 .522 .749 .584 .694 .945"/><feFuncB type="table" tableValues=".259 .447 .659 .855 .686 .808 .969"/></feComponentTransfer></filter></defs></svg>
    <div class="entrance-film"><video playsinline preload="none" data-src="/media/research-space-loop.mp4" data-storage="https://qzqclvzvddudbkdqoihg.supabase.co/storage/v1/object/public/videos/hero/research-space-loop.mp4" poster="/media/research-space-poster.webp" aria-hidden="true"></video><div class="entrance-title" aria-label="אטלס המחקר, Research Atlas"><span dir="rtl" data-origin="right">אטלס המחקר</span><span dir="ltr" data-origin="left">Research Atlas</span></div></div>
  </div>
  <div class="entrance-console"><div class="entrance-progress" aria-hidden="true"><i></i></div><div class="entrance-controls">
    <button type="button" data-play><span class="play-icon" aria-hidden="true"></span><span class="when-paused"><span class="when-new">${localized('playFilm')}</span><span class="when-started">${localized('resumeFilm')}</span></span><span class="when-playing">${localized('pauseFilm')}</span></button>
    <button type="button" data-sound><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z"/><path class="when-audible" d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path class="when-muted" d="m16 9 5 6m0-6-5 6"/></svg><span class="when-audible">${localized('muteFilm')}</span><span class="when-muted">${localized('unmuteFilm')}</span></button>
  </div></div>
</section>`;
}

export function startEntrance() {
  const screen = document.querySelector('#entrance');
  if (!screen) return;
  const video = screen.querySelector('video');
  const play = screen.querySelector('[data-play]');
  const sound = screen.querySelector('[data-sound]');
  const skip = screen.querySelector('[data-skip]');
  const progress = screen.querySelector('.entrance-progress i');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stopTitle = mountEntranceTitle(screen, video);
  let closed = false;
  let playerTimer;
  let attempt = 0;
  let useStorage = !['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  function finish() {
    if (closed) return;
    closed = true;
    clearTimeout(playerTimer);
    stopTitle();
    video.pause();
    video.removeAttribute('src');
    video.load();
    screen.remove();
    delete document.documentElement.dataset.entrance;
    const heading = document.querySelector('.paper h1');
    heading.tabIndex = -1;
    heading.focus({preventScroll:true});
  }
  function recover() {
    if (closed) return;
    if (!useStorage) return finish();
    useStorage = false;
    video.src = video.dataset.src;
    playClip();
  }
  function waitForMedia() {
    clearTimeout(playerTimer);
    playerTimer = setTimeout(recover,useStorage ? 4500 : 15000);
  }
  function playClip() {
    if (closed) return;
    const current = ++attempt;
    if(!screen.dataset.started) { video.defaultMuted=false; video.muted=false; video.volume=1; }
    if (!video.hasAttribute('src')) video.src = useStorage ? video.dataset.storage : video.dataset.src;
    waitForMedia();
    video.play().catch(error => {
      if (closed || current !== attempt) return;
      if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
        clearTimeout(playerTimer);
        if(error.name === 'NotAllowedError') screen.dataset.needsStart='true';
      }
      else recover();
    });
  }
  video.defaultMuted=false;
  video.muted=false;
  video.volume=1;
  screen.dataset.muted='false';
  sound.title=sound.querySelector('span.when-audible').textContent;
  skip.addEventListener('click',finish);
  play.addEventListener('click',() => video.paused ? playClip() : video.pause());
  sound.addEventListener('click',() => {
    const muted=video.muted||video.volume===0;
    video.muted=!muted;
    if(muted) { video.volume=1; if(video.paused) playClip(); }
  });
  video.addEventListener('volumechange',() => { const muted=video.muted||video.volume===0; screen.dataset.muted=String(muted);
    sound.title = sound.querySelector(muted ? 'span.when-muted' : 'span.when-audible').textContent; });
  video.addEventListener('playing',() => {
    clearTimeout(playerTimer);
    screen.dataset.started = 'true';
    screen.dataset.needsStart='false';
    screen.dataset.playing = 'true';
  });
  video.addEventListener('pause',() => {
    clearTimeout(playerTimer);
    screen.dataset.playing = 'false';
  });
  video.addEventListener('timeupdate',() => {
    if (video.duration > 0) progress.style.transform = 'scaleX('+Math.min(1,video.currentTime/video.duration)+')';
  });
  video.addEventListener('ended',finish,{once:true});
  video.addEventListener('waiting',() => { if (!video.paused) waitForMedia(); });
  video.addEventListener('error',() => { if (video.error) recover(); });
  screen.addEventListener('keydown',event=>{ if(event.key==='Escape')finish(); });
  if (!reduced.matches) playClip();
  else screen.dataset.needsStart='true';
}
