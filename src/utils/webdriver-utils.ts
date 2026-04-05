/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import * as webdriver from "selenium-webdriver";
import { By, WebElement } from "selenium-webdriver";

export class WebDriverUtils {
    /**
     * 要素を安全に取得する（見つからない場合はnullを返す）
     */
    static async findElementSafely(
        driver: webdriver.ThenableWebDriver,
        xpath: string
    ): Promise<WebElement | null> {
        try {
            return await driver.findElement(By.xpath(xpath));
        } catch (error) {
            return null;
        }
    }

    /**
     * 要素を安全にクリックする
     */
    static async clickElementSafely(
        driver: webdriver.ThenableWebDriver,
        element: WebElement
    ): Promise<void> {
        await driver.executeScript("arguments[0].click()", element);
    }

    /**
     * 要素が表示されるまで待機する
     */
    static async waitForElement(
        driver: webdriver.ThenableWebDriver,
        xpath: string,
        timeout: number = 6000
    ): Promise<WebElement> {
        return await driver.wait(
            webdriver.until.elementLocated(By.xpath(xpath)),
            timeout,
            `Timeout waiting for element: ${xpath}`
        );
    }

    /**
     * 要素が非表示になるまで待機する
     */
    static async waitForElementToHide(
        driver: webdriver.ThenableWebDriver,
        xpath: string,
        timeout: number = 6000
    ): Promise<void> {
        await driver.wait(
            async () => {
                try {
                    const element = await this.findElementSafely(driver, xpath);
                    if (!element) {
                        return true;
                    }
                    const isDisplayed = await element.isDisplayed();
                    return !isDisplayed;
                } catch (error) {
                    return true;
                }
            },
            timeout,
            `Timeout waiting for element to hide: ${xpath}`
        );
    }

    /**
     * 複数の要素を安全に取得する
     */
    static async findElementsSafely(
        driver: webdriver.ThenableWebDriver,
        xpath: string
    ): Promise<WebElement[]> {
        try {
            return await driver.findElements(By.xpath(xpath));
        } catch (error) {
            return [];
        }
    }

    /**
     * 要素のテキストを安全に取得する
     */
    static async getTextSafely(element: WebElement): Promise<string> {
        try {
            return await element.getText();
        } catch (error) {
            return "";
        }
    }

    /**
     * 要素の属性を安全に取得する
     */
    static async getAttributeSafely(
        element: WebElement,
        attributeName: string
    ): Promise<string> {
        try {
            const value = await element.getAttribute(attributeName);
            return value || "";
        } catch (error) {
            return "";
        }
    }

    /**
     * セレクトボックスのオプションを安全に選択する
     */
    static async selectOptionSafely(
        driver: webdriver.ThenableWebDriver,
        selectXPath: string,
        optionText: string
    ): Promise<boolean> {
        try {
            const optionElement = await this.findElementSafely(
                driver,
                `${selectXPath}/option[text()='${optionText}']`
            );
            if (optionElement) {
                await driver.executeScript("arguments[0].selected = true;", optionElement);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * テキストエリアに安全にテキストを入力する
     */
    static async sendKeysSafely(
        element: WebElement,
        text: string
    ): Promise<void> {
        try {
            await element.clear();
            if (text && text !== "（なし）") {
                await element.sendKeys(text);
            }
        } catch (error) {
            // エラーは無視（ログ出力は呼び出し元で行う）
        }
    }
}
