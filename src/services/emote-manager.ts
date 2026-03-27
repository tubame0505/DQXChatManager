/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import { BrowserWindow } from "electron";
import * as webdriver from "selenium-webdriver";
import { By } from "selenium-webdriver";
import { EmoteData } from "../emote-data";
import {
    EmoteType,
    PageId,
    ProcessingResult,
    APP_CONFIG,
} from "../config/app-config";
import {
    EmoteProcessingError,
    EmoteValidationError,
    PageLoadError,
} from "../exceptions/emote-processing-exceptions";
import { Logger } from "../utils/logger";
import { ContentSanitizer } from "../security/content-sanitizer";
import { WebDriverUtils } from "../utils/webdriver-utils";
import { XPathSelectors } from "../utils/xpath-selectors";
import { IWebDriverSession } from "./webdriver-session";
import { EmoteHandlerFactory, IEmoteHandler } from "./emote-handlers";

export interface IEmoteManager {
    exportEmote(): Promise<ProcessingResult>;
    importEmote(emoteSettings: string): Promise<ProcessingResult>;
    validateEmoteData(emoteData: EmoteData): boolean;
}

export class EmoteManager implements IEmoteManager {
    private emoteHandlerFactory: EmoteHandlerFactory;

    constructor(
        private mainWindow: BrowserWindow,
        private webDriverSession: IWebDriverSession,
        private logger: Logger
    ) {
        this.emoteHandlerFactory = new EmoteHandlerFactory(logger);
    }

    async exportEmote(): Promise<ProcessingResult> {
        if (!this.webDriverSession.isInitialized()) {
            throw new EmoteProcessingError(
                "WebDriverセッションが初期化されていません",
                "SESSION_NOT_INITIALIZED"
            );
        }

        this.logger.info("設定出力開始");
        const result: ProcessingResult = {
            success: true,
            errorCount: 0,
            processedItems: 0,
            errors: [],
        };

        try {
            for (
                let i = 0;
                i < APP_CONFIG.EMOTE_PROCESSING.PAGES.TOTAL_PAGES;
                i++
            ) {
                this.logger.info(`${i + 1}ページ目出力中`);
                const pageId: PageId = `emote-list-${i}`;

                try {
                    await this.exportEmotePage(pageId);
                    result.processedItems +=
                        APP_CONFIG.EMOTE_PROCESSING.PAGES.ITEMS_PER_PAGE;
                } catch (error) {
                    const errorMsg = `ページ ${i + 1} の出力に失敗: ${error}`;
                    this.logger.error(errorMsg);
                    result.errors.push(errorMsg);
                    result.errorCount++;
                }
            }

            this.logger.info("出力終了");
            result.success = result.errorCount === 0;
        } catch (error) {
            const errorMsg = `出力処理中に致命的エラー: ${error}`;
            this.logger.error(errorMsg);
            result.success = false;
            result.errors.push(errorMsg);
            result.errorCount++;
        }

        return result;
    }

    async importEmote(emoteSettings: string): Promise<ProcessingResult> {
        if (!this.webDriverSession.isInitialized()) {
            throw new EmoteProcessingError(
                "WebDriverセッションが初期化されていません",
                "SESSION_NOT_INITIALIZED"
            );
        }

        const driver = this.webDriverSession.getDriver();
        const url = await driver.getCurrentUrl();

        if (!url.startsWith(APP_CONFIG.URLS.TARGET)) {
            throw new PageLoadError(
                "対象ページにアクセスしていません",
                "import-page",
                url
            );
        }

        if (!emoteSettings || emoteSettings.trim() === "") {
            throw new EmoteValidationError("エモート設定が空です", {
                settings: emoteSettings,
            });
        }

        this.logger.info("取り込み開始");
        const settings = emoteSettings.split("\r").join("").split("\n");
        const result: ProcessingResult = {
            success: true,
            errorCount: 0,
            processedItems: 0,
            errors: [],
        };

        // WebDriverの順次処理（WebDriverは単一セッションのため並列処理不可）
        const settingsToProcess = settings.filter((s) => s.length > 0);

        // 実際のブラウザ操作回数をトラッキング
        const batchSize = APP_CONFIG.EMOTE_PROCESSING.BATCH.SIZE;
        let actualOperationCount = 0;

        for (let i = 0; i < settingsToProcess.length; i += batchSize) {
            const batch = settingsToProcess.slice(i, i + batchSize);
            for (const setting of batch) {
                try {
                    const wasOperationExecuted =
                        await this.processSingleEmoteSetting(setting);
                    result.processedItems++;

                    // 実際に操作が実行された場合のみカウント
                    if (wasOperationExecuted) {
                        actualOperationCount++;

                        // 実際の操作回数がバッチサイズに達したら待機
                        if (actualOperationCount >= batchSize) {
                            await new Promise((resolve) =>
                                setTimeout(
                                    resolve,
                                    APP_CONFIG.EMOTE_PROCESSING.BATCH.PAUSE_MS
                                )
                            );
                            actualOperationCount = 0; // カウントリセット
                        }
                    }
                } catch (error) {
                    const errorMsg = `設定 "${setting}" の処理に失敗: ${error}`;
                    this.logger.error(errorMsg);
                    result.errors.push(errorMsg);
                    result.errorCount++;
                }
            }
        }

        result.success = result.errorCount === 0;

        if (result.success) {
            this.logger.info("正常に完了しました");
        } else {
            this.logger.info(
                `完了 (エラーが ${result.errorCount}件ありました)`
            );
        }

        return result;
    }

    validateEmoteData(emoteData: EmoteData): boolean {
        const supportedTypes: EmoteType[] = [
            "セリフ",
            "スタンプ",
            "だいじなもの",
            "その他",
        ];

        if (!supportedTypes.includes(emoteData.type as EmoteType)) {
            this.logger.warn(
                `サポートされていないエモートタイプ: ${emoteData.type}`
            );
            return false;
        }

        if (!emoteData.pageId || !emoteData.pageId.startsWith("emote-list-")) {
            this.logger.warn(`無効なページID: ${emoteData.pageId}`);
            return false;
        }

        if (
            emoteData.index < 1 ||
            emoteData.index > APP_CONFIG.EMOTE_PROCESSING.PAGES.ITEMS_PER_PAGE
        ) {
            this.logger.warn(`無効なインデックス: ${emoteData.index}`);
            return false;
        }

        return true;
    }

    private async exportEmotePage(pageId: PageId): Promise<void> {
        const driver = this.webDriverSession.getDriver();

        // リストが閉じていたら開く
        const pageBar = `p1${pageId.split("-")[2]}`;
        const listHolder = await driver.wait(
            webdriver.until.elementLocated(
                By.xpath(XPathSelectors.PAGE_BAR(pageId.split("-")[2]))
            ),
            APP_CONFIG.WEBDRIVER.TIMEOUTS.ELEMENT_WAIT,
            `error on waiting page bar: ${pageBar}`
        );

        if (!listHolder) {
            throw new PageLoadError(
                `ページ読み込みエラー <element not found>`,
                pageId
            );
        }

        const listHolderStyle = await listHolder.getAttribute("class");
        if (listHolderStyle.indexOf("hide") > 0) {
            await WebDriverUtils.clickElementSafely(driver, listHolder);
            await this.webDriverSession.waitUntilListOpen(
                XPathSelectors.EMOTE_CONTENT_LINK(pageId, 1)
            );
        }

        // 各アイテムを読み込み
        for (
            let i = 0;
            i < APP_CONFIG.EMOTE_PROCESSING.PAGES.ITEMS_PER_PAGE;
            i++
        ) {
            const emoteData = await this.getOneEmote(pageId, i + 1);
            this.addEmote(emoteData.emoteToString());
        }
    }

    private async processSingleEmoteSetting(setting: string): Promise<boolean> {
        const driver = this.webDriverSession.getDriver();
        let maxRetry = APP_CONFIG.EMOTE_PROCESSING.RETRY.MAX_ATTEMPTS;
        let lastError: unknown = undefined;

        while (maxRetry > 0) {
            maxRetry--;

            try {
                if (setting.length > 0) {
                    const wasOperationExecuted = await this.setEmote(setting);
                    return wasOperationExecuted; // 操作が実行されたかどうかを返す
                }
                return false; // 設定が空の場合は操作未実行
            } catch (error) {
                lastError = error;
                let errorRetry = APP_CONFIG.EMOTE_PROCESSING.RETRY.ERROR_RETRY;

                while (errorRetry > 0) {
                    try {
                        // 遅延後に再読み込み
                        await new Promise((resolve) =>
                            setTimeout(
                                resolve,
                                APP_CONFIG.EMOTE_PROCESSING.RETRY.DELAY_MS
                            )
                        );
                        await driver.get(APP_CONFIG.URLS.TARGET);
                        break; // 成功したらループを抜ける
                    } catch (reloadError) {
                        errorRetry--;
                        if (errorRetry === 0) {
                            // 対処不能なエラーの場合、ループを終了
                            return false;
                        }
                    }
                }
            }
        }

        // ここに到達した場合はエラー（すべてのリトライが失敗）
        throw new EmoteProcessingError(
            `設定処理に失敗: ${lastError}`,
            "PROCESSING_FAILED",
            { setting }
        );
    }

    private async setEmote(setting: string): Promise<boolean> {
        this.addLog(` ${setting} >処理中<`);

        const emoteData = new EmoteData();

        try {
            emoteData.emoteFromString(setting);
        } catch (error) {
            this.addLog("設定を読み込めなかったのでスキップします");
            return false; // 操作未実行
        }

        if (!this.validateEmoteData(emoteData)) {
            this.addLog(
                "サポートされていないエモートタイプのためスキップします"
            );
            return false; // 操作未実行
        }

        // ページリストの確認と開放
        await this.ensurePageListOpen(emoteData);

        // 現在の設定と比較
        const currentEmote = await this.getOneEmote(
            emoteData.pageId as PageId,
            emoteData.index
        );

        if (
            currentEmote.emoteToNormalizedString() ===
            emoteData.emoteToNormalizedString()
        ) {
            this.addLog("設定済みのためスキップします");
            return false; // 操作未実行（スキップされた）
        }

        // 設定ダイアログを開く
        await this.openEditDialog(emoteData);

        // エモートタイプに応じた処理
        const handler = this.emoteHandlerFactory.getHandler(
            emoteData.type as EmoteType
        );
        await handler.setEmote(this.webDriverSession, emoteData);

        // 設定後の確認
        const updatedEmote = await this.getOneEmote(
            emoteData.pageId as PageId,
            emoteData.index
        );
        if (
            updatedEmote.emoteToNormalizedString() !==
            emoteData.emoteToNormalizedString()
        ) {
            this.logger.warn(
                `設定後の確認で不一致: 期待値="${emoteData.emoteToNormalizedString()}", 実際値="${updatedEmote.emoteToNormalizedString()}"`
            );
            throw new EmoteProcessingError(
                "設定後確認時エラー",
                "VERIFICATION_FAILED",
                { expected: emoteData, actual: updatedEmote }
            );
        }

        return true; // 操作が実行された
    }

    private async ensurePageListOpen(emoteData: EmoteData): Promise<void> {
        const driver = this.webDriverSession.getDriver();
        const pageBar = `p1${emoteData.pageId.split("-")[2]}`;

        const listHolder = await driver.wait(
            webdriver.until.elementLocated(
                By.xpath(
                    XPathSelectors.PAGE_BAR(emoteData.pageId.split("-")[2])
                )
            ),
            APP_CONFIG.WEBDRIVER.TIMEOUTS.ELEMENT_WAIT,
            `error on waiting page bar: ${pageBar}`
        );

        if (!listHolder) {
            throw new PageLoadError(
                `ページ読み込みエラー <element not found>`,
                emoteData.pageId
            );
        }

        const listHolderStyle = await listHolder.getAttribute("class");
        if (listHolderStyle.indexOf("hide") > 0) {
            await WebDriverUtils.clickElementSafely(driver, listHolder);
            await this.webDriverSession.waitUntilListOpen(
                XPathSelectors.EMOTE_CONTENT_LINK(
                    emoteData.pageId,
                    emoteData.index
                )
            );
        }
    }

    private async openEditDialog(emoteData: EmoteData): Promise<void> {
        const driver = this.webDriverSession.getDriver();

        const openLink = await driver.findElement(
            By.xpath(
                XPathSelectors.EMOTE_CONTENT_LINK(
                    emoteData.pageId,
                    emoteData.index
                )
            )
        );

        if (!openLink) {
            throw new PageLoadError(
                "ページ読み込みエラー <openLink>",
                emoteData.pageId
            );
        }

        await WebDriverUtils.clickElementSafely(driver, openLink);
        await this.webDriverSession.waitUntilDialog();
    }

    private async getOneEmote(
        pageId: PageId,
        index: number
    ): Promise<EmoteData> {
        const driver = this.webDriverSession.getDriver();
        const emoteData = new EmoteData();
        emoteData.pageId = pageId;
        emoteData.index = index;

        const attrs = await WebDriverUtils.findElementsSafely(
            driver,
            XPathSelectors.EMOTE_LIST_ROW(pageId, index)
        );

        if (attrs.length < 6) {
            throw new PageLoadError(
                `ページ読み込みエラー: 要素が見つかりません`,
                pageId
            );
        }

        const [
            ,
            typeElement,
            contentsElement,
            actionElement,
            faceElement,
            timingElement,
        ] = attrs;

        emoteData.type = EmoteData.toEmoteType(
            await WebDriverUtils.getTextSafely(typeElement)
        );

        if (emoteData.type === "セリフ") {
            emoteData.contents =
                await this.extractDialogueContent(contentsElement);
        } else if (emoteData.type === "スタンプ") {
            emoteData.contents =
                await this.extractStampContent(contentsElement);
        } else {
            emoteData.contents =
                await WebDriverUtils.getTextSafely(contentsElement);
        }

        emoteData.action = await WebDriverUtils.getTextSafely(actionElement);
        emoteData.face = await WebDriverUtils.getTextSafely(faceElement);
        emoteData.timing = await WebDriverUtils.getTextSafely(timingElement);

        return emoteData;
    }

    private async extractDialogueContent(
        contentsElement: webdriver.WebElement
    ): Promise<string> {
        try {
            const spanElement = await contentsElement.findElement(
                By.xpath(XPathSelectors.EMOTE_SPAN)
            );
            const rawHtml = await WebDriverUtils.getAttributeSafely(
                spanElement,
                "innerHTML"
            );
            return ContentSanitizer.extractSafeTextContent(rawHtml);
        } catch (error) {
            this.logger.warn(`セリフ要素の取得に失敗: ${error}`);
            return await WebDriverUtils.getTextSafely(contentsElement);
        }
    }

    private async extractStampContent(
        contentsElement: webdriver.WebElement
    ): Promise<string> {
        try {
            const imgElement = await contentsElement.findElement(
                By.xpath(XPathSelectors.EMOTE_IMAGE)
            );
            const imageSrc = await WebDriverUtils.getAttributeSafely(
                imgElement,
                "src"
            );
            const stampNo = ContentSanitizer.extractStampNumber(imageSrc);
            const stampName =
                await WebDriverUtils.getTextSafely(contentsElement);
            return stampNo ? `${stampNo}_${stampName}` : stampName;
        } catch (error) {
            this.logger.warn(`スタンプ要素の取得に失敗: ${error}`);
            return await WebDriverUtils.getTextSafely(contentsElement);
        }
    }

    private addLog(message: string): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(
                "send_message",
                "log",
                message + "\r\n"
            );
        }
    }

    private addEmote(message: string): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(
                "send_message",
                "emote",
                message + "\r\n"
            );
        }
    }
}
