/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import * as webdriver from "selenium-webdriver";
import * as edge from "selenium-webdriver/edge";
import { By, WebElement } from "selenium-webdriver";
import { APP_CONFIG } from "../config/app-config";
import {
    WebDriverError,
    PageLoadError,
} from "../exceptions/emote-processing-exceptions";
import { Logger } from "../utils/logger";
import { WebDriverUtils } from "../utils/webdriver-utils";
import { XPathSelectors } from "../utils/xpath-selectors";

const { Builder } = webdriver;

export interface IWebDriverSession {
    initialize(driverPath: string, profilePath?: string): Promise<void>;
    navigateToTarget(): Promise<void>;
    dispose(): Promise<void>;
    isInitialized(): boolean;
    getDriver(): webdriver.ThenableWebDriver;
    waitUntilListOpen(xpath: string): Promise<void>;
    waitUntilDialog(): Promise<void>;
    waitUntilDialogClear(): Promise<void>;
}

export class WebDriverSession implements IWebDriverSession {
    private _driver: webdriver.ThenableWebDriver | undefined;
    private _isInitialized: boolean = false;

    constructor(private logger: Logger) {}

    async initialize(driverPath: string, profilePath?: string): Promise<void> {
        try {
            await this.dispose();

            const service = new edge.ServiceBuilder(driverPath);
            const edgeOptions = new edge.Options();

            edgeOptions.windowSize({
                width: APP_CONFIG.WEBDRIVER.WINDOW_SIZE.WIDTH,
                height: APP_CONFIG.WEBDRIVER.WINDOW_SIZE.HEIGHT,
            });

            if (profilePath) {
                edgeOptions.addArguments(`--user-data-dir=${profilePath}`);
            }

            const driver = new Builder()
                .forBrowser("MicrosoftEdge")
                .setEdgeOptions(edgeOptions)
                .setEdgeService(service)
                .build();

            driver.manage().setTimeouts({
                pageLoad: APP_CONFIG.WEBDRIVER.TIMEOUTS.PAGE_LOAD,
                implicit: APP_CONFIG.WEBDRIVER.TIMEOUTS.IMPLICIT,
            });

            this._driver = driver;
            this._isInitialized = true;
        } catch (error) {
            throw new WebDriverError(
                "WebDriverセッションの初期化に失敗",
                "initialize",
                undefined,
                error instanceof Error ? error : undefined
            );
        }
    }

    async navigateToTarget(): Promise<void> {
        if (!this._driver) {
            throw new WebDriverError(
                "WebDriverが初期化されていません",
                "navigate"
            );
        }

        try {
            await this._driver.get(APP_CONFIG.URLS.TARGET);
        } catch (error) {
            throw new PageLoadError(
                "ターゲットページの読み込みに失敗",
                "target-page",
                APP_CONFIG.URLS.TARGET
            );
        }
    }

    async dispose(): Promise<void> {
        if (this._driver) {
            try {
                await this._driver.quit();
                this.logger.info("WebDriverセッション終了");
            } catch (error) {
                this.logger.warn("WebDriverセッション終了時にエラーが発生");
            } finally {
                this._driver = undefined;
                this._isInitialized = false;
            }
        }
    }

    isInitialized(): boolean {
        return this._isInitialized && !!this._driver;
    }

    getDriver(): webdriver.ThenableWebDriver {
        if (!this._driver) {
            throw new WebDriverError(
                "WebDriverが初期化されていません",
                "getDriver"
            );
        }
        return this._driver;
    }

    async waitUntilListOpen(xpath: string): Promise<void> {
        const driver = this.getDriver();

        await driver.wait(
            async () => {
                try {
                    const element = await WebDriverUtils.findElementSafely(
                        driver,
                        xpath
                    );
                    if (!element) {
                        return false;
                    }
                    const visible = await element.isDisplayed();
                    return visible;
                } catch (error) {
                    return false;
                }
            },
            APP_CONFIG.WEBDRIVER.TIMEOUTS.ELEMENT_WAIT,
            "error on waitUntilListOpen()"
        );
    }

    async waitUntilDialog(): Promise<void> {
        const driver = this.getDriver();

        await driver.wait(
            async () => {
                try {
                    // ダイアログの存在確認
                    const dialog = await WebDriverUtils.findElementSafely(
                        driver,
                        XPathSelectors.MODAL_DIALOG
                    );
                    if (!dialog) {
                        return false;
                    }
                    const dialogVisible = await dialog.isDisplayed();
                    if (!dialogVisible) {
                        return false;
                    }

                    // フォームの存在確認
                    const form = await driver.findElement(
                        By.name(XPathSelectors.PREFERENCE_FORM)
                    );
                    const formVisible = await form.isDisplayed();
                    return formVisible;
                } catch (error) {
                    return false;
                }
            },
            APP_CONFIG.WEBDRIVER.TIMEOUTS.DIALOG_WAIT,
            "error on waitUntilDialog()"
        );
    }

    async waitUntilDialogClear(): Promise<void> {
        const driver = this.getDriver();

        await driver.wait(
            async () => {
                try {
                    // ImplicitWaitを一時的に無効化して要素探索
                    await driver.manage().setTimeouts({ implicit: 0 });
                    const dialogs = await driver.findElements(
                        By.xpath(XPathSelectors.MODAL_DIALOG)
                    );

                    // ImplicitWaitを元に戻す
                    await driver.manage().setTimeouts({
                        implicit: APP_CONFIG.WEBDRIVER.TIMEOUTS.IMPLICIT,
                    });

                    // 要素が存在しない場合は即座にtrue
                    if (dialogs.length === 0) {
                        return true;
                    }

                    // 要素が存在する場合は表示状態を確認
                    const visible = await dialogs[0].isDisplayed();
                    return !visible;
                } catch (error) {
                    // エラー時もImplicitWaitを元に戻す
                    try {
                        await driver.manage().setTimeouts({
                            implicit: APP_CONFIG.WEBDRIVER.TIMEOUTS.IMPLICIT,
                        });
                    } catch (resetError) {
                        // タイムアウト設定の復元に失敗した場合はログに記録
                        this.logger.warn("ImplicitWaitの復元に失敗");
                    }
                    return true;
                }
            },
            APP_CONFIG.WEBDRIVER.TIMEOUTS.DIALOG_WAIT,
            "waitUntilDialogClear()"
        );
    }
}
