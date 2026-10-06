const { app, BrowserWindow, dialog, ipcMain, screen } = require("electron");
const fs = require("fs/promises");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const path = require("path");

let controlWindow;
let prompterWindow;
let previewCapture;
const TEXT_EXTENSIONS = ["txt", "md", "markdown", "srt", "vtt", "csv"];
const DOCUMENT_EXTENSIONS = ["docx", "pdf"];

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 820,
    minHeight: 560,
    title: "DoTwo Teleprompter Control",
    backgroundColor: "#101216",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  controlWindow.loadFile(path.join(__dirname, "control.html"));

  controlWindow.on("closed", () => {
    controlWindow = null;
    if (prompterWindow) {
      prompterWindow.close();
    }
  });
}

function getDisplays() {
  return screen.getAllDisplays().map((display, index) => ({
    id: display.id,
    index,
    label: index === 0 ? "Pantalla principal" : `Pantalla ${index + 1}`,
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor,
    size: display.size
  }));
}

async function openTextFile() {
  const result = await dialog.showOpenDialog(controlWindow, {
    title: "Cargar guion",
    properties: ["openFile"],
    filters: [
      { name: "Guiones y documentos", extensions: [...TEXT_EXTENSIONS, ...DOCUMENT_EXTENSIONS] },
      { name: "Texto", extensions: TEXT_EXTENSIONS },
      { name: "Word y PDF", extensions: DOCUMENT_EXTENSIONS },
      { name: "Todos los archivos", extensions: ["*"] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  return readScriptFile(filePath);
}

async function readTextFile(filePath) {
  return readScriptFile(filePath);
}

async function readScriptFile(filePath) {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  const text = await extractScriptText(filePath, extension);

  return {
    canceled: false,
    name: path.basename(filePath),
    path: filePath,
    extension,
    text: text.value.replace(/^\uFEFF/, ""),
    warning: text.warning || ""
  };
}

async function extractScriptText(filePath, extension) {
  if (extension === "docx") {
    return extractDocxMarkdown(filePath);
  }

  if (extension === "pdf") {
    return extractPdfText(filePath);
  }

  const text = await fs.readFile(filePath, "utf8");

  return {
    value: text
  };
}

async function extractDocxMarkdown(filePath) {
  const result = await mammoth.convertToMarkdown({ path: filePath });
  const warning = result.messages?.length ? "Word importado con avisos de formato" : "";

  return {
    value: result.value || "",
    warning
  };
}

async function extractPdfText(filePath) {
  const buffer = await fs.readFile(filePath);
  const result = await pdfParse(buffer);
  const value = result.text || "";
  const warning = value.trim()
    ? ""
    : "PDF sin texto seleccionable. Puede ser escaneado y requerir OCR.";

  return {
    value,
    warning
  };
}

async function saveTextFile({ text }) {
  const result = await dialog.showSaveDialog(controlWindow, {
    title: "Guardar guion",
    defaultPath: "guion.txt",
    filters: [
      { name: "Texto", extensions: ["txt"] },
      { name: "Markdown", extensions: ["md"] }
    ]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await fs.writeFile(result.filePath, text || "", "utf8");

  return {
    canceled: false,
    name: path.basename(result.filePath),
    path: result.filePath
  };
}

async function saveSessionFile(session) {
  const result = await dialog.showSaveDialog(controlWindow, {
    title: "Guardar sesión",
    defaultPath: "sesion-teleprompter.teleprompter.json",
    filters: [
      { name: "Sesión Teleprompter", extensions: ["json"] }
    ]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await fs.writeFile(result.filePath, JSON.stringify(session, null, 2), "utf8");

  return {
    canceled: false,
    name: path.basename(result.filePath),
    path: result.filePath
  };
}

async function openSessionFile() {
  const result = await dialog.showOpenDialog(controlWindow, {
    title: "Abrir sesión",
    properties: ["openFile"],
    filters: [
      { name: "Sesiones Teleprompter", extensions: ["json"] },
      { name: "Todos los archivos", extensions: ["*"] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  const rawSession = await fs.readFile(filePath, "utf8");

  return {
    canceled: false,
    name: path.basename(filePath),
    path: filePath,
    session: JSON.parse(rawSession)
  };
}

async function createPrompterWindow(displayId) {
  const displays = screen.getAllDisplays();
  const targetDisplay = displays.find((display) => display.id === Number(displayId)) || displays[0];
  const { x, y, width, height } = targetDisplay.bounds;
  const displayMode = { singleDisplay: displays.length === 1 };

  if (prompterWindow) {
    prompterWindow.setBounds({ x, y, width, height });
    prompterWindow.setFullScreen(true);
    prompterWindow.focus();
    prompterWindow.webContents.send("prompter:display-mode", displayMode);
    return true;
  }

  prompterWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    fullscreen: true,
    title: "DoTwo Teleprompter",
    backgroundColor: "#050507",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  prompterWindow.on("closed", () => {
    prompterWindow = null;
    if (controlWindow) {
      controlWindow.webContents.send("prompter:closed");
    }
  });

  await prompterWindow.loadFile(path.join(__dirname, "prompter.html"));
  prompterWindow.webContents.send("prompter:display-mode", displayMode);
  return true;
}

async function capturePrompterPreview() {
  const target = prompterWindow;
  if (!target || target.isDestroyed()) {
    return { status: "closed" };
  }
  if (!controlWindow.isVisible() || controlWindow.isMinimized()) {
    return { status: "idle" };
  }
  if (target.webContents.isLoadingMainFrame()) {
    return { status: "loading" };
  }
  if (previewCapture) {
    return previewCapture;
  }

  // Share one capture and discard frames from a window closed during capture.
  previewCapture = (async () => {
    try {
      const image = await target.webContents.capturePage(undefined, { stayHidden: true });
      if (target !== prompterWindow || target.isDestroyed()) {
        return { status: "closed" };
      }
      if (image.isEmpty()) {
        return { status: "unavailable" };
      }
      const { width, height } = image.getSize();
      return {
        status: "ready",
        frame: image.resize({ width: Math.min(width, 640), quality: "good" }).toDataURL(),
        width,
        height
      };
    } catch {
      return { status: "unavailable" };
    }
  })();

  try {
    return await previewCapture;
  } finally {
    previewCapture = null;
  }
}

app.whenReady().then(() => {
  createControlWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createControlWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("screens:list", () => getDisplays());

ipcMain.handle("file:open-text", () => openTextFile());
ipcMain.handle("file:read-text", (_event, filePath) => readTextFile(filePath));
ipcMain.handle("file:save-text", (_event, payload) => saveTextFile(payload));
ipcMain.handle("session:save", (_event, session) => saveSessionFile(session));
ipcMain.handle("session:open", () => openSessionFile());

ipcMain.handle("prompter:open", (_event, displayId) => {
  return createPrompterWindow(displayId);
});

ipcMain.handle("prompter:close", () => {
  if (prompterWindow) {
    prompterWindow.close();
  }
  return true;
});

ipcMain.handle("prompter:preview", (event) => {
  if (!controlWindow || event.sender !== controlWindow.webContents) {
    return { status: "unavailable" };
  }
  return capturePrompterPreview();
});

ipcMain.on("prompter:set-state", (_event, state) => {
  if (prompterWindow) {
    prompterWindow.webContents.send("prompter:state", state);
  }
});

ipcMain.on("prompter:command", (_event, command) => {
  if (prompterWindow) {
    prompterWindow.webContents.send("prompter:command", command);
  }
});

ipcMain.on("prompter:runtime", (_event, runtime) => {
  if (controlWindow) {
    controlWindow.webContents.send("prompter:runtime", runtime);
  }
});
