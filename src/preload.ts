/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("myAPI", {
    update: (count: number) => ipcRenderer.send("update-title", count),
    login: () => ipcRenderer.send("login"),
    export: () => ipcRenderer.send("export"),
    import: (emote: string) => ipcRenderer.send("import", emote),
    onReceiveMessage: (listener: (target: string, message: string) => void) => {
        ipcRenderer.on(
            "send_message",
            (event: IpcRendererEvent, target: string, message: string) =>
                listener(target, message)
        );
        return () => {
            ipcRenderer.removeAllListeners("send_message");
        };
    },
});
