let state = {
  text: "",
  speed: 2.2,
  fontSize: 54,
  fontFamily: "systemSans",
  lineHeight: 1.35,
  columnWidth: 78,
  verticalPosition: 0,
  countdownSeconds: 0,
  operatorMode: "rehearsal",
  followCursor: false,
  currentWordHighlight: false,
  mirror: false,
  guide: true,
  lightTheme: false
};

let scrollY = 0;
let isPlaying = false;
let isCountingDown = false;
let isStandby = false;
let lastFrameTime = 0;
let lastParagraphJump = null;
let countdownEndTime = 0;
let readableWordCount = 0;
let localSpeedOffset = 0;

const content = document.querySelector("#content");
const countdownOverlay = document.querySelector("#countdownOverlay");
const cueOverlay = document.querySelector("#cueOverlay");
const soloControls = document.querySelector("#soloControls");
const soloReset = document.querySelector("#soloReset");
const soloBack = document.querySelector("#soloBack");
const soloPlay = document.querySelector("#soloPlay");
const soloForward = document.querySelector("#soloForward");
const soloSlower = document.querySelector("#soloSlower");
const soloSpeed = document.querySelector("#soloSpeed");
const soloFaster = document.querySelector("#soloFaster");

window.teleprompter.onState((nextState) => {
  const previousText = state.text;
  state = { ...state, ...nextState };
  applyState({ textChanged: previousText !== state.text });
});

window.teleprompter.onCommand((command) => {
  const commandType = typeof command === "object" ? command.type : command;

  if (commandType === "play") {
    startPlayback();
  }
  if (commandType === "countdownPlay") {
    startCountdownOrPlayback();
  }
  if (commandType === "pause") {
    stopPlayback();
  }
  if (commandType === "standbyToggle") {
    toggleStandby();
  }
  if (commandType === "reset") {
    stopCountdown();
    scrollY = 0;
    lastParagraphJump = null;
  }
  if (commandType === "backward") {
    jumpParagraph(-1);
  }
  if (commandType === "forward") {
    jumpParagraph(1);
  }
  if (commandType === "middle") {
    stopCountdown();
    jumpToNearestParagraph(getMaxScroll() * 0.5);
    lastParagraphJump = null;
  }
  if (commandType === "end") {
    stopCountdown();
    scrollY = getMaxScroll();
    lastParagraphJump = null;
  }
  if (commandType === "section") {
    stopCountdown();
    jumpToSection(Number(command.index));
    lastParagraphJump = null;
  }
  if (commandType === "cursor") {
    jumpToTextIndex(Number(command.index));
    lastParagraphJump = null;
  }
  renderScroll();
  sendRuntime();
});

window.teleprompter.onDisplayMode((mode) => {
  const singleDisplay = Boolean(mode?.singleDisplay);
  document.body.classList.toggle("single-display", singleDisplay);

  if (soloControls) {
    soloControls.hidden = !singleDisplay;
  }
});

soloReset?.addEventListener("click", () => {
  stopCountdown();
  scrollY = 0;
  lastParagraphJump = null;
  renderScroll();
  sendRuntime();
});

soloBack?.addEventListener("click", () => {
  jumpParagraph(-1);
  renderScroll();
  sendRuntime();
});

soloPlay?.addEventListener("click", () => {
  if (isPlaying || isCountingDown) {
    stopPlayback();
  } else {
    startPlayback();
  }

  renderSoloControls();
  sendRuntime();
});

soloForward?.addEventListener("click", () => {
  jumpParagraph(1);
  renderScroll();
  sendRuntime();
});

soloSlower?.addEventListener("click", () => {
  changeLocalSpeed(-0.2);
});

soloFaster?.addEventListener("click", () => {
  changeLocalSpeed(0.2);
});

requestAnimationFrame(tick);

function applyState({ textChanged } = {}) {
  if (textChanged) {
    renderText(state.text || "");
  }
  document.documentElement.style.setProperty("--font-size", `${state.fontSize}px`);
  document.documentElement.style.setProperty("--font-family", getFontStack(state.fontFamily));
  document.documentElement.style.setProperty("--line-height", state.lineHeight);
  document.documentElement.style.setProperty("--column-width", `${state.columnWidth}vw`);
  document.documentElement.style.setProperty("--top-padding", `${getTopPadding(state.verticalPosition)}vh`);
  document.body.classList.toggle("mirror", Boolean(state.mirror));
  document.body.classList.toggle("guide", Boolean(state.guide));
  document.body.classList.toggle("light", Boolean(state.lightTheme));
  document.body.classList.toggle("standby", isStandby);
  renderSoloControls();

  requestAnimationFrame(() => {
    scrollY = Math.min(scrollY, getMaxScroll());
    renderScroll();
    sendRuntime();
  });
}

function tick(now) {
  if (isCountingDown) {
    updateCountdown(now);
  }

  if (isPlaying) {
    const deltaSeconds = Math.max(0, (now - lastFrameTime) / 1000);
    scrollY = Math.min(getMaxScroll(), scrollY + getPixelSpeed() * deltaSeconds);
    if (scrollY >= getMaxScroll()) {
      isPlaying = false;
    }
    renderScroll();
    sendRuntime();
  }

  lastFrameTime = now;
  requestAnimationFrame(tick);
}

function renderScroll() {
  content.style.setProperty("--scroll-y", scrollY.toFixed(2));
  renderActiveCue();
}

function getMaxScroll() {
  return Math.max(0, content.scrollHeight - window.innerHeight * 0.48);
}

function sendRuntime() {
  const maxScroll = getMaxScroll();
  const totalSeconds = getTotalPlaybackSeconds();
  const progress = maxScroll === 0 ? 0 : scrollY / maxScroll;
  const cueStatus = getCueStatus();
  const activeLine = getActiveLineInfo();
  window.teleprompter.sendRuntime({
    isPlaying,
    isCountingDown,
    isStandby,
    cueNow: cueStatus.current,
    cueNext: cueStatus.next,
    countdownRemaining: getCountdownRemainingSeconds(),
    scrollY,
    progress,
    totalSeconds,
    remainingSeconds: Math.max(0, totalSeconds * (1 - progress)),
    elapsedSeconds: totalSeconds * progress,
    currentLineStartIndex: activeLine.startIndex,
    currentLineEndIndex: activeLine.endIndex,
    currentLineText: activeLine.text
  });
  renderSoloControls();
}

function startCountdownOrPlayback() {
  const seconds = Number(state.countdownSeconds) || 0;
  isStandby = false;
  document.body.classList.remove("standby");

  if (seconds > 0) {
    isPlaying = false;
    isCountingDown = true;
    countdownEndTime = performance.now() + seconds * 1000;
    updateCountdown();
    return;
  }

  startPlayback();
}

function startPlayback(now = performance.now()) {
  isStandby = false;
  document.body.classList.remove("standby");
  stopCountdown();
  isPlaying = true;
  lastFrameTime = now;
  renderSoloControls();
}

function stopPlayback() {
  isPlaying = false;
  stopCountdown();
  renderSoloControls();
}

function stopCountdown() {
  isCountingDown = false;
  countdownEndTime = 0;
  countdownOverlay.textContent = "";
  countdownOverlay.classList.remove("visible");
  renderSoloControls();
}

function toggleStandby() {
  isStandby = !isStandby;

  if (isStandby) {
    isPlaying = false;
    stopCountdown();
  }

  document.body.classList.toggle("standby", isStandby);
}

function updateCountdown(now = performance.now()) {
  const remaining = getCountdownRemainingSeconds(now);

  if (remaining <= 0) {
    startPlayback(now);
    sendRuntime();
    return;
  }

  countdownOverlay.textContent = remaining;
  countdownOverlay.classList.add("visible");
  sendRuntime();
}

function getCountdownRemainingSeconds(now = performance.now()) {
  if (!isCountingDown || countdownEndTime <= 0) {
    return 0;
  }

  return Math.max(0, Math.ceil((countdownEndTime - now) / 1000));
}

function renderText(text) {
  const fragment = document.createDocumentFragment();
  const paragraphs = getPromptBlocks(text);
  const safeParagraphs = paragraphs.length > 0 ? paragraphs : [""];
  const wordContext = { count: 0 };
  let sectionIndex = 0;

  safeParagraphs.forEach((paragraph) => {
    const textValue = typeof paragraph === "string" ? paragraph : paragraph.text;
    const section = parseSectionParagraph(textValue);
    const block = document.createElement("p");
    block.className = section ? "paragraph section-heading" : "paragraph";
    renderInlineText(block, section ? section.text : textValue, paragraph.cues || [], wordContext);
    block.dataset.sourceStart = String(paragraph.start || 0);
    block.dataset.sourceEnd = String(paragraph.end || 0);

    if (section) {
      block.dataset.sectionIndex = String(sectionIndex);
      sectionIndex += 1;
    }

    fragment.append(block);
  });

  readableWordCount = wordContext.count;
  content.replaceChildren(fragment);
  renderActiveCue();
}

function getPromptBlocks(text) {
  const blocks = [];
  const pendingCues = [];
  const normalizedText = String(text || "");
  const paragraphPattern = /\S[\s\S]*?(?=\n\s*\n|$)/gu;
  let match;

  while ((match = paragraphPattern.exec(normalizedText)) !== null) {
    const parsed = parsePromptParagraph(match[0]);
    const value = parsed.text.trim();

    if (value) {
      blocks.push({
        text: value,
        start: match.index,
        end: match.index + match[0].length,
        cues: [
          ...pendingCues.splice(0).map((cue) => ({ ...cue, index: 0 })),
          ...parsed.cues
        ]
      });
    } else if (parsed.cues.length > 0) {
      pendingCues.push(...parsed.cues);
    }
  }

  return blocks;
}

function parsePromptParagraph(paragraph) {
  const cues = [];
  let visibleText = "";

  paragraph.split("\n").forEach((line) => {
    if (isOperatorComment(line)) {
      return;
    }

    const lineStart = visibleText.length;
    const parsedLine = parseCueMarkup(line);

    if (parsedLine.text.trim()) {
      if (visibleText) {
        visibleText += "\n";
      }

      const visibleLineStart = visibleText.length;
      visibleText += parsedLine.text;
      cues.push(...parsedLine.cues.map((cue) => ({ ...cue, index: visibleLineStart + cue.index })));
      return;
    }

    cues.push(...parsedLine.cues.map((cue) => ({ ...cue, index: lineStart })));
  });

  return { text: visibleText, cues };
}

function isOperatorComment(line) {
  return /^\s*\/\//u.test(line);
}

function parseCueMarkup(line) {
  const cuePattern = /\[(CAM|AVISO):\s*([^\]]+?)\]|\[(FIN AVISO|SIN AVISO|LIMPIAR AVISO|CLEAR)\]/giu;
  const cues = [];
  let text = "";
  let lastIndex = 0;
  let match;

  while ((match = cuePattern.exec(line)) !== null) {
    text += line.slice(lastIndex, match.index);

    if (match[3]) {
      cues.push({ index: text.length, text: "" });
    } else {
      const type = match[1].toUpperCase();
      const value = match[2].trim();

      if (value) {
        cues.push({ index: text.length, text: type === "CAM" ? `CAM ${value}` : value });
      }
    }

    lastIndex = cuePattern.lastIndex;
  }

  text += line.slice(lastIndex);
  return { text, cues };
}

function renderInlineText(parent, text, cues = [], wordContext = { count: 0 }) {
  const sortedCues = cues
    .map((cue) => ({
      index: Math.max(0, Math.min(text.length, Number(cue.index) || 0)),
      text: cue.text || ""
    }))
    .sort((a, b) => a.index - b.index);
  let cursor = 0;

  sortedCues.forEach((cue) => {
    appendHighlightedText(parent, text.slice(cursor, cue.index), wordContext);
    appendCueMarker(parent, cue.text);
    cursor = cue.index;
  });

  appendHighlightedText(parent, text.slice(cursor), wordContext);
}

function appendCueMarker(parent, cueText) {
  const marker = document.createElement("span");
  marker.className = "cue-marker";
  marker.dataset.cueText = cueText;
  marker.setAttribute("aria-hidden", "true");
  parent.append(marker);
}

function appendHighlightedText(parent, text, wordContext) {
  const highlightPattern = /==(.+?)==/gu;
  let lastIndex = 0;
  let match;

  while ((match = highlightPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      appendTextWithWordSpans(parent, text.slice(lastIndex, match.index), wordContext);
    }

    const highlight = document.createElement("span");
    highlight.className = "highlight";
    appendTextWithWordSpans(highlight, match[1], wordContext);
    parent.append(highlight);
    lastIndex = highlightPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    appendTextWithWordSpans(parent, text.slice(lastIndex), wordContext);
  }
}

function appendTextWithWordSpans(parent, text, wordContext) {
  const wordPattern = /[\p{L}\p{N}]+(?:['’´-][\p{L}\p{N}]+)*/gu;
  let lastIndex = 0;
  let match;

  while ((match = wordPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parent.append(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    const word = document.createElement("span");
    word.className = "word";
    word.dataset.wordIndex = String(wordContext.count);
    word.textContent = match[0];
    parent.append(word);
    wordContext.count += 1;
    lastIndex = wordPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parent.append(document.createTextNode(text.slice(lastIndex)));
  }
}

function renderActiveCue() {
  const cueText = getCueStatus().current;
  cueOverlay.textContent = cueText;
  cueOverlay.classList.toggle("visible", Boolean(cueText) && !isStandby);
}

function getActiveLineInfo() {
  if (readableWordCount <= 0) {
    return { startIndex: -1, endIndex: -1, text: "" };
  }

  const words = [...content.querySelectorAll(".word")];

  if (words.length === 0) {
    return { startIndex: -1, endIndex: -1, text: "" };
  }

  const readingLine = window.innerHeight * 0.5;
  let closest = words[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  words.forEach((word) => {
    const rect = word.getBoundingClientRect();
    const wordCenter = rect.top + rect.height * 0.5;
    const distance = Math.abs(wordCenter - readingLine);

    if (distance < closestDistance) {
      closest = word;
      closestDistance = distance;
    }
  });

  const closestRect = closest.getBoundingClientRect();
  const closestCenter = closestRect.top + closestRect.height * 0.5;
  const lineTolerance = Math.max(4, closestRect.height * 0.45);
  const lineWords = words.filter((word) => {
    const rect = word.getBoundingClientRect();
    const wordCenter = rect.top + rect.height * 0.5;
    return Math.abs(wordCenter - closestCenter) <= lineTolerance;
  });
  const firstWord = lineWords[0];
  const lastWord = lineWords.at(-1);

  return {
    startIndex: firstWord ? Number(firstWord.dataset.wordIndex) : -1,
    endIndex: lastWord ? Number(lastWord.dataset.wordIndex) : -1,
    text: lineWords.map((word) => word.textContent || "").join(" ")
  };
}

function getCueStatus() {
  const markers = [...content.querySelectorAll(".cue-marker")];

  if (markers.length === 0) {
    return { current: "", next: "" };
  }

  const paddingTop = parseFloat(getComputedStyle(content).paddingTop) || 0;
  const cues = markers.map((marker) => ({
    target: getMarkerScrollTarget(marker, paddingTop),
    text: marker.dataset.cueText || ""
  }));
  let current = "";
  let next = "";

  cues.forEach((cue) => {
    if (cue.target <= scrollY + 8) {
      current = cue.text;
    } else if (!next && cue.text) {
      next = cue.text;
    }
  });

  return { current, next };
}

function getMarkerScrollTarget(marker, paddingTop) {
  if (Number.isFinite(marker.offsetTop)) {
    return Math.max(0, marker.offsetTop - paddingTop);
  }

  const contentTop = content.getBoundingClientRect().top;
  const markerTop = marker.getBoundingClientRect().top - contentTop + scrollY;
  return Math.max(0, markerTop - paddingTop);
}

function parseSectionParagraph(paragraph) {
  const [firstLine, ...restLines] = paragraph.split("\n");
  const match = firstLine.match(/^\s{0,3}#{1,3}\s+(.+?)\s*$/u);

  if (!match) {
    return null;
  }

  const text = [match[1].trim(), ...restLines].join("\n").trim();
  return { text };
}

function jumpParagraph(direction) {
  const targets = getParagraphTargets();
  const now = performance.now();

  if (targets.length === 0) {
    return;
  }

  if (direction > 0) {
    scrollY = targets.find((target) => target > scrollY + 8) ?? getMaxScroll();
    lastParagraphJump = { direction, target: scrollY, time: now };
    return;
  }

  const chainBackward = lastParagraphJump?.direction === -1 && now - lastParagraphJump.time < 1500;

  if (chainBackward) {
    scrollY = targets.filter((target) => target < lastParagraphJump.target - 8).at(-1) ?? 0;
    lastParagraphJump = { direction, target: scrollY, time: now };
    return;
  }

  const currentIndex = getCurrentParagraphIndex(targets, scrollY);
  const currentStart = targets[currentIndex] ?? 0;
  const gracePx = getBackwardGracePx();
  const targetIndex = scrollY - currentStart <= gracePx ? currentIndex - 1 : currentIndex;

  scrollY = targetIndex >= 0 ? targets[targetIndex] : 0;
  lastParagraphJump = { direction, target: scrollY, time: now };
}

function jumpToNearestParagraph(targetScroll) {
  const targets = getParagraphTargets();

  if (targets.length === 0) {
    scrollY = Math.max(0, Math.min(getMaxScroll(), targetScroll));
    return;
  }

  scrollY = targets.reduce((closest, target) => {
    return Math.abs(target - targetScroll) < Math.abs(closest - targetScroll) ? target : closest;
  }, targets[0]);
}

function jumpToSection(sectionIndex) {
  if (!Number.isFinite(sectionIndex)) {
    return;
  }

  const section = content.querySelector(`[data-section-index="${sectionIndex}"]`);

  if (!section) {
    return;
  }

  const maxScroll = getMaxScroll();
  const paddingTop = parseFloat(getComputedStyle(content).paddingTop) || 0;
  scrollY = Math.max(0, Math.min(maxScroll, section.offsetTop - paddingTop));
}

function jumpToTextIndex(textIndex) {
  const paragraphs = [...content.querySelectorAll(".paragraph")];

  if (paragraphs.length === 0 || !Number.isFinite(textIndex)) {
    return;
  }

  const target =
    paragraphs.find((paragraph) => {
      const start = Number(paragraph.dataset.sourceStart) || 0;
      const end = Number(paragraph.dataset.sourceEnd) || start;
      return textIndex >= start && textIndex <= end;
    }) ||
    paragraphs.find((paragraph) => textIndex < (Number(paragraph.dataset.sourceStart) || 0)) ||
    paragraphs.at(-1);

  const start = Number(target.dataset.sourceStart) || 0;
  const end = Number(target.dataset.sourceEnd) || start;
  const relativePosition = end > start ? Math.max(0, Math.min(1, (textIndex - start) / (end - start))) : 0;
  const maxScroll = getMaxScroll();
  const paddingTop = parseFloat(getComputedStyle(content).paddingTop) || 0;
  const targetScroll = target.offsetTop - paddingTop + target.offsetHeight * relativePosition;

  scrollY = Math.max(0, Math.min(maxScroll, targetScroll));
}

function getParagraphTargets() {
  const maxScroll = getMaxScroll();
  const paddingTop = parseFloat(getComputedStyle(content).paddingTop) || 0;

  return [...content.querySelectorAll(".paragraph")]
    .map((paragraph) => Math.max(0, Math.min(maxScroll, paragraph.offsetTop - paddingTop)))
    .filter((target, index, targets) => index === 0 || Math.abs(target - targets[index - 1]) > 8);
}

function getCurrentParagraphIndex(targets, currentScroll) {
  let currentIndex = 0;

  targets.forEach((target, index) => {
    if (target <= currentScroll + 8) {
      currentIndex = index;
    }
  });

  return currentIndex;
}

function getBackwardGracePx() {
  const fontSize = Number(state.fontSize) || 54;
  const lineHeight = Number(state.lineHeight) || 1.35;
  const speed = getPixelSpeed();
  const lineGrace = fontSize * lineHeight * 1.5;
  const playbackGrace = isPlaying ? speed * 1.25 : 0;

  return Math.max(90, lineGrace, playbackGrace);
}

function getPixelSpeed() {
  const maxScroll = getMaxScroll();
  const totalSeconds = getTotalPlaybackSeconds();

  if (maxScroll <= 0 || totalSeconds <= 0) {
    return 0;
  }

  return maxScroll / totalSeconds;
}

function getTotalPlaybackSeconds() {
  const wordCount = readableWordCount;
  const wordsPerSecond = getEffectiveReadingSpeed();

  if (wordCount <= 0) {
    return 0;
  }

  return wordCount / wordsPerSecond;
}

function changeLocalSpeed(delta) {
  localSpeedOffset = Math.max(-1.2, Math.min(1.2, localSpeedOffset + delta));
  renderSoloControls();
  sendRuntime();
}

function getEffectiveReadingSpeed() {
  return normalizeReadingSpeed(normalizeReadingSpeed(state.speed) + localSpeedOffset);
}

function renderSoloControls() {
  if (!soloPlay || !soloSpeed) {
    return;
  }

  soloPlay.textContent = isPlaying || isCountingDown ? "Pausa" : "Play";
  soloSpeed.textContent = `${getEffectiveReadingSpeed().toFixed(1)} p/s`;
}

function getWordCount(text) {
  const words = String(text || "").match(/[\p{L}\p{N}]+(?:['’´-][\p{L}\p{N}]+)*/gu);
  return words ? words.length : 0;
}

function normalizeReadingSpeed(speed) {
  const numericSpeed = Number(speed) || 2.2;
  const migratedSpeed = numericSpeed > 10 ? numericSpeed / 32 : numericSpeed;
  return Math.max(0.5, Math.min(4.5, migratedSpeed));
}

function getFontStack(fontFamily) {
  const fonts = {
    systemSans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    arial: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    verdana: 'Verdana, Geneva, sans-serif',
    helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    serif: 'ui-serif, Georgia, "Times New Roman", serif'
  };

  return fonts[fontFamily] || fonts.systemSans;
}

function getTopPadding(verticalPosition) {
  const normalized = Math.max(-50, Math.min(45, Number(verticalPosition) || 0));
  return 50 + normalized;
}
