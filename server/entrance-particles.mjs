// Both title lines move from opposing sides using video playback as their clock.
export function mountEntranceTitle(screen, video) {
  const film=screen.querySelector('.entrance-film');
  const title=screen.querySelector('.entrance-title');
  if(!film||!title) return () => {};
  const lines=Array.from(title.children);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let width=film.getBoundingClientRect().width;
  let frame=0;
  let stopped=false;

  function draw() {
    if(stopped) return;
    const time=video.currentTime||0;
    for(const [index,line] of lines.entries()) {
      const progress=reduced.matches?1:Math.min(1,Math.max(0,(time-.18-index*.38)/1.22));
      const eased=1-Math.pow(1-progress,3);
      const side=line.dataset.origin==='left'?-1:1;
      line.style.transform='translate3d('+(side*width*1.1*(1-eased))+'px,0,0)';
      line.style.opacity=String(Math.min(1,progress*3));
    }
  }
  function tick() {
    draw();
    if(!stopped&&!video.paused&&!video.ended) frame=requestAnimationFrame(tick);
  }
  function play() {
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(tick);
  }
  function pause() {
    cancelAnimationFrame(frame);
    draw();
  }
  const observer=new ResizeObserver(entries=>{
    width=entries[0].contentRect.width;
    draw();
  });
  observer.observe(film);
  video.addEventListener('playing',play);
  video.addEventListener('pause',pause);
  video.addEventListener('timeupdate',draw);
  video.addEventListener('seeked',draw);
  video.addEventListener('loadedmetadata',draw);
  reduced.addEventListener('change',draw);
  draw();
  return () => {
    stopped=true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    video.removeEventListener('playing',play);
    video.removeEventListener('pause',pause);
    video.removeEventListener('timeupdate',draw);
    video.removeEventListener('seeked',draw);
    video.removeEventListener('loadedmetadata',draw);
    reduced.removeEventListener('change',draw);
  };
}
