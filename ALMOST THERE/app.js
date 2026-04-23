const baseWeight = 1;
const panels = [...document.querySelectorAll(".panel")];
const layout = document.querySelector(".layout");

const items = panels.map((panel) => ({
  panel,
  trigger: panel.querySelector(".title-trigger"),
  weight: baseWeight,
  velocity: 0,
}));

const boosts = {
  hover: { amount: 0.8, duration: 2000 },
  focus: { amount: 2.0, duration: 4000 },
};

const spring = {
  stiffness: 18,
  damping: 9,
};

let focusedIndex = null;

function addBoost(item, amount, duration) {
  item.velocity += (amount * 2) / (duration / 1000);
}

function syncState() {
  let highestIndex = 0;

  for (let index = 1; index < items.length; index += 1) {
    if (items[index].weight > items[highestIndex].weight) highestIndex = index;
  }

  layout.classList.toggle("has-focus", focusedIndex !== null);

  items.forEach((item, index) => {
    const isFocused = index === focusedIndex;
    const isActive = focusedIndex === null ? index === highestIndex : isFocused;
    item.panel.classList.toggle("focused", isFocused);
    item.panel.classList.toggle("active", isActive);
  });
}

function updateTracks() {
  const weights = items.map((item, index) => {
    const focusBias = focusedIndex === null ? 0 : index === focusedIndex ? 2.2 : -0.35;
    return Math.max(0.65, item.weight + focusBias);
  });

  const [a, b, c] = weights;
  layout.style.setProperty("--col-a", `${(a + c) / 2}fr`);
  layout.style.setProperty("--col-b", `${(a + c) / 2}fr`);
  layout.style.setProperty("--col-c", `${b}fr`);
  layout.style.setProperty("--row-a", `${a}fr`);
  layout.style.setProperty("--row-b", `${c}fr`);
}

let previousTime = performance.now();

function tick(now) {
  const dt = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;

  items.forEach((item) => {
    const displacement = item.weight - baseWeight;
    const acceleration = -spring.stiffness * displacement - spring.damping * item.velocity;
    item.velocity += acceleration * dt;
    item.weight += item.velocity * dt;

    if (Math.abs(item.weight - baseWeight) < 0.0005 && Math.abs(item.velocity) < 0.0005) {
      item.weight = baseWeight;
      item.velocity = 0;
    }

    if (item.weight < baseWeight) item.weight = baseWeight;
  });

  syncState();
  updateTracks();
  requestAnimationFrame(tick);
}

items.forEach((item, index) => {
  item.panel.addEventListener("mouseenter", () => addBoost(item, boosts.hover.amount, boosts.hover.duration));

  item.trigger.addEventListener("mouseenter", () => {
    focusedIndex = index;
    addBoost(item, boosts.focus.amount, boosts.focus.duration);
    syncState();
    updateTracks();
  });

  item.trigger.addEventListener("mouseleave", () => {
    if (focusedIndex === index) {
      focusedIndex = null;
      syncState();
      updateTracks();
    }
  });
});

syncState();
updateTracks();
requestAnimationFrame(tick);
