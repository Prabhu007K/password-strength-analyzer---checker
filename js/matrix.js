/** Matrix-style falling green numbers (background). */
(() => {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const DIGITS = '0123456789';
  const FONT_SIZE = 16;
  const columns = [];
  let rafId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.ceil(canvas.width / FONT_SIZE);
    columns.length = count;
    for (let i = 0; i < count; i++) {
      columns[i] = columns[i] ?? Math.random() * canvas.height / FONT_SIZE;
    }
  }

  function draw() {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`;

    for (let i = 0; i < columns.length; i++) {
      const x = i * FONT_SIZE;
      const y = columns[i] * FONT_SIZE;
      const digit = DIGITS[Math.floor(Math.random() * DIGITS.length)];

      ctx.fillStyle = y > canvas.height * 0.15
        ? `rgba(34, 197, 94, ${0.35 + Math.random() * 0.45})`
        : '#4ade80';
      ctx.fillText(digit, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        columns[i] = 0;
      } else {
        columns[i] += 0.4 + Math.random() * 0.6;
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      draw();
    }
  });
})();
