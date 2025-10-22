/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */

export const APP_CONFIG = {
    // WebDriver設定
    WEBDRIVER: {
        TIMEOUTS: {
            PAGE_LOAD: 15000,
            IMPLICIT: 5000,
            ELEMENT_WAIT: 6000,
            DIALOG_WAIT: 6000,
        },
        WINDOW_SIZE: {
            WIDTH: 1100,
            HEIGHT: 980,
        },
    },

    // エモート処理設定
    EMOTE_PROCESSING: {
        RETRY: {
            MAX_ATTEMPTS: 5,
            ERROR_RETRY: 3,
            DELAY_MS: 5000,
        },
        PAGES: {
            TOTAL_PAGES: 10,
            ITEMS_PER_PAGE: 10,
        },
        BATCH: {
            SIZE: 1,
            PAUSE_MS: 1000,
        },
    },

    // URL設定
    URLS: {
        TARGET: "https://hiroba.dqx.jp/sc/preference/emotemsg",
        CDN: "https://msedgedriver.microsoft.com/",
    },

    // レジストリ設定
    REGISTRY: {
        EDGE_PATH:
            "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe",
    },
} as const;

// 型定義
export type EmoteType = "セリフ" | "スタンプ" | "だいじなもの" | "その他";
export type PageId = `emote-list-${number}`;

export interface ProcessingResult {
    success: boolean;
    errorCount: number;
    processedItems: number;
    errors: string[];
}
