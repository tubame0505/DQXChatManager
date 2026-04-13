/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import * as webdriver from "selenium-webdriver";
import { By, WebElement } from "selenium-webdriver";
import { EmoteData } from "../emote-data";
import { EmoteType, APP_CONFIG } from "../config/app-config";
import {
    EmoteProcessingError,
    DialogOperationError,
} from "../exceptions/emote-processing-exceptions";
import { Logger } from "../utils/logger";
import { WebDriverUtils } from "../utils/webdriver-utils";
import { XPathSelectors } from "../utils/xpath-selectors";
import { IWebDriverSession } from "./webdriver-session";

export interface IEmoteHandler {
    canHandle(emoteType: EmoteType): boolean;
    setEmote(
        webDriverSession: IWebDriverSession,
        emoteData: EmoteData
    ): Promise<void>;
}

abstract class BaseEmoteHandler implements IEmoteHandler {
    constructor(protected logger: Logger) {}

    abstract canHandle(emoteType: EmoteType): boolean;
    protected abstract selectRadioButton(
        driver: webdriver.ThenableWebDriver
    ): Promise<void>;
    protected abstract setEmoteSpecificData(
        driver: webdriver.ThenableWebDriver,
        emoteData: EmoteData
    ): Promise<void>;
    protected abstract getRequiredFields(): string[];

    async setEmote(
        webDriverSession: IWebDriverSession,
        emoteData: EmoteData
    ): Promise<void> {
        const emoteType = EmoteData.parseEmoteType(emoteData.type);
        if (!emoteType || !this.canHandle(emoteType)) {
            throw new EmoteProcessingError(
                `このハンドラーでは ${emoteData.type} を処理できません`,
                "INVALID_EMOTE_TYPE"
            );
        }

        const driver = webDriverSession.getDriver();

        try {
            // ラジオボタンの選択
            await this.selectRadioButton(driver);

            // エモート固有データの設定
            await this.setEmoteSpecificData(driver, emoteData);

            // 共通フィールドの設定（しぐさ、表情、タイミング）
            await this.setCommonFields(driver, emoteData);

            // 登録
            await this.registerEmote(webDriverSession);
        } catch (error) {
            throw new EmoteProcessingError(
                `エモート設定中にエラー: ${error}`,
                "EMOTE_SET_FAILED",
                {
                    emoteType: emoteData.type,
                    pageId: emoteData.pageId,
                    index: emoteData.index,
                }
            );
        }
    }

    protected async setCommonFields(
        driver: webdriver.ThenableWebDriver,
        emoteData: EmoteData
    ): Promise<void> {
        // しぐさ設定（セリフ、スタンプ）
        if (emoteData.type === "セリフ" || emoteData.type === "スタンプ") {
            await this.selectOption(
                driver,
                XPathSelectors.ACTION_SELECT,
                emoteData.action,
                "しぐさ"
            );
        }

        // 表情設定（セリフ、スタンプ）
        if (emoteData.type === "セリフ" || emoteData.type === "スタンプ") {
            await this.selectOption(
                driver,
                XPathSelectors.FACE_SELECT,
                emoteData.face,
                "表情"
            );
        }

        // タイミング設定（セリフの場合のみ）
        if (emoteData.type === "セリフ") {
            await this.selectOption(
                driver,
                XPathSelectors.TIMING_SELECT,
                emoteData.timing,
                "発言タイミング"
            );
        }
    }

    protected async selectOption(
        driver: webdriver.ThenableWebDriver,
        selectXPath: string,
        optionText: string,
        fieldName: string
    ): Promise<void> {
        const success = await WebDriverUtils.selectOptionSafely(
            driver,
            selectXPath,
            optionText
        );
        if (!success) {
            this.logger.warn(`${fieldName} ${optionText}の設定に失敗しました`);
        }
    }

    protected async registerEmote(
        webDriverSession: IWebDriverSession
    ): Promise<void> {
        await this.registerOrCancel(webDriverSession, true);
    }

    protected async registerOrCancel(
        webDriverSession: IWebDriverSession,
        isRegister: boolean
    ): Promise<void> {
        const driver = webDriverSession.getDriver();
        let maxRetry = APP_CONFIG.EMOTE_PROCESSING.RETRY.MAX_ATTEMPTS;
        let lastError: unknown = undefined;

        while (maxRetry > 0) {
            maxRetry -= 1;

            try {
                const buttonXPath = isRegister
                    ? XPathSelectors.REGISTER_BUTTON
                    : XPathSelectors.CANCEL_BUTTON;

                const button = await driver.findElement(By.xpath(buttonXPath));
                if (button) {
                    await WebDriverUtils.clickElementSafely(driver, button);
                } else {
                    return;
                }

                // ダイアログが閉じるまで待機
                await webDriverSession.waitUntilDialogClear();
                return;
            } catch (error) {
                lastError = error;
                // 短時間待機してリトライ
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        throw new DialogOperationError(
            `ダイアログ操作に失敗: ${lastError}`,
            "emote-edit-modal",
            isRegister ? "register" : "cancel"
        );
    }
}

export class DialogueHandler extends BaseEmoteHandler {
    canHandle(emoteType: EmoteType): boolean {
        return emoteType === "セリフ";
    }

    protected async selectRadioButton(
        driver: webdriver.ThenableWebDriver
    ): Promise<void> {
        const radioButton = await driver.findElement(
            By.xpath(XPathSelectors.DIALOGUE_RADIO)
        );
        await WebDriverUtils.clickElementSafely(driver, radioButton);
    }

    protected async setEmoteSpecificData(
        driver: webdriver.ThenableWebDriver,
        emoteData: EmoteData
    ): Promise<void> {
        const contentsArea = await driver.findElement(
            By.xpath(XPathSelectors.CONTENTS_TEXTAREA)
        );
        await WebDriverUtils.sendKeysSafely(
            driver,
            contentsArea,
            emoteData.contentsToKey()
        );
    }

    protected getRequiredFields(): string[] {
        return ["contents", "action", "face", "timing"];
    }
}

export class StampHandler extends BaseEmoteHandler {
    canHandle(emoteType: EmoteType): boolean {
        return emoteType === "スタンプ";
    }

    protected async selectRadioButton(
        driver: webdriver.ThenableWebDriver
    ): Promise<void> {
        const radioButton = await driver.findElement(
            By.xpath(XPathSelectors.STAMP_RADIO)
        );
        await WebDriverUtils.clickElementSafely(driver, radioButton);
    }

    protected async setEmoteSpecificData(
        driver: webdriver.ThenableWebDriver,
        emoteData: EmoteData
    ): Promise<void> {
        // スタンプ選択ボタンをクリック
        const openButton = await driver.findElement(
            By.xpath(XPathSelectors.STAMP_OPEN_BUTTON)
        );
        await WebDriverUtils.clickElementSafely(driver, openButton);

        // スタンプ番号を取得
        const targetStampNo = emoteData.contents.split("_")[0];
        const stampButton = await driver.findElement(
            By.xpath(XPathSelectors.STAMP_BUTTON(targetStampNo))
        );

        if (stampButton) {
            await WebDriverUtils.clickElementSafely(driver, stampButton);
        } else {
            this.logger.warn(
                `スタンプ ${emoteData.contents}の設定に失敗しました`
            );
        }
    }

    protected getRequiredFields(): string[] {
        return ["contents", "action", "face"];
    }
}

export class OthersHandler extends BaseEmoteHandler {
    canHandle(emoteType: EmoteType): boolean {
        return emoteType === "だいじなもの" || emoteType === "その他";
    }

    protected async selectRadioButton(
        driver: webdriver.ThenableWebDriver
    ): Promise<void> {
        // 基底クラスの要求により空実装（実際の処理はsetEmoteSpecificDataで行う）
    }

    private async selectRadioButtonByType(
        driver: webdriver.ThenableWebDriver,
        emoteType: EmoteType
    ): Promise<void> {
        const radioXPath =
            emoteType === "だいじなもの"
                ? XPathSelectors.IMPORTANT_ITEM_RADIO
                : XPathSelectors.OTHER_RADIO;

        const radioButton = await driver.findElement(By.xpath(radioXPath));
        await WebDriverUtils.clickElementSafely(driver, radioButton);
    }

    protected async setEmoteSpecificData(
        driver: webdriver.ThenableWebDriver,
        emoteData: EmoteData
    ): Promise<void> {
        const emoteType = EmoteData.parseEmoteType(emoteData.type);
        if (!emoteType) {
            throw new EmoteProcessingError(
                `サポートされていないエモートタイプ: ${emoteData.type}`,
                "UNSUPPORTED_EMOTE_TYPE"
            );
        }

        // まず適切なラジオボタンを選択
        await this.selectRadioButtonByType(driver, emoteType);

        const selectXPath =
            emoteType === "だいじなもの"
                ? XPathSelectors.IMPORTANT_ITEM_SELECT
                : XPathSelectors.OTHER_SELECT;

        const success = await WebDriverUtils.selectOptionSafely(
            driver,
            selectXPath,
            emoteData.contents
        );

        if (!success) {
            this.logger.warn(
                `${emoteType} ${emoteData.contents}の設定に失敗しました`
            );
        }
    }

    protected getRequiredFields(): string[] {
        return ["contents"];
    }
}

export class EmoteHandlerFactory {
    private handlers: IEmoteHandler[];

    constructor(logger: Logger) {
        this.handlers = [
            new DialogueHandler(logger),
            new StampHandler(logger),
            new OthersHandler(logger),
        ];
    }

    getHandler(emoteType: EmoteType): IEmoteHandler {
        const handler = this.handlers.find((h) => h.canHandle(emoteType));
        if (!handler) {
            throw new EmoteProcessingError(
                `サポートされていないエモートタイプ: ${emoteType}`,
                "UNSUPPORTED_EMOTE_TYPE"
            );
        }
        return handler;
    }
}
