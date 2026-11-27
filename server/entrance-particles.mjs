// The title is drawn over the film using its playback position as the clock.
export function mountEntranceTitle(screen, video) {
  const film = screen.querySelector('.entrance-film');
  const canvas = screen.querySelector('.entrance-particles');
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  film.classList.add('particles-ready');

  const mask = document.createElement('canvas');
  const ink = mask.getContext('2d', {willReadFrequently: true});
  let particles = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let stopped = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function build() {
    const rect = film.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = Math.round(rect.width);
    height = Math.round(rect.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    mask.width = width;
    mask.height = height;
    const centerX = width * 0.76;
    const available = width * 0.40;
    let size = Math.min(width * 0.041, height * 0.11);
    ink.textAlign = 'center';
    ink.textBaseline = 'middle';
    ink.direction = 'rtl';
    ink.font = '800 ' + size + 'px Heebo, Arial, sans-serif';
    const measured = Math.max(ink.measureText('אטלס המחקר').width, ink.measureText('Research Atlas').width);
    if (measured > available) size *= available / measured;
    ink.font = '800 ' + size + 'px Heebo, Arial, sans-serif';
    ink.fillStyle = '#fff';
    ink.fillText('אטלס המחקר', centerX, height * 0.45);
    ink.direction = 'ltr';
    ink.fillText('Research Atlas', centerX, height * 0.56);

    const data = ink.getImageData(0, 0, width, height).data;
    const spacing = Math.max(2, Math.round(width / 450));
    particles = [];
    for (let y = 0; y < height; y += spacing) {
      for (let x = Math.floor(width * 0.54); x < width; x += spacing) {
        if (data[(y * width + x) * 4 + 3] > 120) {
          const seed = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
          particles.push({x, y, seed: Math.abs(seed)});
        }
      }
    }
    draw();
  }

  function draw() {
    if (stopped || !width || !height) return;
    const time = video.currentTime || 0;
    const duration = Number.isFinite(video.duration) ? video.duration : 6;
    const enter = reduced.matches ? 1 : Math.min(1, Math.max(0, (time - 0.3) / 1.2));
    const exit = reduced.matches ? 1 : Math.min(1, Math.max(0, (duration - time) / 0.8));
    const opacity = enter * exit;
    context.clearRect(0, 0, width, height);
    if (!opacity) return;

    const wash = context.createRadialGradient(width * .77, height * .51, 0, width * .77, height * .51, width * .29);
    wash.addColorStop(0, 'rgba(7,18,33,.55)');
    wash.addColorStop(1, 'rgba(7,18,33,0)');
    context.fillStyle = wash;
    context.globalAlpha = opacity;
    context.fillRect(width * .48, 0, width * .52, height);

    const beamX = width * (.57 + .37 * Math.min(1, time / Math.max(1, duration)));
    context.save();
    context.globalAlpha = .28 * opacity;
    context.shadowColor = '#6bd8ff';
    context.shadowBlur = Math.max(3, width * .012);
    context.drawImage(mask, 0, 0);
    context.restore();

    context.globalCompositeOperation = 'lighter';
    for (const point of particles) {
      const distance = Math.abs(point.x - beamX) / (width * .18);
      const shine = Math.max(0, 1 - distance);
      const drift = (1 - enter) * (point.seed - .5) * width * .09;
      const flicker = reduced.matches ? 1 : .72 + .28 * Math.sin(time * 3 + point.seed * 20);
      context.globalAlpha = opacity * Math.min(1, (.35 + shine * .65) * flicker);
      context.fillStyle = shine > .55 ? '#e2f8ff' : point.seed > .55 ? '#4cc9ff' : '#5a7dff';
      const radius = Math.max(.65, width * .0012) * (.7 + point.seed * .6);
      context.beginPath();
      context.arc(point.x + drift, point.y + drift * .35, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
  }

  function tick() {
    draw();
    if (!video.paused && !video.ended && !stopped) frame = requestAnimationFrame(tick);
  }
  function play() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }
  function pause() {
    cancelAnimationFrame(frame);
    draw();
  }
  const observer = new ResizeObserver(build);
  observer.observe(film);
  video.addEventListener('playing', play);
  video.addEventListener('pause', pause);
  video.addEventListener('seeked', draw);
  video.addEventListener('loadedmetadata', draw);
  reduced.addEventListener('change', draw);
  build();
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    video.removeEventListener('playing', play);
    video.removeEventListener('pause', pause);
    video.removeEventListener('seeked', draw);
    video.removeEventListener('loadedmetadata', draw);
    reduced.removeEventListener('change', draw);
  };
}
