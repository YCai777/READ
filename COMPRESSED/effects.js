const WORD_SHIFT_CLASSES = [
  "glitch-word--script",
  "glitch-word--grotesk",
  "glitch-word--typewriter",
];
const SUBTITLE_SHIFT_CLASSES = [
  "glitch-word--grotesk",
  "glitch-word--typewriter",
  "glitch-word--grotesk",
  "glitch-word--typewriter",
  "glitch-word--script",
];

const GLITCH_GLYPHS = `013456789%#$&?!@+=*/\\\\|<>{}[]\u00A5\u20AC\u25A0`;

function randomFrom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function replacementFor(char) {
  if (!/[A-Za-z]/.test(char)) {
    return char;
  }

  return randomFrom(GLITCH_GLYPHS);
}

function wrapParagraphText(paragraph) {
  const originalText = paragraph.textContent || "";
  const tokens = originalText.split(/(\s+)/);
  const fragment = document.createDocumentFragment();

  tokens.forEach((token) => {
    if (!token) {
      return;
    }

    if (/^\s+$/.test(token)) {
      fragment.appendChild(document.createTextNode(token));
      return;
    }

    const word = document.createElement("span");
    word.className = "glitch-word";
    word.dataset.original = token;

    for (const char of token) {
      const charSpan = document.createElement("span");
      charSpan.className = "glitch-char";
      charSpan.dataset.original = char;
      charSpan.textContent = char;
      word.appendChild(charSpan);
    }

    fragment.appendChild(word);
  });

  paragraph.textContent = "";
  paragraph.appendChild(fragment);
}

function wrapContinuousWord(element) {
  const originalText = (element.textContent || "").trim();
  if (!originalText) {
    return null;
  }

  const word = document.createElement("span");
  word.className = "glitch-word glitch-word--subtitle";
  word.dataset.original = originalText;
  const anchorIndex = Math.floor(originalText.length / 2);

  for (const [index, char] of Array.from(originalText).entries()) {
    const charSpan = document.createElement("span");
    charSpan.className = "glitch-char glitch-char--subtitle";
    charSpan.dataset.original = char;
    charSpan.textContent = char;
    if (index === anchorIndex) {
      charSpan.dataset.anchor = "true";
    }
    word.appendChild(charSpan);
  }

  element.textContent = "";
  element.appendChild(word);
  return word;
}

function pickRandomItem(items, predicate = () => true) {
  const pool = items.filter(predicate);
  if (pool.length === 0) {
    return null;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function flickerCharacters(chars, options = {}) {
  const {
    minCount = 1,
    maxCount = 3,
    stepDelay = 40,
    durationMin = 320,
    durationRange = 180,
  } = options;

  const available = chars.filter(
    (char) => /[A-Za-z]/.test(char.dataset.original || "") && !char.dataset.busy,
  );

  if (available.length === 0) {
    return;
  }

  const count = Math.min(
    available.length,
    minCount + Math.floor(Math.random() * Math.max(1, maxCount - minCount + 1)),
  );
  const selection = shuffle(available).slice(0, count);

  selection.forEach((char, index) => {
    char.dataset.busy = "true";

    window.setTimeout(() => {
      char.classList.add("glitch-char--active");
      char.textContent = replacementFor(char.dataset.original || char.textContent);
    }, index * stepDelay);

    window.setTimeout(() => {
      char.textContent = char.dataset.original || char.textContent;
      char.classList.remove("glitch-char--active");
      delete char.dataset.busy;
    }, durationMin + Math.floor(Math.random() * durationRange) + index * stepDelay);
  });
}

function shiftWordFont(word, options = {}) {
  const {
    durationMin = 900,
    durationRange = 380,
    classPool = WORD_SHIFT_CLASSES,
  } = options;

  if (!word || word.dataset.fontBusy) {
    return;
  }

  const className = randomFrom(classPool);
  word.dataset.fontBusy = "true";
  word.classList.add(className);

  window.setTimeout(() => {
    word.classList.remove(className);
    delete word.dataset.fontBusy;
  }, durationMin + Math.floor(Math.random() * durationRange));
}

function scheduleEssayJitter(words) {
  const runCharacterLoop = () => {
    const word = pickRandomItem(
      words,
      (item) => /[A-Za-z]/.test(item.dataset.original || ""),
    );

    if (word) {
      flickerCharacters(Array.from(word.querySelectorAll(".glitch-char")), {
        minCount: 1,
        maxCount: 3,
        stepDelay: 40,
        durationMin: 320,
        durationRange: 180,
      });
    }

    window.setTimeout(runCharacterLoop, 280 + Math.random() * 613);
  };

  const runWordLoop = () => {
    const word = pickRandomItem(
      words,
      (item) => (item.dataset.original || "").replace(/[^A-Za-z]/g, "").length >= 4,
    );

    shiftWordFont(word, {
      durationMin: 900,
      durationRange: 380,
    });

    window.setTimeout(runWordLoop, 600 + Math.random() * 1000);
  };

  window.setTimeout(runCharacterLoop, 213);
  window.setTimeout(runWordLoop, 507);
}

function scheduleSubtitleJitter(word) {
  const chars = Array.from(word.querySelectorAll(".glitch-char"));

  const runCharacterLoop = () => {
    flickerCharacters(
      chars.filter((char) => char.dataset.anchor !== "true"),
      {
      minCount: 2,
      maxCount: 5,
      stepDelay: 20,
      durationMin: 360,
      durationRange: 220,
      },
    );

    window.setTimeout(runCharacterLoop, 120 + Math.random() * 120);
  };

  const runWordLoop = () => {
    shiftWordFont(word, {
      durationMin: 520,
      durationRange: 220,
      classPool: SUBTITLE_SHIFT_CLASSES,
    });

    window.setTimeout(runWordLoop, 300 + Math.random() * 260);
  };

  window.setTimeout(runCharacterLoop, 60);
  window.setTimeout(runWordLoop, 140);
}

function initTextEffects() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const paragraphs = Array.from(document.querySelectorAll(".body-text"));
  paragraphs.forEach(wrapParagraphText);

  const words = Array.from(document.querySelectorAll(".essay .glitch-word"));
  if (words.length > 0) {
    scheduleEssayJitter(words);
  }

  const subtitle = document.querySelector("#glitch-subtitle");
  if (subtitle) {
    const wrappedSubtitle = wrapContinuousWord(subtitle);
    if (wrappedSubtitle) {
      scheduleSubtitleJitter(wrappedSubtitle);
    }
  }
}

document.addEventListener("DOMContentLoaded", initTextEffects);
