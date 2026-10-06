const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const mainSource = readFileSync(path.join(__dirname, "../src/main.js"), "utf8");

function createHarness() {
  const handlers = new Map();
  const windows = [];
  const image = {
    isEmpty: () => false,
    getSize: () => ({ width: 1920, height: 1080 }),
    resize(options) {
      this.resizeOptions = options;
      return { toDataURL: () => "data:image/png;base64,frame" };
    }
  };

  class Window {
    constructor() {
      this.events = new Map();
      this.destroyed = false;
      this.visible = true;
      this.minimized = false;
      this.captures = 0;
      this.webContents = {
        send() {},
        isLoadingMainFrame: () => false,
        capturePage: async (...args) => {
          this.captures += 1;
          this.captureArgs = args;
          return this.capture ? this.capture() : image;
        }
      };
      windows.push(this);
    }

    on(event, callback) { this.events.set(event, callback); }
    async loadFile() {}
    setBounds() {}
    setFullScreen() {}
    focus() {}
    isDestroyed() { return this.destroyed; }
    isVisible() { return this.visible; }
    isMinimized() { return this.minimized; }
    close() {
      this.destroyed = true;
      this.events.get("closed")?.();
    }
  }

  const electron = {
    app: { whenReady: () => ({ then() {} }), on() {} },
    BrowserWindow: Window,
    ipcMain: { handle: (name, handler) => handlers.set(name, handler), on() {} },
    screen: { getAllDisplays: () => [{ id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 } }] }
  };
  const context = vm.createContext({
    __dirname: path.join(__dirname, "../src"),
    process,
    require: (name) => name === "electron" ? electron
      : ["mammoth", "pdf-parse"].includes(name) ? {} : require(name)
  });
  vm.runInContext(mainSource, context);
  context.createControlWindow();

  return {
    control: windows[0],
    image,
    open: async () => {
      await context.createPrompterWindow(1);
      return windows[windows.length - 1];
    },
    preview: (sender = windows[0].webContents) => handlers.get("prompter:preview")({ sender })
  };
}

test("only Control can request frames; a closed prompter has no frame", async () => {
  const harness = createHarness();
  assert.equal((await harness.preview()).status, "closed");
  const talent = await harness.open();
  assert.equal((await harness.preview(talent.webContents)).status, "unavailable");
  assert.equal(talent.captures, 0);
});

test("captures the complete talent viewport at thumbnail resolution", async () => {
  const harness = createHarness();
  const talent = await harness.open();
  const result = await harness.preview();
  assert.equal(result.status, "ready");
  assert.equal(result.width, 1920);
  assert.equal(result.height, 1080);
  assert.equal(result.frame, "data:image/png;base64,frame");
  assert.equal(talent.captureArgs[0], undefined);
  assert.equal(talent.captureArgs[1].stayHidden, true);
  assert.equal(harness.image.resizeOptions.width, 640);
  harness.image.getSize = () => ({ width: 320, height: 480 });
  await harness.preview();
  assert.equal(harness.image.resizeOptions.width, 320);
});

test("shares in-flight captures and discards a frame from a closed window", async () => {
  const harness = createHarness();
  const talent = await harness.open();
  let resolve;
  talent.capture = () => new Promise((done) => { resolve = done; });
  const first = harness.preview();
  const second = harness.preview();
  assert.equal(talent.captures, 1);
  talent.close();
  const reopened = await harness.open();
  resolve(harness.image);
  assert.equal((await first).status, "closed");
  assert.equal((await second).status, "closed");
  assert.equal((await harness.preview()).status, "ready");
  assert.equal(reopened.captures, 1);
});

test("recovers from failed and empty captures", async () => {
  const harness = createHarness();
  const talent = await harness.open();
  talent.capture = () => { throw new Error("Display surface unavailable"); };
  assert.equal((await harness.preview()).status, "unavailable");
  talent.capture = () => ({ isEmpty: () => true });
  assert.equal((await harness.preview()).status, "unavailable");
  talent.capture = () => harness.image;
  assert.equal((await harness.preview()).status, "ready");
});

test("does not capture while Control is hidden/minimized or the prompter is loading", async () => {
  const harness = createHarness();
  const talent = await harness.open();
  harness.control.visible = false;
  assert.equal((await harness.preview()).status, "idle");
  harness.control.visible = true;
  harness.control.minimized = true;
  assert.equal((await harness.preview()).status, "idle");
  harness.control.minimized = false;
  talent.webContents.isLoadingMainFrame = () => true;
  assert.equal((await harness.preview()).status, "loading");
  assert.equal(talent.captures, 0);
});
