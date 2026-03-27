/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import { BrowserWindow } from "electron";

export interface Logger {
    info(message: string): void;
    error(message: string, error?: Error): void;
    warn(message: string): void;
    debug(message: string): void;
}

export class ElectronLogger implements Logger {
    constructor(private mainWindow: BrowserWindow) {}

    info(message: string): void {
        this.sendMessage("log", message);
        console.info(`[INFO] ${message}`);
    }

    error(message: string, error?: Error): void {
        const errorMessage = error ? `${message}: ${error.message}` : message;
        this.sendMessage("log", `エラー: ${errorMessage}`);
        console.error(`[ERROR] ${errorMessage}`, error);
    }

    warn(message: string): void {
        this.sendMessage("log", `警告: ${message}`);
        console.warn(`[WARN] ${message}`);
    }

    debug(message: string): void {
        console.debug(`[DEBUG] ${message}`);
    }

    /**
     * エモートデータをUIに送信する
     */
    sendEmoteData(message: string): void {
        this.sendMessage("emote", message);
    }

    private sendMessage(target: string, message: string): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(
                "send_message",
                target,
                message + "\r\n"
            );
        }
    }
}

export class ConsoleLogger implements Logger {
    info(message: string): void {
        console.info(`[INFO] ${message}`);
    }

    error(message: string, error?: Error): void {
        const errorMessage = error ? `${message}: ${error.message}` : message;
        console.error(`[ERROR] ${errorMessage}`, error);
    }

    warn(message: string): void {
        console.warn(`[WARN] ${message}`);
    }

    debug(message: string): void {
        console.debug(`[DEBUG] ${message}`);
    }
}

/**
 * ログレベル管理付きロガー
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

export class LevelLogger implements Logger {
    constructor(
        private baseLogger: Logger,
        private level: LogLevel = LogLevel.INFO
    ) {}

    info(message: string): void {
        if (this.level <= LogLevel.INFO) {
            this.baseLogger.info(message);
        }
    }

    error(message: string, error?: Error): void {
        if (this.level <= LogLevel.ERROR) {
            this.baseLogger.error(message, error);
        }
    }

    warn(message: string): void {
        if (this.level <= LogLevel.WARN) {
            this.baseLogger.warn(message);
        }
    }

    debug(message: string): void {
        if (this.level <= LogLevel.DEBUG) {
            this.baseLogger.debug(message);
        }
    }
}
