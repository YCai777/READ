(() => {
  const body = document.body;
  const intro = document.getElementById("intro");
  const container = document.getElementById("lottieIntro");

  if (!body || !intro || !container || !window.lottie) {
    body?.classList.remove("intro-active");
    return;
  }

  let totalFrames = 1;
  let currentProgress = 0;
  let targetProgress = 0;
  let rafId = 0;
  let lastTime = performance.now();
  let isDone = false;
  let autoMode = true;
  let isAnimationReady = false;

  const AUTO_DURATION_MS = 5200;
  const EASING = 0.15;
  const WHEEL_FACTOR = 0.00075;
  const NARROW_SCREEN_WIDTH = 900;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isPortraitNarrowScreen =
    window.innerWidth <= NARROW_SCREEN_WIDTH &&
    window.innerHeight > window.innerWidth;
  const animationPath =
    isPortraitNarrowScreen ? "move/short.json" : "move/wide.json";

  function startIntroSession() {
    if (!isAnimationReady) return;
    cancelAnimationFrame(rafId);

    isDone = false;
    autoMode = true;
    currentProgress = 0;
    targetProgress = 0;
    lastTime = performance.now();

    body.classList.add("intro-active");
    intro.classList.remove("intro--done");
    animation.goToAndStop(0, true);
    rafId = requestAnimationFrame(tick);
  }

  function completeIntro() {
    if (isDone) return;
    isDone = true;
    autoMode = false;
    cancelAnimationFrame(rafId);

    intro.classList.add("intro--done");
    body.classList.remove("intro-active");
  }

  function tick(now) {
    const dt = Math.min(64, now - lastTime);
    lastTime = now;

    if (!isDone && autoMode) {
      targetProgress = clamp(targetProgress + dt / AUTO_DURATION_MS, 0, 1);
    }

    currentProgress += (targetProgress - currentProgress) * EASING;
    currentProgress = clamp(currentProgress, 0, 1);

    animation.goToAndStop(currentProgress * totalFrames, true);

    if (!isDone && currentProgress >= 0.995) {
      completeIntro();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  const animation = window.lottie.loadAnimation({
    container,
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: animationPath,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid meet",
      progressiveLoad: true,
    },
  });

  animation.addEventListener("DOMLoaded", () => {
    isAnimationReady = true;
    totalFrames = Math.max(1, animation.getDuration(true) - 1);
    startIntroSession();
  });

  animation.addEventListener("data_failed", () => {
    completeIntro();
  });

  intro.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (isDone) return;

      autoMode = false;
      targetProgress = clamp(targetProgress + event.deltaY * WHEEL_FACTOR, 0, 1);

      if (targetProgress >= 1) {
        completeIntro();
      }
    },
    { passive: false }
  );

  // Fallback: avoid getting stuck on intro if anything blocks loading.
  setTimeout(() => {
    if (!isDone && totalFrames <= 1) {
      completeIntro();
    }
  }, 7000);
})();

(() => {
  const textDisplay = document.getElementById("text-display");
  const SadnessAnimation = window.SadnessAnimation;

  if (!textDisplay) return;

  const blocks = textDisplay.querySelectorAll("[data-text]");

  blocks.forEach((block) => {
    const text = block.getAttribute("data-text") || "";
    block.textContent = "";

    for (const character of text) {
      const span = document.createElement("span");
      span.className = "text-char";
      span.textContent = character === " " ? "\u00A0" : character;
      block.appendChild(span);
    }
  });

  if (typeof SadnessAnimation !== "function") return;

  const sadness = new SadnessAnimation();

  const triggerSadness = (event) => {
    sadness.trigger(textDisplay, 0, event.clientX, event.clientY);
  };

  textDisplay.addEventListener("pointermove", triggerSadness, { passive: true });
  textDisplay.addEventListener("pointerenter", triggerSadness, { passive: true });
})();
