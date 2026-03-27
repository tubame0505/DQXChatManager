/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("myAPI", {
    update: (count: number) => ipcRenderer.send("update-title", count),
    login: (profile: string) => ipcRenderer.send("login", profile),
    export: () => ipcRenderer.send("export"),
    import: (emote: string) => ipcRenderer.send("import", emote),
    onReceiveMessage: (listener: (target: string, message: string) => void) => {
        ipcRenderer.on(
            "send_message",
            (event: IpcRendererEvent, target: string, message: string) => {
                listener(target, message);
            }
        );
        return () => ipcRenderer.removeAllListeners("send_message");
    },
    // コンテキストメニュー関連のAPI
    showContextMenu: (data: {
        targetId: string;
        selectedText: string;
        hasSelection: boolean;
        isReadOnly: boolean;
        hasClipboardText: boolean;
    }) => ipcRenderer.send("show-context-menu", data),
    // クリップボード操作API
    clipboardCut: (targetId: string, selectedText: string) =>
        ipcRenderer.send("clipboard-cut", targetId, selectedText),
    clipboardCopy: (selectedText: string) =>
        ipcRenderer.send("clipboard-copy", selectedText),
    clipboardPaste: (targetId: string) =>
        ipcRenderer.invoke("clipboard-paste", targetId),
    textDelete: (targetId: string) => ipcRenderer.send("text-delete", targetId),
    textSelectAll: (targetId: string) =>
        ipcRenderer.send("text-select-all", targetId),
});
