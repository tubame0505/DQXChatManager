/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import { BrowserWindow, dialog } from "electron";
import { EmoteData } from "./emote-data";
import { APP_CONFIG, ProcessingResult } from "./config/app-config";
import { EmoteProcessingError } from "./exceptions/emote-processing-exceptions";
import { PathValidator, SecurityError } from "./security/security-validator";
import { SecureFileManager } from "./security/secure-file-manager";
import { Logger, ElectronLogger } from "./utils/logger";
import {
    WebDriverSession,
    IWebDriverSession,
} from "./services/webdriver-session";
import { EmoteManager, IEmoteManager } from "./services/emote-manager";

export interface IDqxHiroba {
    dispose(): void;
    login(driverPath: string, profile: string): Promise<void>;
    exportEmote(): Promise<ProcessingResult>;
    importEmote(emote: string): Promise<ProcessingResult>;
}

export class DqxHiroba implements IDqxHiroba {
    private logger: Logger;
    private webDriverSession: IWebDriverSession;
    private emoteManager: IEmoteManager;
    private _isBusy: boolean = false;

    constructor(private mainWindow: BrowserWindow) {
        this.logger = new ElectronLogger(mainWindow);
        this.webDriverSession = new WebDriverSession(this.logger);
        this.emoteManager = new EmoteManager(
            mainWindow,
            this.webDriverSession,
            this.logger
        );
    }

    public dispose = (): void => {
        this.webDriverSession.dispose();
    };

    public login = async (
        driverPath: string,
        profile: string
    ): Promise<void> => {
        this.logger.info("広場ログイン開始");

        try {
            let profilePath = "";
            if (profile.length > 0) {
                this.logger.info(`Profile=${profile}`);
                // セキュリティ強化されたプロファイルパス作成
                profilePath = PathValidator.createSecureProfilePath(
                    __dirname,
                    profile
                );
                if (profilePath) {
                    await SecureFileManager.safeCreateDirectory(
                        profilePath,
                        __dirname
                    );
                }
            }

            await this.webDriverSession.initialize(driverPath, profilePath);
            await this.webDriverSession.navigateToTarget();
        } catch (error) {
            if (error instanceof SecurityError) {
                this.logger.error(
                    "セキュリティエラー: プロファイル設定が不正です",
                    error
                );
            } else if (error instanceof EmoteProcessingError) {
                this.logger.error("WebDriverエラー", error);
            } else {
                this.logger.error(
                    "ブラウザ起動エラー",
                    error instanceof Error ? error : undefined
                );
            }
            throw error;
        }
    };

    public exportEmote = async (): Promise<ProcessingResult> => {
        if (!this.webDriverSession.isInitialized()) {
            this.logger.error("エラー：広場ログインしてください");
            throw new EmoteProcessingError(
                "WebDriverセッションが初期化されていません",
                "SESSION_NOT_INITIALIZED"
            );
        }

        if (this._isBusy) {
            this.logger.warn("既に処理中です");
            throw new EmoteProcessingError("既に処理中です", "BUSY");
        }

        try {
            this._isBusy = true;
            return await this.emoteManager.exportEmote();
        } finally {
            this._isBusy = false;
        }
    };

    public importEmote = async (emote: string): Promise<ProcessingResult> => {
        if (!this.webDriverSession.isInitialized()) {
            this.addLog("エラー：広場ログインしてください");
            throw new EmoteProcessingError(
                "WebDriverセッションが初期化されていません",
                "SESSION_NOT_INITIALIZED"
            );
        }

        const driver = this.webDriverSession.getDriver();
        const url = await driver.getCurrentUrl();
        if (!url.startsWith(APP_CONFIG.URLS.TARGET)) {
            this.addLog("エラー：広場ログインしてください");
            throw new EmoteProcessingError(
                "対象ページにアクセスしていません",
                "INVALID_PAGE"
            );
        }

        if (this._isBusy) {
            this.addLog("既に処理中です");
            throw new EmoteProcessingError("既に処理中です", "BUSY");
        }

        if (!emote || emote.length === 0) {
            this.addLog("設定を入力してから取り込み開始してください");
            throw new EmoteProcessingError(
                "エモート設定が空です",
                "EMPTY_SETTINGS"
            );
        }

        // 確認ダイアログ
        const confirmed = await this.showConfirmationDialog();
        if (!confirmed) {
            this.addLog("キャンセルされました");
            return {
                success: false,
                errorCount: 0,
                processedItems: 0,
                errors: ["ユーザーによりキャンセルされました"],
            };
        }

        try {
            this._isBusy = true;
            return await this.emoteManager.importEmote(emote);
        } finally {
            this._isBusy = false;
        }
    };

    private async showConfirmationDialog(): Promise<boolean> {
        const options: Electron.MessageBoxSyncOptions = {
            type: "question",
            title: "確認",
            message: "本当に取り込みますか？今の設定は上書きされます",
            buttons: ["OK", "Cancel"],
            cancelId: -1,
        };

        const selected: number = dialog.showMessageBoxSync(options);
        return selected === 0;
    }

    private addLog = (message: string): void => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(
                "send_message",
                "log",
                message + "\r\n"
            );
        }
    };
}
