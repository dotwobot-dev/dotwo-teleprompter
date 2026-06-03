const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("teleprompter", {
  listScreens: () => ipcRenderer.invoke("screens:list"),
  openTextFile: () => ipcRenderer.invoke("file:open-text"),
  readTextFile: (filePath) => ipcRenderer.invoke("file:read-text", filePath),
  saveTextFile: (payload) => ipcRenderer.invoke("file:save-text", payload),
  saveSession: (session) => ipcRenderer.invoke("session:save", session),
  openSession: () => ipcRenderer.invoke("session:open"),
  openPrompter: (displayId) => ipcRenderer.invoke("prompter:open", displayId),
  closePrompter: () => ipcRenderer.invoke("prompter:close"),
  setState: (state) => ipcRenderer.send("prompter:set-state", state),
  sendCommand: (command) => ipcRenderer.send("prompter:command", command),
  sendRuntime: (runtime) => ipcRenderer.send("prompter:runtime", runtime),
  onState: (callback) => {
    ipcRenderer.on("prompter:state", (_event, state) => callback(state));
  },
  onCommand: (callback) => {
    ipcRenderer.on("prompter:command", (_event, command) => callback(command));
  },
  onDisplayMode: (callback) => {
    ipcRenderer.on("prompter:display-mode", (_event, mode) => callback(mode));
  },
  onRuntime: (callback) => {
    ipcRenderer.on("prompter:runtime", (_event, runtime) => callback(runtime));
  },
  onClosed: (callback) => {
    ipcRenderer.on("prompter:closed", callback);
  }
});
