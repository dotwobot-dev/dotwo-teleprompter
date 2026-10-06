const OLD_DEFAULT_TEXT = `Este es un guion de prueba para el teleprompter.

La ventana de control queda en tu pantalla principal y la ventana de prompter puede enviarse a una segunda pantalla.

Ajusta velocidad, tamaño, ancho, interlineado y espejo. Cuando el núcleo se sienta bien, podemos añadir presets, importación de archivos y mando remoto.`;

const PLAIN_QUIJOTE_DEFAULT_TEXT = `En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor.

Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lentejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.

El resto della concluían sayo de velarte, calzas de velludo para las fiestas, con sus pantuflos de lo mesmo, y los días de entre semana se honraba con su vellorí de lo más fino.

Tenía en su casa una ama que pasaba de los cuarenta, y una sobrina que no llegaba a los veinte, y un mozo de campo y plaza, que así ensillaba el rocín como tomaba la podadera.

Frisaba la edad de nuestro hidalgo con los cincuenta años. Era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza.

Quieren decir que tenía el sobrenombre de Quijada, o Quesada, que en esto hay alguna diferencia en los autores que deste caso escriben; aunque, por conjeturas verosímiles, se deja entender que se llamaba Quejana.

Pero esto importa poco a nuestro cuento: basta que en la narración dél no se salga un punto de la verdad.`;

const DEFAULT_TEXT = `# Capítulo primero

${PLAIN_QUIJOTE_DEFAULT_TEXT}`;

const DEFAULT_STATE = {
  text: DEFAULT_TEXT,
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

const STORAGE_KEY = "teleprompter-mvp-state";
const RECENTS_KEY = "teleprompter-mvp-recents";
const SETUP_PRESETS_KEY = "teleprompter-mvp-setup-presets";
const MAX_RECENTS = 8;
const DOCUMENT_EXTENSIONS = ["docx", "pdf"];
const SETUP_KEYS = [
  "speed",
  "fontSize",
  "fontFamily",
  "lineHeight",
  "columnWidth",
  "verticalPosition",
  "countdownSeconds",
  "currentWordHighlight",
  "mirror",
  "guide",
  "lightTheme"
];
const BUILT_IN_SETUP_PRESETS = [
  {
    id: "builtin-studio",
    name: "Plató",
    builtin: true,
    settings: {
      speed: 2.2,
      fontSize: 78,
      fontFamily: "verdana",
      lineHeight: 1.2,
      columnWidth: 68,
      verticalPosition: 0,
      countdownSeconds: 5,
      currentWordHighlight: false,
      mirror: false,
      guide: true,
      lightTheme: false
    }
  },
  {
    id: "builtin-laptop",
    name: "Portátil",
    builtin: true,
    settings: {
      speed: 2.1,
      fontSize: 54,
      fontFamily: "systemSans",
      lineHeight: 1.35,
      columnWidth: 78,
      verticalPosition: 0,
      countdownSeconds: 3,
      currentWordHighlight: false,
      mirror: false,
      guide: true,
      lightTheme: false
    }
  },
  {
    id: "builtin-mirror",
    name: "Espejo",
    builtin: true,
    settings: {
      speed: 2.0,
      fontSize: 80,
      fontFamily: "verdana",
      lineHeight: 1.2,
      columnWidth: 65,
      verticalPosition: 0,
      countdownSeconds: 5,
      currentWordHighlight: false,
      mirror: true,
      guide: true,
      lightTheme: false
    }
  },
  {
    id: "builtin-close-reading",
    name: "Lectura cercana",
    builtin: true,
    settings: {
      speed: 2.4,
      fontSize: 46,
      fontFamily: "systemSans",
      lineHeight: 1.45,
      columnWidth: 82,
      verticalPosition: -8,
      countdownSeconds: 0,
      currentWordHighlight: false,
      mirror: false,
      guide: false,
      lightTheme: false
    }
  }
];
let state = loadState();
let recentFiles = loadRecentFiles();
let setupPresets = loadSetupPresets();
let sections = [];
let scriptMarks = [];
let isPlaying = false;
let isCountingDown = false;
let isPrompterOpen = false;
let isStandby = false;
let currentProgress = 0;
let cueNow = "";
let cueNext = "";
let currentLineStartIndex = -1;
let currentLineEndIndex = -1;
let currentLineText = "";
let cursorSyncFrame = 0;
let searchMatches = [];
let currentSearchMatch = -1;
let searchNeedsFocus = false;
let isCompactDirect = false;
let readableWordRanges = [];
let lastFollowedLineKey = "";
let previewTimer = 0;
let previewGeneration = 0;
let previewConnection = "closed";

const els = {
  screenSelect: document.querySelector("#screenSelect"),
  refreshScreens: document.querySelector("#refreshScreens"),
  loadFile: document.querySelector("#loadFile"),
  compactDirectToggle: document.querySelector("#compactDirectToggle"),
  markupHelpButton: document.querySelector("#markupHelpButton"),
  markupHelpDialog: document.querySelector("#markupHelpDialog"),
  openPrompter: document.querySelector("#openPrompter"),
  closePrompter: document.querySelector("#closePrompter"),
  cleanText: document.querySelector("#cleanText"),
  saveText: document.querySelector("#saveText"),
  saveSession: document.querySelector("#saveSession"),
  openSession: document.querySelector("#openSession"),
  recentFiles: document.querySelector("#recentFiles"),
  openRecent: document.querySelector("#openRecent"),
  scriptStatus: document.querySelector("#scriptStatus"),
  wordCount: document.querySelector("#wordCount"),
  sectionCount: document.querySelector("#sectionCount"),
  estimatedDuration: document.querySelector("#estimatedDuration"),
  markupSummary: document.querySelector("#markupSummary"),
  currentWordStatus: document.querySelector("#currentWordStatus"),
  cueNow: document.querySelector("#cueNow"),
  cueNext: document.querySelector("#cueNext"),
  markupWarnings: document.querySelector("#markupWarnings"),
  scriptSearchInput: document.querySelector("#scriptSearchInput"),
  scriptSearchPrev: document.querySelector("#scriptSearchPrev"),
  scriptSearchNext: document.querySelector("#scriptSearchNext"),
  scriptSearchCount: document.querySelector("#scriptSearchCount"),
  scriptSearchClear: document.querySelector("#scriptSearchClear"),
  sectionSelect: document.querySelector("#sectionSelect"),
  jumpSectionControl: document.querySelector("#jumpSectionControl"),
  jumpSectionPrompter: document.querySelector("#jumpSectionPrompter"),
  markSelect: document.querySelector("#markSelect"),
  jumpMarkControl: document.querySelector("#jumpMarkControl"),
  jumpMarkPrompter: document.querySelector("#jumpMarkPrompter"),
  scriptText: document.querySelector("#scriptText"),
  readingWordHighlight: document.querySelector("#readingWordHighlight"),
  playPause: document.querySelector("#playPause"),
  reset: document.querySelector("#reset"),
  backward: document.querySelector("#backward"),
  forward: document.querySelector("#forward"),
  jumpStart: document.querySelector("#jumpStart"),
  jumpMiddle: document.querySelector("#jumpMiddle"),
  jumpEnd: document.querySelector("#jumpEnd"),
  prompterStatus: document.querySelector("#prompterStatus"),
  progressText: document.querySelector("#progressText"),
  progressBar: document.querySelector("#progressBar"),
  timeText: document.querySelector("#timeText"),
  remainingText: document.querySelector("#remainingText"),
  compactStatus: document.querySelector("#compactStatus"),
  compactProgressText: document.querySelector("#compactProgressText"),
  compactProgressBar: document.querySelector("#compactProgressBar"),
  compactTimeText: document.querySelector("#compactTimeText"),
  compactRemainingText: document.querySelector("#compactRemainingText"),
  compactReset: document.querySelector("#compactReset"),
  compactBackward: document.querySelector("#compactBackward"),
  compactPlayPause: document.querySelector("#compactPlayPause"),
  compactForward: document.querySelector("#compactForward"),
  compactStandbyToggle: document.querySelector("#compactStandbyToggle"),
  compactJumpStart: document.querySelector("#compactJumpStart"),
  compactJumpMiddle: document.querySelector("#compactJumpMiddle"),
  compactJumpEnd: document.querySelector("#compactJumpEnd"),
  compactSpeedDown: document.querySelector("#compactSpeedDown"),
  compactSpeedUp: document.querySelector("#compactSpeedUp"),
  compactSpeedValue: document.querySelector("#compactSpeedValue"),
  compactCueNow: document.querySelector("#compactCueNow"),
  compactCueNext: document.querySelector("#compactCueNext"),
  countdownStart: document.querySelector("#countdownStart"),
  standbyToggle: document.querySelector("#standbyToggle"),
  rehearsalMode: document.querySelector("#rehearsalMode"),
  liveMode: document.querySelector("#liveMode"),
  stateBadge: document.querySelector("#stateBadge"),
  speed: document.querySelector("#speed"),
  speedValue: document.querySelector("#speedValue"),
  speedSlow: document.querySelector("#speedSlow"),
  speedNormal: document.querySelector("#speedNormal"),
  speedFast: document.querySelector("#speedFast"),
  countdownSeconds: document.querySelector("#countdownSeconds"),
  fontSize: document.querySelector("#fontSize"),
  fontSizeValue: document.querySelector("#fontSizeValue"),
  fontFamily: document.querySelector("#fontFamily"),
  markupCameraValue: document.querySelector("#markupCameraValue"),
  insertCameraCode: document.querySelector("#insertCameraCode"),
  markupNoticeValue: document.querySelector("#markupNoticeValue"),
  insertNoticeCode: document.querySelector("#insertNoticeCode"),
  insertEndCueCode: document.querySelector("#insertEndCueCode"),
  wrapHighlightCode: document.querySelector("#wrapHighlightCode"),
  insertOperatorNoteCode: document.querySelector("#insertOperatorNoteCode"),
  markupValidationSummary: document.querySelector("#markupValidationSummary"),
  markupValidationList: document.querySelector("#markupValidationList"),
  setupPresetSelect: document.querySelector("#setupPresetSelect"),
  applySetupPreset: document.querySelector("#applySetupPreset"),
  saveSetupPreset: document.querySelector("#saveSetupPreset"),
  deleteSetupPreset: document.querySelector("#deleteSetupPreset"),
  lineHeight: document.querySelector("#lineHeight"),
  lineHeightValue: document.querySelector("#lineHeightValue"),
  columnWidth: document.querySelector("#columnWidth"),
  columnWidthValue: document.querySelector("#columnWidthValue"),
  verticalPosition: document.querySelector("#verticalPosition"),
  verticalPositionValue: document.querySelector("#verticalPositionValue"),
  followCursor: document.querySelector("#followCursor"),
  currentWordHighlight: document.querySelector("#currentWordHighlight"),
  mirror: document.querySelector("#mirror"),
  guide: document.querySelector("#guide"),
  lightTheme: document.querySelector("#lightTheme"),
  talentPreview: document.querySelector("#talentPreview"),
  talentPreviewImage: document.querySelector("#talentPreviewImage"),
  talentPreviewEmpty: document.querySelector("#talentPreviewEmpty"),
  talentPreviewStatus: document.querySelector("#talentPreviewStatus")
};
const previewHome = els.talentPreview.parentElement;

init();

async function init() {
  bindControls();
  renderState();
  renderRecentFiles();
  renderSetupPresets();
  await refreshScreens();
  sendState();
  renderCompactDirectMode();

  window.teleprompter.onRuntime((runtime) => {
    isPlaying = Boolean(runtime.isPlaying);
    isCountingDown = Boolean(runtime.isCountingDown);
    isStandby = Boolean(runtime.isStandby);
    cueNow = runtime.cueNow || "";
    cueNext = runtime.cueNext || "";
    currentLineStartIndex = Number.isFinite(runtime.currentLineStartIndex) ? runtime.currentLineStartIndex : -1;
    currentLineEndIndex = Number.isFinite(runtime.currentLineEndIndex) ? runtime.currentLineEndIndex : -1;
    currentLineText = runtime.currentLineText || "";
    currentProgress = Math.max(0, Math.min(1, runtime.progress || 0));
    renderPlayback();
    renderProgress(currentProgress);
    renderTime(runtime);
    renderStatus();
    renderReadingFollow({
      autoScroll: isPlaying && (state.currentWordHighlight || document.activeElement !== els.scriptText)
    });
  });

  window.teleprompter.onClosed(() => {
    isPrompterOpen = false;
    restartPrompterPreview();
    isPlaying = false;
    isCountingDown = false;
    isStandby = false;
    cueNow = "";
    cueNext = "";
    currentLineStartIndex = -1;
    currentLineEndIndex = -1;
    currentLineText = "";
    lastFollowedLineKey = "";
    renderPlayback();
    renderStatus();
    renderCueStatus();
    renderReadingFollow();
  });
}

function bindControls() {
  els.talentPreview.addEventListener("toggle", restartPrompterPreview);
  document.addEventListener("visibilitychange", restartPrompterPreview);
  window.addEventListener("pagehide", () => {
    clearTimeout(previewTimer);
    previewGeneration += 1;
  });
  els.refreshScreens.addEventListener("click", refreshScreens);
  els.loadFile.addEventListener("click", loadFile);
  els.markupHelpButton.addEventListener("click", () => {
    renderMarkupTools();
    els.markupHelpDialog.showModal();
  });
  els.openPrompter.addEventListener("click", openPrompter);
  els.closePrompter.addEventListener("click", async () => {
    await window.teleprompter.closePrompter();
  });
  els.compactDirectToggle.addEventListener("click", toggleCompactDirect);
  els.cleanText.addEventListener("click", cleanCurrentText);
  els.saveText.addEventListener("click", saveCurrentText);
  els.saveSession.addEventListener("click", saveCurrentSession);
  els.openSession.addEventListener("click", openSavedSession);
  els.openRecent.addEventListener("click", openRecentFile);
  els.jumpSectionControl.addEventListener("click", jumpToSelectedSectionInControl);
  els.jumpSectionPrompter.addEventListener("click", jumpToSelectedSectionInPrompter);
  els.jumpMarkControl.addEventListener("click", jumpToSelectedMarkInControl);
  els.jumpMarkPrompter.addEventListener("click", jumpToSelectedMarkInPrompter);
  els.scriptSearchInput.addEventListener("input", () => updateSearchMatches({ selectFirst: true }));
  els.scriptSearchInput.addEventListener("keydown", handleSearchKeydown);
  els.scriptSearchPrev.addEventListener("click", () => navigateSearch(-1));
  els.scriptSearchNext.addEventListener("click", () => navigateSearch(1));
  els.scriptSearchClear.addEventListener("click", clearSearch);

  els.scriptText.addEventListener("input", () => {
    updateState({ text: els.scriptText.value });
    scheduleCursorFollow();
  });
  els.scriptText.addEventListener("scroll", () => renderReadingFollow());
  els.playPause.addEventListener("click", () => {
    sendCommand(isPlaying || isCountingDown ? "pause" : "play");
  });
  els.countdownStart.addEventListener("click", () => sendCommand("countdownPlay"));
  els.standbyToggle.addEventListener("click", () => sendCommand("standbyToggle"));
  els.reset.addEventListener("click", () => sendCommand("reset"));
  els.backward.addEventListener("click", () => sendCommand("backward"));
  els.forward.addEventListener("click", () => sendCommand("forward"));
  els.jumpStart.addEventListener("click", () => sendCommand("reset"));
  els.jumpMiddle.addEventListener("click", () => sendCommand("middle"));
  els.jumpEnd.addEventListener("click", () => sendCommand("end"));
  els.compactReset.addEventListener("click", () => sendCommand("reset"));
  els.compactBackward.addEventListener("click", () => sendCommand("backward"));
  els.compactPlayPause.addEventListener("click", () => sendCommand(isPlaying || isCountingDown ? "pause" : "play"));
  els.compactForward.addEventListener("click", () => sendCommand("forward"));
  els.compactStandbyToggle.addEventListener("click", () => sendCommand("standbyToggle"));
  els.compactJumpStart.addEventListener("click", () => sendCommand("reset"));
  els.compactJumpMiddle.addEventListener("click", () => sendCommand("middle"));
  els.compactJumpEnd.addEventListener("click", () => sendCommand("end"));
  els.compactSpeedDown.addEventListener("click", () => changeSpeed(-0.1));
  els.compactSpeedUp.addEventListener("click", () => changeSpeed(0.1));

  bindRange("speed", Number, "");
  bindRange("fontSize", Number, " px");
  bindRange("lineHeight", Number, "");
  bindRange("columnWidth", Number, " vw");
  bindRange("verticalPosition", Number, "");

  els.rehearsalMode.addEventListener("click", () => updateState({ operatorMode: "rehearsal" }));
  els.liveMode.addEventListener("click", () => updateState({ operatorMode: "live" }));
  els.applySetupPreset.addEventListener("click", applySelectedSetupPreset);
  els.saveSetupPreset.addEventListener("click", saveCurrentSetupPreset);
  els.deleteSetupPreset.addEventListener("click", deleteSelectedSetupPreset);
  els.setupPresetSelect.addEventListener("change", renderSetupPresetActions);

  ["mirror", "guide", "lightTheme"].forEach((key) => {
    els[key].addEventListener("change", () => updateState({ [key]: els[key].checked }));
  });

  els.followCursor.addEventListener("change", () => {
    updateState({
      followCursor: els.followCursor.checked,
      currentWordHighlight: els.followCursor.checked ? false : state.currentWordHighlight
    });
  });

  els.currentWordHighlight.addEventListener("change", () => {
    updateState({
      currentWordHighlight: els.currentWordHighlight.checked,
      followCursor: els.currentWordHighlight.checked ? false : state.followCursor
    });
  });

  els.speedSlow.addEventListener("click", () => updateState({ speed: 1.5 }));
  els.speedNormal.addEventListener("click", () => updateState({ speed: 2.2 }));
  els.speedFast.addEventListener("click", () => updateState({ speed: 3.2 }));
  els.countdownSeconds.addEventListener("change", () => updateState({ countdownSeconds: Number(els.countdownSeconds.value) }));
  els.fontFamily.addEventListener("change", () => updateState({ fontFamily: els.fontFamily.value }));
  els.insertCameraCode.addEventListener("click", insertCameraCode);
  els.insertNoticeCode.addEventListener("click", insertNoticeCode);
  els.insertEndCueCode.addEventListener("click", () => insertMarkupAtCursor("[FIN AVISO]"));
  els.wrapHighlightCode.addEventListener("click", wrapSelectionWithHighlight);
  els.insertOperatorNoteCode.addEventListener("click", insertOperatorNoteCode);

  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "g") {
      event.preventDefault();
      navigateSearch(event.shiftKey ? -1 : 1);
      return;
    }

    if (
      event.target === els.scriptSearchInput ||
      (event.target === els.scriptText && !state.currentWordHighlight)
    ) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      sendCommand(isPlaying || isCountingDown ? "pause" : "play");
    }
    if (event.code === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (state.countdownSeconds > 0) {
        sendCommand(isPlaying || isCountingDown ? "pause" : "countdownPlay");
      }
    }
    if (event.code === "ArrowLeft") {
      event.preventDefault();
      sendCommand("backward");
    }
    if (event.code === "ArrowRight") {
      event.preventDefault();
      sendCommand("forward");
    }
    if (event.code === "ArrowUp") {
      event.preventDefault();
      changeSpeed(event.shiftKey ? 0.5 : 0.1);
    }
    if (event.code === "ArrowDown") {
      event.preventDefault();
      changeSpeed(event.shiftKey ? -0.5 : -0.1);
    }
    if (event.code === "Home") {
      event.preventDefault();
      sendCommand("reset");
    }
    if (event.code === "End") {
      event.preventDefault();
      sendCommand("end");
    }
    if (event.key.toLowerCase() === "b") {
      event.preventDefault();
      sendCommand("standbyToggle");
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      changeSpeed(0.1);
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      changeSpeed(-0.1);
    }
  });
  window.addEventListener("resize", () => renderReadingFollow());
}

function bindRange(key, cast, suffix) {
  els[key].addEventListener("input", () => updateState({ [key]: cast(els[key].value) }));
  els[`${key}Value`].textContent = key === "speed" ? formatSpeed(state.speed) : `${state[key]}${suffix}`;
}

async function refreshScreens() {
  const screens = await window.teleprompter.listScreens();
  els.screenSelect.replaceChildren();

  screens.forEach((display) => {
    const option = document.createElement("option");
    option.value = display.id;
    option.textContent = `${display.label} · ${display.size.width}×${display.size.height}`;
    els.screenSelect.append(option);
  });

  if (screens[1]) {
    els.screenSelect.value = screens[1].id;
  }
}

async function openPrompter() {
  isPrompterOpen = await window.teleprompter.openPrompter(els.screenSelect.value);
  renderStatus();
  sendState();
  restartPrompterPreview();
}

function restartPrompterPreview() {
  clearTimeout(previewTimer);
  const generation = ++previewGeneration;
  if (!isPrompterOpen) {
    previewConnection = "closed";
    showPreviewPlaceholder("Prompter cerrado");
    renderPreviewStatus();
    return;
  }
  if (!els.talentPreview.open || document.hidden) {
    return;
  }
  if (previewConnection === "closed") {
    previewConnection = "loading";
    showPreviewPlaceholder("Conectando");
    renderPreviewStatus();
  }
  refreshPrompterPreview(generation);
}

async function refreshPrompterPreview(generation) {
  try {
    const preview = await window.teleprompter.capturePreview();
    if (generation !== previewGeneration) return;
    previewConnection = preview.status;
    if (preview.status === "ready") {
      if (els.talentPreviewImage.src !== preview.frame) {
        els.talentPreviewImage.src = preview.frame;
      }
      els.talentPreviewImage.hidden = false;
      els.talentPreviewEmpty.hidden = true;
      els.talentPreviewImage.title = `${preview.width} x ${preview.height}`;
    } else {
      showPreviewPlaceholder(preview.status === "loading" ? "Conectando" : "Vista no disponible");
    }
  } catch {
    if (generation !== previewGeneration) return;
    previewConnection = "unavailable";
    showPreviewPlaceholder("Vista no disponible");
  }
  if (generation !== previewGeneration) return;
  renderPreviewStatus();
  previewTimer = setTimeout(
    () => refreshPrompterPreview(generation),
    isPlaying || isCountingDown ? 125 : 333
  );
}

function showPreviewPlaceholder(message) {
  els.talentPreviewImage.hidden = true;
  els.talentPreviewImage.removeAttribute("src");
  els.talentPreviewEmpty.textContent = message;
  els.talentPreviewEmpty.hidden = false;
}

function renderPreviewStatus() {
  els.talentPreviewStatus.textContent = !isPrompterOpen
    ? "Cerrado"
    : previewConnection === "ready"
      ? els.prompterStatus.textContent
      : previewConnection === "loading" ? "Conectando" : "Sin se\u00f1al";
}

async function loadFile() {
  if (!requestScriptMutation("cargar otro archivo")) {
    return;
  }

  try {
    const file = await window.teleprompter.openTextFile();

    if (file.canceled) {
      return;
    }

    const importedText = prepareImportedText(file.text, file.extension);

    if (!importedText && file.warning) {
      setScriptStatus(file.warning);
      return;
    }

    updateState({ text: importedText });
    addRecentFile(file);
    setScriptStatus(file.warning ? `Cargado: ${file.name} · ${file.warning}` : `Cargado: ${file.name}`);
  } catch (error) {
    setScriptStatus("No se pudo cargar el archivo");
    console.error(error);
  }
}

async function openRecentFile() {
  const filePath = els.recentFiles.value;

  if (!filePath) {
    return;
  }

  if (!requestScriptMutation("abrir un archivo reciente")) {
    return;
  }

  try {
    const file = await window.teleprompter.readTextFile(filePath);
    const importedText = prepareImportedText(file.text, file.extension);

    if (!importedText && file.warning) {
      setScriptStatus(file.warning);
      return;
    }

    updateState({ text: importedText });
    addRecentFile(file);
    setScriptStatus(file.warning ? `Cargado: ${file.name} · ${file.warning}` : `Cargado: ${file.name}`);
  } catch (error) {
    recentFiles = recentFiles.filter((file) => file.path !== filePath);
    saveRecentFiles();
    renderRecentFiles();
    setScriptStatus("No se pudo abrir el reciente");
    console.error(error);
  }
}

async function saveCurrentText() {
  try {
    const result = await window.teleprompter.saveTextFile({ text: state.text });

    if (result.canceled) {
      return;
    }

    addRecentFile(result);
    setScriptStatus(`Guardado: ${result.name}`);
  } catch (error) {
    setScriptStatus("No se pudo guardar el texto");
    console.error(error);
  }
}

async function saveCurrentSession() {
  try {
    const result = await window.teleprompter.saveSession({
      app: "teleprompter-mvp",
      version: 1,
      savedAt: new Date().toISOString(),
      state
    });

    if (result.canceled) {
      return;
    }

    setScriptStatus(`Sesión guardada: ${result.name}`);
  } catch (error) {
    setScriptStatus("No se pudo guardar la sesión");
    console.error(error);
  }
}

async function openSavedSession() {
  if (!requestScriptMutation("abrir otra sesión")) {
    return;
  }

  try {
    const result = await window.teleprompter.openSession();

    if (result.canceled) {
      return;
    }

    if (!result.session?.state?.text) {
      setScriptStatus("La sesión no parece válida");
      return;
    }

    updateState({ ...DEFAULT_STATE, ...result.session.state });
    setScriptStatus(`Sesión abierta: ${result.name}`);
  } catch (error) {
    setScriptStatus("No se pudo abrir la sesión");
    console.error(error);
  }
}

function cleanCurrentText() {
  if (!requestScriptMutation("limpiar el guion")) {
    return;
  }

  updateState({ text: cleanScriptText(state.text) });
  setScriptStatus("Texto limpiado");
}

function updateState(patch) {
  state = { ...state, ...patch };
  saveState();
  renderState();
  sendState();
}

function sendState() {
  window.teleprompter.setState(state);
}

function sendCommand(command) {
  if (!isPrompterOpen) {
    openPrompter().then(() => window.teleprompter.sendCommand(command));
    return;
  }
  window.teleprompter.sendCommand(command);
}

function renderState() {
  const liveMode = state.operatorMode === "live";

  if (els.scriptText.value !== state.text) {
    els.scriptText.value = state.text;
  }

  els.scriptText.style.fontFamily = getFontStack(state.fontFamily);
  els.scriptText.readOnly = liveMode || state.currentWordHighlight;
  readableWordRanges = getReadableWordRanges(state.text);
  sections = extractSections(state.text);
  scriptMarks = extractScriptMarks(state.text);
  renderScriptSummary();
  updateSearchMatches();
  renderSectionSelect();
  renderMarkSelect();
  ["speed", "fontSize", "lineHeight", "columnWidth", "verticalPosition"].forEach((key) => {
    els[key].value = state[key];
  });
  els.countdownSeconds.value = state.countdownSeconds;
  els.fontFamily.value = state.fontFamily;
  els.speedValue.textContent = formatSpeed(state.speed);
  els.compactSpeedValue.textContent = formatSpeed(state.speed);
  els.countdownStart.disabled = state.countdownSeconds === 0;
  els.countdownStart.textContent = state.countdownSeconds === 0 ? "Cuenta atrás" : `Cuenta ${state.countdownSeconds}s`;
  els.fontSizeValue.textContent = `${state.fontSize} px`;
  els.lineHeightValue.textContent = state.lineHeight.toFixed(2);
  els.columnWidthValue.textContent = `${state.columnWidth} vw`;
  els.verticalPositionValue.textContent = formatVerticalPosition(state.verticalPosition);
  els.rehearsalMode.classList.toggle("active", !liveMode);
  els.liveMode.classList.toggle("active", liveMode);
  els.followCursor.checked = state.followCursor;
  els.currentWordHighlight.checked = state.currentWordHighlight;
  els.mirror.checked = state.mirror;
  els.guide.checked = state.guide;
  els.lightTheme.checked = state.lightTheme;
  document.body.classList.toggle("direct-mode", liveMode);
  renderEditLocks(liveMode);
  renderSetupPresetActions();
  renderCueStatus();
  renderStatus();
  renderReadingFollow();
}

function renderEditLocks(liveMode) {
  [els.loadFile, els.cleanText, els.openSession, els.recentFiles].forEach((element) => {
    element.disabled = liveMode;
  });
  els.openRecent.disabled = liveMode || recentFiles.length === 0;
}

function renderRecentFiles() {
  els.recentFiles.replaceChildren();

  if (recentFiles.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Sin archivos recientes";
    els.recentFiles.append(option);
    els.openRecent.disabled = true;
    return;
  }

  recentFiles.forEach((file) => {
    const option = document.createElement("option");
    option.value = file.path;
    option.textContent = file.name;
    els.recentFiles.append(option);
  });

  els.openRecent.disabled = false;
}

function renderSetupPresets() {
  const selectedValue = els.setupPresetSelect.value;
  els.setupPresetSelect.replaceChildren();

  getAllSetupPresets().forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.builtin ? `${preset.name} · base` : preset.name;
    els.setupPresetSelect.append(option);
  });

  if (getAllSetupPresets().some((preset) => preset.id === selectedValue)) {
    els.setupPresetSelect.value = selectedValue;
  }

  renderSetupPresetActions();
}

function renderSetupPresetActions() {
  const preset = getSelectedSetupPreset();
  els.applySetupPreset.disabled = !preset;
  els.deleteSetupPreset.disabled = !preset || preset.builtin;
}

function renderPlayback() {
  els.standbyToggle.textContent = isStandby ? "Salir de negro" : "Pantalla negra";
  els.standbyToggle.classList.toggle("active", isStandby);
  els.playPause.textContent = isPlaying || isCountingDown ? "Pause" : "Play";
  els.compactStandbyToggle.textContent = isStandby ? "Salir de negro" : "Pantalla negra";
  els.compactStandbyToggle.classList.toggle("active", isStandby);
  els.compactPlayPause.textContent = isPlaying || isCountingDown ? "Pause" : "Play";
}

function renderStatus() {
  let status = "Prompter cerrado";

  if (isStandby) {
    status = "Pantalla negra";
  } else if (isCountingDown) {
    status = "Cuenta atrás";
  } else if (isPlaying) {
    status = "Reproduciendo";
  } else if (isPrompterOpen && currentProgress >= 0.995) {
    status = "Finalizado";
  } else if (isPrompterOpen) {
    status = "Pausado";
  }

  els.prompterStatus.textContent = status;
  els.stateBadge.textContent = status;
  els.compactStatus.textContent = status;
  renderPreviewStatus();
  document.body.dataset.playback = status.toLowerCase().replace(/\s+/g, "-");
}

function renderProgress(progress) {
  const normalized = Math.max(0, Math.min(1, progress));
  els.progressBar.style.width = `${Math.round(normalized * 100)}%`;
  els.progressText.textContent = `${Math.round(normalized * 100)}%`;
  els.compactProgressBar.style.width = `${Math.round(normalized * 100)}%`;
  els.compactProgressText.textContent = `${Math.round(normalized * 100)}%`;
}

function renderTime(runtime) {
  els.timeText.textContent = `${formatDuration(runtime.totalSeconds || 0)} total`;
  els.remainingText.textContent = `${formatDuration(runtime.remainingSeconds || 0)} restante`;
  els.compactTimeText.textContent = `${formatDuration(runtime.totalSeconds || 0)} total`;
  els.compactRemainingText.textContent = `${formatDuration(runtime.remainingSeconds || 0)} restante`;
}

function renderScriptSummary() {
  const readableText = getReadableScriptText(state.text);
  const wordCount = getWordCount(readableText);
  const estimatedSeconds = getEstimatedDurationSeconds(readableText, state.speed);
  const markupReport = analyzeScriptMarkup(state.text);

  els.wordCount.textContent = `${wordCount} ${wordCount === 1 ? "palabra" : "palabras"}`;
  els.sectionCount.textContent = `${sections.length} ${sections.length === 1 ? "sección" : "secciones"}`;
  els.estimatedDuration.textContent = `${formatDuration(estimatedSeconds)} estimado`;
  els.markupSummary.textContent = formatMarkupSummary(markupReport);
  els.markupWarnings.hidden = markupReport.warnings.length === 0;
  els.markupWarnings.textContent = `${markupReport.warnings.length} ${markupReport.warnings.length === 1 ? "alerta" : "alertas"}`;
  renderMarkupTools(markupReport);
}

function renderSectionSelect() {
  const selectedValue = els.sectionSelect.value;
  const navigationLocked = state.followCursor;
  els.sectionSelect.replaceChildren();

  if (sections.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Sin secciones";
    els.sectionSelect.append(option);
    setJumpPairDisabled([els.jumpSectionControl, els.jumpSectionPrompter], true);
    return;
  }

  sections.forEach((section) => {
    const option = document.createElement("option");
    option.value = section.index;
    option.textContent = section.title;
    els.sectionSelect.append(option);
  });

  if (sections.some((section) => String(section.index) === selectedValue)) {
    els.sectionSelect.value = selectedValue;
  }

  setJumpPairDisabled(
    [els.jumpSectionControl, els.jumpSectionPrompter],
    navigationLocked,
    navigationLocked ? "Desactiva Seguir escritura para saltar manualmente" : ""
  );
}

function renderMarkSelect() {
  const selectedValue = els.markSelect.value;
  const navigationLocked = state.followCursor;
  els.markSelect.replaceChildren();

  if (scriptMarks.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Sin marcas";
    els.markSelect.append(option);
    setJumpPairDisabled([els.jumpMarkControl, els.jumpMarkPrompter], true);
    return;
  }

  scriptMarks.forEach((mark) => {
    const option = document.createElement("option");
    option.value = mark.index;
    option.textContent = mark.label;
    els.markSelect.append(option);
  });

  if (scriptMarks.some((mark) => String(mark.index) === selectedValue)) {
    els.markSelect.value = selectedValue;
  }

  setJumpPairDisabled(
    [els.jumpMarkControl, els.jumpMarkPrompter],
    navigationLocked,
    navigationLocked ? "Desactiva Seguir escritura para saltar manualmente" : ""
  );
}

function setJumpPairDisabled(buttons, disabled, title = "") {
  buttons.forEach((button) => {
    button.disabled = disabled;
    button.title = title;
  });
}

function renderCueStatus() {
  els.cueNow.textContent = `Ahora: ${cueNow || "--"}`;
  els.cueNext.textContent = `Siguiente: ${cueNext || "--"}`;
  els.compactCueNow.textContent = cueNow || "--";
  els.compactCueNext.textContent = cueNext || "--";
}

function renderReadingFollow({ autoScroll = false } = {}) {
  const range = getCurrentReadingLineRange();
  const isEnabled = Boolean(state.currentWordHighlight);
  const shouldShow = isEnabled && range && !isStandby;

  els.currentWordStatus.textContent = shouldShow ? `Línea: ${currentLineText || range.text}` : "Línea: --";
  hideReadingWordHighlight();

  if (!shouldShow || isCompactDirect || els.scriptText.offsetParent === null) {
    return;
  }

  requestAnimationFrame(() => {
    if (document.activeElement !== els.scriptText) {
      els.scriptText.focus({ preventScroll: true });
    }

    if (
      els.scriptText.selectionStart !== range.start ||
      els.scriptText.selectionEnd !== range.end
    ) {
      els.scriptText.setSelectionRange(range.start, range.end);
    }

    if (autoScroll) {
      followScriptRangeSmoothly(range);
      lastFollowedLineKey = `${range.start}:${range.end}`;
    } else if (`${range.start}:${range.end}` !== lastFollowedLineKey) {
      keepScriptRangeVisible(range);
      lastFollowedLineKey = `${range.start}:${range.end}`;
    }
  });
}

function hideReadingWordHighlight() {
  els.readingWordHighlight.hidden = true;
}

function getCurrentReadingLineRange() {
  const startRange = readableWordRanges[currentLineStartIndex];
  const endRange = readableWordRanges[currentLineEndIndex];

  if (!startRange || !endRange) {
    return null;
  }

  return {
    start: startRange.start,
    end: endRange.end,
    text: state.text.slice(startRange.start, endRange.end)
  };
}

function followScriptRangeSmoothly(range) {
  const rect = measureScriptRange(range.start, range.end);

  if (!rect) {
    return;
  }

  const targetTop = els.scriptText.clientHeight * 0.42;
  const delta = rect.top - targetTop;

  if (Math.abs(delta) < 18) {
    return;
  }

  els.scriptText.scrollTop += delta * 0.28;
}

function keepScriptRangeVisible(range) {
  const rect = measureScriptRange(range.start, range.end);

  if (!rect) {
    return;
  }

  const topLimit = els.scriptText.clientHeight * 0.22;
  const bottomLimit = els.scriptText.clientHeight * 0.74;

  if (rect.top < topLimit || rect.top > bottomLimit) {
    centerScriptPosition(range.start);
  }
}

function toggleCompactDirect() {
  isCompactDirect = !isCompactDirect;
  renderCompactDirectMode();
  renderReadingFollow();
}

function renderCompactDirectMode() {
  document.body.classList.toggle("compact-direct", isCompactDirect);
  els.compactDirectToggle.textContent = isCompactDirect ? "Editar guion" : "Panel directo";
  const parent = isCompactDirect ? document.querySelector(".compact-direct-panel") : previewHome;
  if (els.talentPreview.parentElement !== parent) {
    parent.prepend(els.talentPreview);
  }
}

function handleSearchKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "g") {
    event.preventDefault();
    navigateSearch(event.shiftKey ? -1 : 1);
  }

  if (event.key === "Escape") {
    event.preventDefault();
    clearSearch();
  }
}

function clearSearch() {
  els.scriptSearchInput.value = "";
  currentSearchMatch = -1;
  searchNeedsFocus = false;
  searchMatches = [];
  renderSearchControls();
  els.scriptSearchInput.focus();
}

function updateSearchMatches({ selectFirst = false, focusMatch = false } = {}) {
  const query = els.scriptSearchInput.value.trim();
  const previousMatch = searchMatches[currentSearchMatch]?.index ?? null;

  searchMatches = query ? findSearchMatches(state.text, query) : [];

  if (searchMatches.length === 0) {
    currentSearchMatch = -1;
    searchNeedsFocus = false;
    renderSearchControls();
    return;
  }

  if (selectFirst || currentSearchMatch < 0) {
    currentSearchMatch = 0;
    searchNeedsFocus = true;
  } else if (previousMatch !== null) {
    currentSearchMatch = searchMatches.findIndex((match) => match.index >= previousMatch);
    if (currentSearchMatch === -1) {
      currentSearchMatch = searchMatches.length - 1;
    }
  } else {
    currentSearchMatch = Math.min(currentSearchMatch, searchMatches.length - 1);
  }

  renderSearchControls();

  if (focusMatch) {
    focusCurrentSearchMatch();
  }
}

function findSearchMatches(text, query) {
  const matches = [];
  const normalizedText = text.toLocaleLowerCase();
  const normalizedQuery = query.toLocaleLowerCase();
  let index = normalizedText.indexOf(normalizedQuery);

  while (index !== -1) {
    matches.push({
      index,
      length: query.length
    });
    index = normalizedText.indexOf(normalizedQuery, index + Math.max(1, normalizedQuery.length));
  }

  return matches;
}

function navigateSearch(direction) {
  if (searchMatches.length === 0) {
    updateSearchMatches({ selectFirst: true, focusMatch: true });
    return;
  }

  if (searchNeedsFocus) {
    focusCurrentSearchMatch();
    return;
  }

  currentSearchMatch = (currentSearchMatch + direction + searchMatches.length) % searchMatches.length;
  renderSearchControls();
  focusCurrentSearchMatch();
}

function focusCurrentSearchMatch() {
  const match = searchMatches[currentSearchMatch];

  if (!match) {
    return;
  }

  focusScriptRange(match.index, match.index + match.length);
  searchNeedsFocus = false;
  setScriptStatus(`Coincidencia ${currentSearchMatch + 1} de ${searchMatches.length}`);
}

function renderSearchControls() {
  const hasQuery = els.scriptSearchInput.value.trim().length > 0;
  const hasMatches = searchMatches.length > 0;

  els.scriptSearchCount.textContent = hasMatches ? `${currentSearchMatch + 1}/${searchMatches.length}` : "0/0";
  els.scriptSearchPrev.disabled = !hasMatches;
  els.scriptSearchNext.disabled = !hasMatches;
  els.scriptSearchClear.disabled = !hasQuery;
}

function getSelectedSection() {
  const sectionIndex = Number(els.sectionSelect.value);

  if (!Number.isFinite(sectionIndex)) {
    return null;
  }

  return sections.find((section) => section.index === sectionIndex) || null;
}

function jumpToSelectedSectionInControl() {
  const section = getSelectedSection();

  if (!section) {
    return;
  }

  focusScriptPosition(section.sourceIndex || 0);
  setScriptStatus(`Control en sección: ${section.title}`);
}

function jumpToSelectedSectionInPrompter() {
  const section = getSelectedSection();

  if (!section) {
    return;
  }

  sendCommand({ type: "section", index: section.index });
}

function getSelectedMarkIndex() {
  const markIndex = Number(els.markSelect.value);

  if (!Number.isFinite(markIndex)) {
    return null;
  }

  return markIndex;
}

function jumpToSelectedMarkInControl() {
  const markIndex = getSelectedMarkIndex();

  if (markIndex === null) {
    return;
  }

  focusScriptPosition(markIndex);
  setScriptStatus("Control en marca");
}

function jumpToSelectedMarkInPrompter() {
  const markIndex = getSelectedMarkIndex();

  if (markIndex === null) {
    return;
  }

  sendCommand({ type: "cursor", index: markIndex });
}

function getAllSetupPresets() {
  return [...BUILT_IN_SETUP_PRESETS, ...setupPresets];
}

function getSelectedSetupPreset() {
  return getAllSetupPresets().find((preset) => preset.id === els.setupPresetSelect.value);
}

function applySelectedSetupPreset() {
  const preset = getSelectedSetupPreset();

  if (!preset) {
    return;
  }

  updateState(pickSetupSettings(preset.settings));
  setScriptStatus(`Preset aplicado: ${preset.name}`);
}

function saveCurrentSetupPreset() {
  const name = window.prompt("Nombre del preset de setup", "Nuevo preset");

  if (!name) {
    return;
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    return;
  }

  if (BUILT_IN_SETUP_PRESETS.some((preset) => preset.name.toLowerCase() === trimmedName.toLowerCase())) {
    setScriptStatus("Los presets base no se pueden sobrescribir");
    return;
  }

  const existingPreset = setupPresets.find((preset) => preset.name.toLowerCase() === trimmedName.toLowerCase());
  const savedPreset = {
    id: existingPreset?.id || `custom-${Date.now()}`,
    name: trimmedName,
    builtin: false,
    settings: pickSetupSettings(state)
  };

  setupPresets = [
    savedPreset,
    ...setupPresets.filter((preset) => preset.id !== savedPreset.id)
  ];

  saveSetupPresets();
  renderSetupPresets();
  els.setupPresetSelect.value = savedPreset.id;
  renderSetupPresetActions();
  setScriptStatus(`Preset guardado: ${savedPreset.name}`);
}

function deleteSelectedSetupPreset() {
  const preset = getSelectedSetupPreset();

  if (!preset || preset.builtin) {
    return;
  }

  setupPresets = setupPresets.filter((storedPreset) => storedPreset.id !== preset.id);
  saveSetupPresets();
  renderSetupPresets();
  setScriptStatus(`Preset borrado: ${preset.name}`);
}

function insertCameraCode() {
  const value = els.markupCameraValue.value.trim() || "1";
  insertMarkupAtCursor(`[CAM: ${value}]`);
}

function insertNoticeCode() {
  const value = els.markupNoticeValue.value.trim() || "Mira a cámara 2";
  insertMarkupAtCursor(`[AVISO: ${value}]`);
}

function insertMarkupAtCursor(markup) {
  if (!canEditScriptMarkup()) {
    return;
  }

  const start = els.scriptText.selectionStart || 0;
  const end = els.scriptText.selectionEnd || start;
  const nextText = `${state.text.slice(0, start)}${markup}${state.text.slice(end)}`;
  updateState({ text: nextText });
  focusScriptText(start + markup.length, start + markup.length);
  setScriptStatus("Código insertado");
}

function wrapSelectionWithHighlight() {
  if (!canEditScriptMarkup()) {
    return;
  }

  const start = els.scriptText.selectionStart || 0;
  const end = els.scriptText.selectionEnd || start;
  const selectedText = state.text.slice(start, end) || "palabra";
  const replacement = `==${selectedText}==`;
  const nextText = `${state.text.slice(0, start)}${replacement}${state.text.slice(end)}`;
  updateState({ text: nextText });
  focusScriptText(start + 2, start + 2 + selectedText.length);
  setScriptStatus("Resaltado insertado");
}

function insertOperatorNoteCode() {
  if (!canEditScriptMarkup()) {
    return;
  }

  const start = els.scriptText.selectionStart || 0;
  const end = els.scriptText.selectionEnd || start;
  const before = state.text.slice(0, start);
  const after = state.text.slice(end);
  const prefix = before && !before.endsWith("\n\n") ? before.endsWith("\n") ? "\n" : "\n\n" : "";
  const suffix = after && !after.startsWith("\n\n") ? after.startsWith("\n") ? "\n" : "\n\n" : "";
  const markup = `${prefix}// Nota interna${suffix}`;
  const nextText = `${before}${markup}${after}`;
  const noteStart = start + prefix.length + 3;

  updateState({ text: nextText });
  focusScriptText(noteStart, noteStart + "Nota interna".length);
  setScriptStatus("Nota interna insertada");
}

function focusScriptText(selectionStart, selectionEnd) {
  els.scriptText.focus();
  els.scriptText.setSelectionRange(selectionStart, selectionEnd);
}

function focusScriptRange(selectionStart, selectionEnd) {
  els.scriptText.focus({ preventScroll: true });
  els.scriptText.setSelectionRange(selectionStart, selectionEnd);
  requestAnimationFrame(() => centerScriptPosition(selectionStart));
}

function focusScriptPosition(index) {
  const position = Math.max(0, Math.min(state.text.length, Number(index) || 0));
  els.scriptText.focus({ preventScroll: true });
  els.scriptText.setSelectionRange(position, position);
  requestAnimationFrame(() => centerScriptPosition(position));
}

function centerScriptPosition(position) {
  const caretTop = measureScriptPosition(position);
  const targetTop = caretTop - els.scriptText.clientHeight * 0.5;
  const maxTop = Math.max(0, els.scriptText.scrollHeight - els.scriptText.clientHeight);
  els.scriptText.scrollTop = Math.max(0, Math.min(maxTop, targetTop));
}

function measureScriptPosition(position) {
  const rect = measureScriptRange(position, position + 1);
  return rect ? rect.top + els.scriptText.scrollTop : 0;
}

function measureScriptRange(start, end) {
  const textarea = els.scriptText;
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  const marker = document.createElement("span");
  const copiedProperties = [
    "boxSizing",
    "width",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "letterSpacing",
    "lineHeight",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth"
  ];

  copiedProperties.forEach((property) => {
    mirror.style[property] = style[property];
  });

  mirror.style.position = "absolute";
  mirror.style.left = "-9999px";
  mirror.style.top = "0";
  mirror.style.height = "auto";
  mirror.style.minHeight = "0";
  mirror.style.overflow = "hidden";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";
  mirror.style.wordBreak = "break-word";
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.textContent = textarea.value.slice(0, start);
  marker.textContent = textarea.value.slice(start, Math.max(start + 1, end)) || ".";
  mirror.append(marker);
  document.body.append(mirror);

  const rect = {
    left: marker.offsetLeft - textarea.scrollLeft,
    top: marker.offsetTop - textarea.scrollTop,
    width: marker.offsetWidth,
    height: marker.offsetHeight || parseFloat(style.lineHeight) || 24
  };
  mirror.remove();
  return rect;
}

function canEditScriptMarkup() {
  if (state.operatorMode === "live") {
    setScriptStatus("Modo Directo: cambia a Ensayo para insertar códigos");
    return false;
  }

  return true;
}

function renderMarkupTools(report = analyzeScriptMarkup(state.text)) {
  if (!els.markupValidationSummary || !els.markupValidationList) {
    return;
  }

  els.markupValidationSummary.textContent = formatMarkupSummary(report);
  els.markupValidationList.replaceChildren();

  report.warnings.forEach((warning) => {
    const item = document.createElement("li");
    item.textContent = warning;
    els.markupValidationList.append(item);
  });
}

function scheduleCursorFollow() {
  if (!state.followCursor || document.activeElement !== els.scriptText) {
    return;
  }

  if (cursorSyncFrame) {
    cancelAnimationFrame(cursorSyncFrame);
  }

  cursorSyncFrame = requestAnimationFrame(() => {
    cursorSyncFrame = 0;
    followEditorCursor();
  });
}

function requestScriptMutation(actionLabel) {
  if (state.operatorMode === "live") {
    setScriptStatus("Modo Directo: cambia a Ensayo para modificar el guion");
    return false;
  }

  if (!state.text.trim()) {
    return true;
  }

  return window.confirm(`Vas a ${actionLabel} y se modificará el guion actual. ¿Continuar?`);
}

function followEditorCursor() {
  if (!state.followCursor || !isPrompterOpen) {
    return;
  }

  sendCommand({
    type: "cursor",
    index: els.scriptText.selectionStart || 0
  });
}

function loadState() {
  try {
    const storedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const nextState = { ...DEFAULT_STATE, ...storedState };
    delete nextState.topPadding;
    const originalSpeed = nextState.speed;
    nextState.speed = normalizeSpeed(nextState.speed);
    nextState.operatorMode = nextState.operatorMode === "live" ? "live" : "rehearsal";
    nextState.followCursor = Boolean(nextState.followCursor);
    nextState.currentWordHighlight = Boolean(nextState.currentWordHighlight);
    if (isLegacyDefaultText(nextState.text) || nextState.text === PLAIN_QUIJOTE_DEFAULT_TEXT) {
      nextState.text = DEFAULT_TEXT;
    }
    if (nextState.text !== storedState?.text || nextState.speed !== originalSpeed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    }
    return nextState;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function isLegacyDefaultText(text) {
  return (
    typeof text === "string" &&
    (text === OLD_DEFAULT_TEXT || text.trim().startsWith("Este es un guion de prueba para el teleprompter."))
  );
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadRecentFiles() {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
  } catch {
    return [];
  }
}

function loadSetupPresets() {
  try {
    const presets = JSON.parse(localStorage.getItem(SETUP_PRESETS_KEY)) || [];
    return presets
      .filter((preset) => preset?.id && preset?.name && preset?.settings)
      .map((preset) => ({
        id: String(preset.id),
        name: String(preset.name),
        builtin: false,
        settings: pickSetupSettings({ ...DEFAULT_STATE, ...preset.settings })
      }));
  } catch {
    return [];
  }
}

function addRecentFile(file) {
  if (!file?.path) {
    return;
  }

  recentFiles = [
    {
      name: file.name,
      path: file.path,
      extension: file.extension || "",
      lastOpenedAt: new Date().toISOString()
    },
    ...recentFiles.filter((recentFile) => recentFile.path !== file.path)
  ].slice(0, MAX_RECENTS);

  saveRecentFiles();
  renderRecentFiles();
}

function saveRecentFiles() {
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recentFiles));
}

function saveSetupPresets() {
  localStorage.setItem(SETUP_PRESETS_KEY, JSON.stringify(setupPresets));
}

function pickSetupSettings(source) {
  return SETUP_KEYS.reduce((settings, key) => {
    settings[key] = source[key];
    return settings;
  }, {});
}

function setScriptStatus(message) {
  els.scriptStatus.textContent = message;
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

function formatVerticalPosition(value) {
  if (value === 0) {
    return "Centro";
  }

  return value < 0 ? `${value} subir` : `+${value} bajar`;
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function getEstimatedDurationSeconds(text, speed) {
  const wordsPerSecond = normalizeSpeed(speed);
  return wordsPerSecond > 0 ? getWordCount(text) / wordsPerSecond : 0;
}

function getWordCount(text) {
  const words = String(text || "").match(/[\p{L}\p{N}]+(?:['’´-][\p{L}\p{N}]+)*/gu);
  return words ? words.length : 0;
}

function getReadableScriptText(text) {
  return normalizeLineEndings(text)
    .split("\n")
    .filter((line) => {
      return !/^\s*\/\//u.test(line);
    })
    .join("\n")
    .replace(/\[(CAM|AVISO):\s*[^\]]+?\]/giu, "")
    .replace(/\[(FIN AVISO|SIN AVISO|LIMPIAR AVISO|CLEAR)\]/giu, "")
    .replace(/==(.+?)==/gu, "$1");
}

function getReadableWordRanges(text) {
  const normalizedText = normalizeLineEndings(text);
  const excludedRanges = [];
  const wordRanges = [];
  const linePattern = /^.*(?:\n|$)/gmu;
  let lineMatch;

  while ((lineMatch = linePattern.exec(normalizedText)) !== null) {
    const line = lineMatch[0];

    if (!line) {
      break;
    }

    if (/^\s*\/\//u.test(line)) {
      excludedRanges.push([lineMatch.index, lineMatch.index + line.length]);
    }
  }

  for (const match of normalizedText.matchAll(/\[(CAM|AVISO):\s*[^\]]+?\]|\[(FIN AVISO|SIN AVISO|LIMPIAR AVISO|CLEAR)\]/giu)) {
    excludedRanges.push([match.index, match.index + match[0].length]);
  }

  for (const match of normalizedText.matchAll(/[\p{L}\p{N}]+(?:['’´-][\p{L}\p{N}]+)*/gu)) {
    const start = match.index;
    const end = start + match[0].length;

    if (excludedRanges.some(([rangeStart, rangeEnd]) => start >= rangeStart && start < rangeEnd)) {
      continue;
    }

    wordRanges.push({
      start,
      end,
      text: match[0]
    });
  }

  return wordRanges;
}

function analyzeScriptMarkup(text) {
  const normalizedText = normalizeLineEndings(text);
  const cameraMatches = normalizedText.match(/\[CAM:\s*[^\]]+?\]/giu) || [];
  const noticeMatches = normalizedText.match(/\[AVISO:\s*[^\]]+?\]/giu) || [];
  const endCueMatches = normalizedText.match(/\[(FIN AVISO|SIN AVISO|LIMPIAR AVISO|CLEAR)\]/giu) || [];
  const highlightMatches = normalizedText.match(/==(.+?)==/gu) || [];
  const commentMatches = normalizedText.match(/^\s*\/\/.*$/gmu) || [];
  const warnings = [];

  if ((normalizedText.match(/==/gu) || []).length % 2 !== 0) {
    warnings.push("Hay un resaltado sin cerrar con ==");
  }

  if (/\[(CAM|AVISO):\s*\]/iu.test(normalizedText)) {
    warnings.push("Hay una marca CAM/AVISO vacía");
  }

  if (/\[(CAM|AVISO):[^\]\n]*$/imu.test(normalizedText)) {
    warnings.push("Hay una marca CAM/AVISO sin cerrar con ]");
  }

  const cueEvents = [...normalizedText.matchAll(/\[(CAM|AVISO):\s*([^\]]+?)\]|\[(FIN AVISO|SIN AVISO|LIMPIAR AVISO|CLEAR)\]/giu)];
  const cueOpenAtEnd =
    cueEvents.length > 0 &&
    !cueEvents.at(-1)[3];

  if (cueOpenAtEnd) {
    warnings.push("La última indicación flotante queda activa hasta el final");
  }

  return {
    cameras: cameraMatches.length,
    notices: noticeMatches.length,
    endCues: endCueMatches.length,
    highlights: highlightMatches.length,
    comments: commentMatches.length,
    warnings
  };
}

function formatMarkupSummary(report) {
  const total = report.cameras + report.notices + report.endCues + report.highlights + report.comments;

  if (total === 0) {
    return "0 marcas";
  }

  const parts = [];

  if (report.cameras > 0) {
    parts.push(`${report.cameras} cam`);
  }
  if (report.notices > 0) {
    parts.push(`${report.notices} aviso`);
  }
  if (report.highlights > 0) {
    parts.push(`${report.highlights} resalte`);
  }
  if (report.comments > 0) {
    parts.push(`${report.comments} nota`);
  }
  if (report.endCues > 0) {
    parts.push(`${report.endCues} fin`);
  }

  return parts.join(" · ");
}

function extractSections(text) {
  const sections = [];
  const normalizedText = normalizeLineEndings(text);
  const sectionPattern = /(^|\n)\s{0,3}#{1,3}\s+(.+?)\s*(?=\n|$)/gu;
  let index = 0;
  let match;

  while ((match = sectionPattern.exec(normalizedText)) !== null) {
    sections.push({
      index,
      sourceIndex: match.index + (match[1] ? 1 : 0),
      title: match[2].trim()
    });
    index += 1;
  }

  return sections;
}

function extractScriptMarks(text) {
  const normalizedText = normalizeLineEndings(text);
  const marks = [];
  const addMatches = (pattern, getLabel) => {
    for (const match of normalizedText.matchAll(pattern)) {
      marks.push({
        index: match.index,
        label: getLabel(match)
      });
    }
  };

  addMatches(/\[CAM:\s*([^\]]+?)\]/giu, (match) => `CAM ${truncateMarkLabel(match[1])}`);
  addMatches(/\[AVISO:\s*([^\]]+?)\]/giu, (match) => `AVISO: ${truncateMarkLabel(match[1])}`);
  addMatches(/\[(FIN AVISO|SIN AVISO|LIMPIAR AVISO|CLEAR)\]/giu, () => "FIN AVISO");
  addMatches(/==(.+?)==/gu, (match) => `RESALTE: ${truncateMarkLabel(match[1])}`);
  addMatches(/^\s*\/\/\s*(.*)$/gmu, (match) => `NOTA: ${truncateMarkLabel(match[1] || "Nota interna")}`);

  return marks.sort((a, b) => a.index - b.index);
}

function truncateMarkLabel(value) {
  const label = String(value || "").trim().replace(/\s+/g, " ");
  return label.length > 44 ? `${label.slice(0, 43)}…` : label;
}

function formatSpeed(speed) {
  return `${normalizeSpeed(speed).toFixed(1)} palabras/s`;
}

function normalizeSpeed(speed) {
  const numericSpeed = Number(speed) || DEFAULT_STATE.speed;
  const migratedSpeed = numericSpeed > 10 ? numericSpeed / 32 : numericSpeed;
  return Math.round(Math.max(0.5, Math.min(4.5, migratedSpeed)) * 10) / 10;
}

function changeSpeed(delta) {
  updateState({ speed: normalizeSpeed(state.speed + delta) });
}

function prepareImportedText(text, extension) {
  const normalizedText = normalizeLineEndings(text);
  const subtitleExtensions = ["srt", "vtt"];

  if (subtitleExtensions.includes(extension)) {
    return cleanScriptText(cleanSubtitleText(normalizedText));
  }

  if (DOCUMENT_EXTENSIONS.includes(extension)) {
    return cleanImportedDocumentText(normalizedText);
  }

  return normalizedText.replace(/^\uFEFF/, "");
}

function cleanImportedDocumentText(text) {
  const withoutHeavyMarkdown = normalizeLineEndings(text)
    .replace(/\f/g, "\n\n")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .split("\n")
    .map((line) => cleanImportedDocumentLine(line))
    .join("\n")
    .replace(/\n(#{1,3}\s+)/g, "\n\n$1")
    .replace(/(#{1,3}\s+[^\n]+)\n(?!\n)/g, "$1\n\n");

  return cleanScriptText(withoutHeavyMarkdown);
}

function cleanImportedDocumentLine(line) {
  const trimmedLine = line.trim();
  const heading = trimmedLine.match(/^(#{1,6})\s+(.+)$/u);

  if (heading) {
    return `${heading[1].slice(0, 3)} ${stripInlineMarkdown(heading[2])}`;
  }

  return stripInlineMarkdown(trimmedLine)
    .replace(/^[-*+]\s+/u, "")
    .replace(/^\d+[.)]\s+/u, "");
}

function stripInlineMarkdown(text) {
  return text
    .replace(/[*_`~]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanScriptText(text) {
  const cleanedParagraphs = [];

  normalizeLineEndings(text)
    .replace(/\u00a0/g, " ")
    .split(/\n{2,}/)
    .forEach((paragraph) => {
      const pendingLines = [];

      paragraph
        .split("\n")
        .map((line) => line.trim().replace(/[ \t]{2,}/g, " "))
        .filter(Boolean)
        .forEach((line) => {
          if (isProtectedScriptLine(line)) {
            flushPendingLines(pendingLines, cleanedParagraphs);
            cleanedParagraphs.push(line);
            return;
          }

          pendingLines.push(line);
        });

      flushPendingLines(pendingLines, cleanedParagraphs);
    });

  return cleanedParagraphs
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function flushPendingLines(pendingLines, output) {
  if (pendingLines.length === 0) {
    return;
  }

  output.push(pendingLines.join(" "));
  pendingLines.length = 0;
}

function isProtectedScriptLine(line) {
  return (
    /^\s*\/\//u.test(line) ||
    /^\s{0,3}#{1,3}\s+.+/u.test(line) ||
    /^\[(CAM|AVISO):\s*[^\]]+?\]$/iu.test(line) ||
    /^\[(FIN AVISO|SIN AVISO|LIMPIAR AVISO|CLEAR)\]$/iu.test(line)
  );
}

function cleanSubtitleText(text) {
  return normalizeLineEndings(text)
    .split("\n")
    .filter((line) => {
      const trimmedLine = line.trim();
      return (
        trimmedLine &&
        trimmedLine !== "WEBVTT" &&
        !trimmedLine.startsWith("NOTE") &&
        !/^\d+$/.test(trimmedLine) &&
        !/-->/u.test(trimmedLine)
      );
    })
    .join("\n\n");
}

function normalizeLineEndings(text) {
  return (text || "").replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "");
}
