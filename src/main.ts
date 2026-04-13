/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import path from "path";
import { BrowserWindow, app, ipcMain, clipboard, Menu } from "electron";
import { DriverDownloader } from "./driver_downloader";
import { DqxHiroba } from "./dqx-hiroba";
import { ElectronLogger } from "./utils/logger";
import { SecurityError } from "./security/security-validator";

const isDev = process.env.NODE_ENV === "development";
let dqxHiroba: DqxHiroba | undefined;
let logger: ElectronLogger | undefined;

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true, // セキュリティ強化
            nodeIntegration: false, // セキュリティ強化
        },
    });

    logger = new ElectronLogger(mainWindow);
    dqxHiroba = new DqxHiroba(mainWindow);

    mainWindow.setMenu(null);

    mainWindow.on("close", (event) => {
        logger?.info("アプリケーション終了中...");
        if (dqxHiroba) {
            dqxHiroba.dispose();
        }
    });

    // IPCハンドラーの設定
    setupIpcHandlers();

    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: "detach" });
        logger.info("開発モードで起動しました");
    }

    mainWindow.loadFile("dist/index.html");
};

const logAsyncIpcError = (action: string, error: unknown) => {
    if (!logger) {
        return;
    }

    const errorMessage =
        error instanceof Error
            ? error.message
            : String(error ?? "unknown error");
    logger.error(`IPC ${action}処理でエラーが発生しました: ${errorMessage}`);
};

const setupIpcHandlers = () => {
    ipcMain.on("login", async (_e, profile: string) => {
        if (!dqxHiroba || !logger) return;

        try {
            const downloader = new DriverDownloader(logger);

            const edgeVersion = await downloader.getBrowserVersion();
            if (!edgeVersion) {
                logger.error("Edgeバージョンの取得に失敗しました");
                return;
            }

            if (!downloader.isDriverInstalled(__dirname, edgeVersion)) {
                logger.info("Edgeドライバーをインストール中...");
            }

            const driverResult = await downloader.getDriver(
                __dirname,
                edgeVersion
            );

            if (driverResult.path) {
                await dqxHiroba.login(driverResult.path, profile);
            } else {
                logger.error(
                    `Edgeドライバーのインストールに失敗: ${driverResult.error}`
                );
            }
        } catch (error) {
            if (error instanceof SecurityError) {
                logger.error("セキュリティエラーが発生しました", error);
            } else {
                logger.error(
                    "予期しないエラーが発生しました",
                    error instanceof Error ? error : undefined
                );
            }
        }
    });

    ipcMain.on("export", (_e) => {
        if (dqxHiroba) {
            void dqxHiroba.exportEmote().catch((error) => {
                logAsyncIpcError("export", error);
            });
        }
    });

    ipcMain.on("import", (_e, emote: string) => {
        if (dqxHiroba && logger) {
            if (!emote || emote.trim() === "") {
                logger.warn("空のエモートデータが指定されました");
                return;
            }
            void dqxHiroba.importEmote(emote).catch((error) => {
                logAsyncIpcError("import", error);
            });
        }
    });

    // コンテキストメニュー関連のIPCハンドラー
    ipcMain.on(
        "show-context-menu",
        (
            event,
            data: {
                targetId: string;
                selectedText: string;
                hasSelection: boolean;
                isReadOnly: boolean;
                hasClipboardText: boolean;
            }
        ) => {
            showContextMenu(event.sender, data);
        }
    );

    // クリップボード操作のIPCハンドラー
    ipcMain.on(
        "clipboard-cut",
        (event, targetId: string, selectedText: string) => {
            clipboard.writeText(selectedText);
            event.sender.send("send_message", "execute-cut", targetId);
        }
    );

    ipcMain.on("clipboard-copy", (event, selectedText: string) => {
        clipboard.writeText(selectedText);
    });

    ipcMain.handle("clipboard-paste", async (event, targetId: string) => {
        const clipboardText = clipboard.readText();
        return { targetId, text: clipboardText };
    });

    ipcMain.on("text-delete", (event, targetId: string) => {
        event.sender.send("send_message", "execute-delete", targetId);
    });

    ipcMain.on("text-select-all", (event, targetId: string) => {
        event.sender.send("send_message", "execute-select-all", targetId);
    });
};

// コンテキストメニューを表示する関数
const showContextMenu = (
    sender: Electron.WebContents,
    data: {
        targetId: string;
        selectedText: string;
        hasSelection: boolean;
        isReadOnly: boolean;
        hasClipboardText: boolean;
    }
) => {
    const menuTemplate: Electron.MenuItemConstructorOptions[] = [];

    if (!data.isReadOnly) {
        // 編集可能な場合の完全メニュー
        menuTemplate.push(
            {
                label: "切り取り",
                enabled: data.hasSelection,
                click: () => {
                    sender.send(
                        "send_message",
                        "menu-action",
                        JSON.stringify({
                            action: "cut",
                            targetId: data.targetId,
                        })
                    );
                },
            },
            {
                label: "コピー",
                enabled: data.hasSelection,
                click: () => {
                    sender.send(
                        "send_message",
                        "menu-action",
                        JSON.stringify({
                            action: "copy",
                            targetId: data.targetId,
                        })
                    );
                },
            },
            {
                label: "ペースト",
                enabled: data.hasClipboardText,
                click: () => {
                    sender.send(
                        "send_message",
                        "menu-action",
                        JSON.stringify({
                            action: "paste",
                            targetId: data.targetId,
                        })
                    );
                },
            },
            { type: "separator" },
            {
                label: "削除",
                enabled: data.hasSelection,
                click: () => {
                    sender.send(
                        "send_message",
                        "menu-action",
                        JSON.stringify({
                            action: "delete",
                            targetId: data.targetId,
                        })
                    );
                },
            },
            { type: "separator" },
            {
                label: "すべて選択",
                click: () => {
                    sender.send(
                        "send_message",
                        "menu-action",
                        JSON.stringify({
                            action: "selectAll",
                            targetId: data.targetId,
                        })
                    );
                },
            }
        );
    } else {
        // 読み取り専用の場合の制限メニュー
        menuTemplate.push(
            {
                label: "コピー",
                enabled: data.hasSelection,
                click: () => {
                    sender.send(
                        "send_message",
                        "menu-action",
                        JSON.stringify({
                            action: "copy",
                            targetId: data.targetId,
                        })
                    );
                },
            },
            { type: "separator" },
            {
                label: "すべて選択",
                click: () => {
                    sender.send(
                        "send_message",
                        "menu-action",
                        JSON.stringify({
                            action: "selectAll",
                            targetId: data.targetId,
                        })
                    );
                },
            }
        );
    }

    const contextMenu = Menu.buildFromTemplate(menuTemplate);
    contextMenu.popup();
};

// アプリケーション終了時のクリーンアップ
app.on("before-quit", () => {
    logger?.info("アプリケーションを終了します");
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.whenReady().then(createWindow);
