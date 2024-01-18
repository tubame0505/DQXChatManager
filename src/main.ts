/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import path from "path";
import * as fs from "fs";
import { searchDevtools } from "electron-search-devtools";
import { BrowserWindow, app, ipcMain, session, dialog } from "electron";
import { DriverDownloader } from "./driver_downloader";
import * as webdriver from "selenium-webdriver";
import * as edge from "selenium-webdriver/edge";

const { Builder, By } = webdriver;
const isDev = process.env.NODE_ENV === "development";
const TargetURL = "https://hiroba.dqx.jp/sc/preference/emotemsg";
let _mainWindow: BrowserWindow | undefined;
let _driver: webdriver.ThenableWebDriver | undefined;
let _isBusy: boolean = false;

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });
    _mainWindow = mainWindow;
    _mainWindow.setMenu(null);
    _mainWindow.on("close", (event) => {
        // アプリを閉じたときにブラウザを終了する
        dispose();
    });

    ipcMain.on("login", async (_e, profile: string) => {
        addLog("check driver.");
        const downloader = new DriverDownloader();
        await downloader.getBrowserVersion();
        const edgeVersion = await downloader.getBrowserVersion();
        if (edgeVersion === undefined) {
            addLog("edge version unknown.");
            return;
        }
        if (!downloader.isDriverInstalled(__dirname, edgeVersion)) {
            addLog("edge driver installing...");
        }
        const driver = await downloader.getDriver(__dirname, edgeVersion);
        if (driver.path != undefined) {
            addLog(`edge driver ${edgeVersion} installed.`);
            login(driver.path, profile);
        } else {
            addLog(`edge driver install error. ${driver.error}`);
        }
    });
    ipcMain.on("export", (_e) => {
        exportEmote();
    });
    ipcMain.on("import", (_e, emote: string) => {
        importEmote(emote);
    });

    if (isDev) {
        searchDevtools("REACT")
            .then((devtools) => {
                session.defaultSession.loadExtension(devtools, {
                    allowFileAccess: true,
                });
            })
            .catch((err) => console.log(err));

        mainWindow.webContents.openDevTools({ mode: "detach" });
    }

    mainWindow.loadFile("dist/index.html");
};

app.whenReady().then(createWindow);

const addLog = (message: string) => {
    if (_mainWindow != undefined) {
        _mainWindow.webContents.send("send_message", "log", message + "\r\n");
    }
};

const addEmote = (message: string) => {
    if (_mainWindow != undefined) {
        _mainWindow.webContents.send("send_message", "emote", message + "\r\n");
    }
};

const dispose = () => {
    if (_driver != undefined) {
        _driver.quit();
        _driver = undefined;
    }
};

const login = async (driverPath: string, profile: string) => {
    addLog("広場ログイン開始");
    let profilePath = "";
    if (profile.length > 0) {
        addLog(`Profile=${profile}`);
        profilePath = path.join(__dirname, "profiles", profile);
        fs.mkdirSync(profilePath, { recursive: true });
    }
    try {
        dispose();
        const service = new edge.ServiceBuilder(driverPath);
        const edgeOptions = new edge.Options();
        edgeOptions.windowSize({ width: 1100, height: 980 });
        if (profilePath.length > 0) {
            edgeOptions.addArguments(`--user-data-dir=${profilePath}`);
        }
        const driver = new Builder()
            .forBrowser("MicrosoftEdge")
            .setEdgeOptions(edgeOptions)
            .setEdgeService(service)
            .build();
        driver.manage().setTimeouts({ pageLoad: 5000 });
        _driver = driver;
        await driver.get(TargetURL);
    } catch (error) {
        addLog(`ブラウザ起動エラー ${error}`);
    }
};

const exportEmote = async () => {
    if (_driver === undefined) {
        addLog("エラー：広場ログインしてください");
        return;
    }
    const url = await _driver.getCurrentUrl();
    if (!url.startsWith(TargetURL)) {
        addLog("エラー：広場ログインしてください");
        return;
    }
    if (_isBusy) {
        return;
    }
    addLog("設定出力開始");
    try {
        _isBusy = true;
        if (_driver != undefined) {
            for (let i = 0; i < 10; i++) {
                addLog(`${i + 1}ページ目出力中`);
                const pageId = `emote-list-${i}`;
                await getEmotePage(_driver, pageId);
            }
        }
        addLog(`出力終わり`);
    } catch (error) {
        addLog(`出力失敗\r\n> ${error}\r\n中断しました`);
    } finally {
        _isBusy = false;
    }
};

const importEmote = async (emote: string) => {
    if (_driver === undefined) {
        addLog("エラー：広場ログインしてください");
        return;
    }
    const url = await _driver.getCurrentUrl();
    if (!url.startsWith(TargetURL)) {
        addLog("エラー：広場ログインしてください");
        return;
    }
    if (_isBusy) {
        return;
    }
    if (emote.length == 0) {
        addLog("設定を入力してから取り込み開始してください");
        return;
    }
    // 確認ダイアログ
    const options: Electron.MessageBoxSyncOptions = {
        type: "question",
        title: "確認",
        message: "本当に取り込みますか？今の設定は上書きされます",
        buttons: ["OK", "Cancel"],
        cancelId: -1,
    };
    const selected: number = dialog.showMessageBoxSync(options);
    if (selected != 0) {
        addLog("キャンセルされました");
        return;
    }
    // 動作開始
    _isBusy = true;
    addLog("取り込み開始");
    let error_count = 0;
    const settings = emote.split("\r").join("").split("\n");
    for (const setting of settings) {
        let max_retry = 5;
        let last_error: unknown = undefined;
        while (max_retry > 0) {
            max_retry -= 1;
            try {
                if (setting.length > 0) {
                    await setEmote(_driver, setting);
                }
                break;
            } catch (error) {
                // 再読み込み
                // 3回ループ
                last_error = error;
                let error_retry = 3;
                while (error_retry > 0) {
                    try {
                        // 5秒待機する
                        await new Promise((resolve) =>
                            setTimeout(resolve, 5000)
                        );
                        await _driver.get(TargetURL);
                        // 成功したらループ抜ける
                        break;
                    } catch (error) {
                        // エラー時何もしない
                        error_retry -= 1;
                    }
                }
                if (error_retry == 0) {
                    // 対処不能なエラー
                    max_retry = 0;
                }
            }
        }
        if (max_retry == 0) {
            addLog(`エラーが発生しました ${last_error}`);
            error_count += 1;
        }
    }
    _isBusy = false;
    if (error_count == 0) {
        addLog("正常に完了しました");
    } else {
        addLog(`完了 (エラーが ${error_count}件ありました)`);
    }
};

const getOneEmote = async (
    driver: webdriver.ThenableWebDriver,
    pageId: string,
    index: number
) => {
    const emoteData = new EmoteData();
    emoteData.pageId = pageId;
    emoteData.index = index;
    const attrs = await driver.findElements(
        By.xpath(`//*[@id="${pageId}"]/table/tbody/tr[${index}]/td`)
    );
    if (attrs.length < 6) {
        throw Error(`ページ読み込みエラー <element not found>`);
    }
    const typeElement = attrs[1];
    const contentsElement = attrs[2];
    const actionElement = attrs[3];
    const faceElement = attrs[4];
    const timingElement = attrs[5];
    emoteData.type = await typeElement.getText();
    if (emoteData.type === "セリフ") {
        let contents = await contentsElement
            .findElement(By.xpath("./a/span"))
            .getAttribute("innerHTML");
        // 余計な文字消す
        contents = contents
            .split("\r")
            .join("")
            .split("\n")
            .join("")
            .split("\t")
            .join("");
        emoteData.contents = contents;
    } else if (emoteData.type === "スタンプ") {
        const contents = await contentsElement
            .findElement(By.xpath("./a/span/img"))
            .getAttribute("src");
        const stampNo = contents.split("/")[6].split("_")[0];
        const stampName = await contentsElement.getText();
        emoteData.contents = `${stampNo}_${stampName}`;
    } else {
        emoteData.contents = await contentsElement.getText();
    }
    emoteData.action = await actionElement.getText();
    emoteData.face = await faceElement.getText();
    emoteData.timing = await timingElement.getText();
    return emoteData;
};

const getEmotePage = async (
    driver: webdriver.ThenableWebDriver,
    pageId: string
) => {
    /* リストが閉じていたら開く */
    const pageBar = `p1${pageId.split("-")[2]}`;
    const listHolder = await driver.wait(
        webdriver.until.elementLocated(By.xpath(`//*[@id="${pageBar}"]`)),
        6000,
        `error on waiting //*[@id="${pageBar}"]: `
    );
    if (listHolder === undefined) {
        throw Error(`ページ読み込みエラー <element not found>\r\n中断しました`);
    }
    const listHolderStyle = await listHolder.getAttribute("class");
    if (listHolderStyle.indexOf("hide") > 0) {
        await driver.executeScript("arguments[0].click()", listHolder);
        await waitUntilListOpen(
            driver,
            `//*[@id="${pageId}"]/table/tbody/tr[1]/td[3]/a`
        );
    }
    // 読み込み
    for (let i = 0; i < 10; i++) {
        const emoteData = await getOneEmote(driver, pageId, i + 1);
        addEmote(emoteData.emoteToString());
    }
};

const setEmote = async (
    driver: webdriver.ThenableWebDriver,
    setting: string
) => {
    addLog(` ${setting} >処理中<`);
    const emoteData = new EmoteData();

    /* parse */
    try {
        emoteData.emoteFromString(setting);
    } catch (error) {
        addLog("設定を読み込めなかったのでスキップします");
        return;
    }
    if (
        emoteData.type != "セリフ" &&
        emoteData.type != "スタンプ" &&
        emoteData.type != "だいじなもの" &&
        emoteData.type != "その他"
    ) {
        addLog("セリフ・スタンプ以外のためスキップします");
        return;
    }

    /* リストが閉じていたら開く */
    const pageBar = `p1${emoteData.pageId.split("-")[2]}`;
    const listHolder = await driver.wait(
        webdriver.until.elementLocated(By.xpath(`//*[@id="${pageBar}"]`)),
        6000,
        `error on waiting //*[@id="${pageBar}"]`
    );
    if (listHolder === undefined) {
        throw Error(`ページ読み込みエラー <element not found>\r\n中断しました`);
    }
    const listHolderStyle = await listHolder.getAttribute("class");
    if (listHolderStyle.indexOf("hide") > 0) {
        await driver.executeScript("arguments[0].click()", listHolder);
        await waitUntilListOpen(
            driver,
            `//*[@id="${emoteData.pageId}"]/table/tbody/tr[${emoteData.index}]/td[3]/a`
        );
    }

    /* 変更する必要がなければスキップ */
    const currentEmote = await getOneEmote(
        driver,
        emoteData.pageId,
        emoteData.index
    );
    if (currentEmote.emoteToString() === emoteData.emoteToString()) {
        addLog("設定済みのためスキップします");
        return;
    }

    /* 設定ダイアログ開く */
    const openLink = await driver.findElement(
        By.xpath(
            `//*[@id="${emoteData.pageId}"]/table/tbody/tr[${emoteData.index}]/td[3]/a`
        )
    );
    if (openLink === undefined) {
        throw Error("ページ読み込みエラー <openLink>\r\n中断しました");
    }
    await driver.executeScript("arguments[0].click()", openLink);
    await waitUntilDialog(driver);

    if (emoteData.type === "セリフ") {
        await setDialogue(driver, emoteData);
    } else if (emoteData.type === "スタンプ") {
        await setStamp(driver, emoteData);
    } else {
        await setOthers(driver, emoteData);
    }

    /* 変更できたかを確認 */
    const currentEmote2 = await getOneEmote(
        driver,
        emoteData.pageId,
        emoteData.index
    );
    if (currentEmote2.emoteToString() != emoteData.emoteToString()) {
        throw Error("設定後確認時エラー");
    }
};

const setDialogue = async (
    driver: webdriver.ThenableWebDriver,
    emoteData: EmoteData
) => {
    /* ラジオボタン　→　セリフ */
    const rButton = await driver.findElement(
        By.xpath(
            '//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[3]/div[1]/label/input'
        )
    );
    await driver.executeScript("arguments[0].click()", rButton);
    /* テキストエリア */
    const contentsArea = await driver.findElement(
        By.xpath(
            '//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[4]/textarea'
        )
    );
    await contentsArea.clear();
    if (emoteData.contents != "（なし）") {
        contentsArea.sendKeys(emoteData.contentsToKey());
    }
    /* しぐさ */
    const actionElem = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[5]/div[1]/select/option[text()='${emoteData.action}']`
        )
    );
    if (actionElem != undefined) {
        await actionElem.click();
    } else {
        addLog(`しぐさ ${emoteData.action}の設定に失敗しました`);
    }
    /* 表情 */
    const faceElem = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[6]/div[1]/select/option[text()='${emoteData.face}']`
        )
    );
    if (faceElem != undefined) {
        await faceElem.click();
    } else {
        addLog(`表情 ${emoteData.face}の設定に失敗しました`);
    }
    /* タイミング */
    const timingElem = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[7]/div[1]/select/option[text()='${emoteData.timing}']`
        )
    );
    if (timingElem != undefined) {
        await timingElem.click();
    } else {
        addLog(`発言タイミング ${emoteData.timing}の設定に失敗しました`);
    }
    /* 登録 */
    await registerOrCancelAndDialogClear(driver, true);
};

const setStamp = async (
    driver: webdriver.ThenableWebDriver,
    emoteData: EmoteData
) => {
    /* ラジオボタン　→　スタンプ */
    const rButton = await driver.findElement(
        By.xpath(
            '//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[3]/div[2]/label/input'
        )
    );
    await driver.executeScript("arguments[0].click()", rButton);
    /* スタンプ */
    const openButton = await driver.findElement(
        By.xpath(
            '//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[4]/table/tbody/tr/td[2]/div'
        )
    );
    await driver.executeScript("arguments[0].click()", openButton);
    const targetStampNo = emoteData.contents.split("_")[0];
    const stampButton = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[4]/table/tbody/tr/td[2]/div/div[2]//a[@data-value='${targetStampNo}']`
        )
    );
    if (stampButton != undefined) {
        await driver.executeScript("arguments[0].click()", stampButton);
    } else {
        addLog(`スタンプ ${emoteData.contents}の設定に失敗しました`);
    }
    /* しぐさ */
    const actionElem = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[5]/div[1]/select/option[text()='${emoteData.action}']`
        )
    );
    if (actionElem != undefined) {
        await actionElem.click();
    } else {
        addLog(`しぐさ ${emoteData.action}の設定に失敗しました`);
    }
    /* 表情 */
    const faceElem = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[6]/div[1]/select/option[text()='${emoteData.face}']`
        )
    );
    if (faceElem != undefined) {
        await faceElem.click();
    } else {
        addLog(`表情 ${emoteData.face}の設定に失敗しました`);
    }
    /* 登録 */
    await registerOrCancelAndDialogClear(driver, true);
};

const setOthers = async (
    driver: webdriver.ThenableWebDriver,
    emoteData: EmoteData
) => {
    /* ラジオボタン　→　だいじなもの or その他 */
    const radioButtonNum = emoteData.type === "だいじなもの" ? 3 : 4;
    const rButton = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[3]/div[${radioButtonNum}]/label/input`
        )
    );
    await driver.executeScript("arguments[0].click()", rButton);
    /* だいじなもの or その他 */
    const selectElemNum = emoteData.type === "だいじなもの" ? 1 : 2;
    const othersElem = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[4]/div[${selectElemNum}]/select/option[text()='${emoteData.contents}']`
        )
    );
    if (othersElem != undefined) {
        await othersElem.click();
    } else {
        addLog(`${emoteData.type} ${emoteData.contents}の設定に失敗しました`);
    }
    /* 登録 */
    await registerOrCancelAndDialogClear(driver, true);
};

const waitUntilListOpen = async (
    driver: webdriver.ThenableWebDriver,
    xpath: string
) => {
    await driver.wait(
        async () => {
            try {
                const list = await driver
                    .findElement(By.xpath(xpath))
                    .catch((e) => {
                        return undefined;
                    });
                if (list === undefined) {
                    return false;
                }
                const visible = await list.isDisplayed();
                if (!visible) {
                    return false;
                }
            } catch (error) {
                return false;
            }
            return true;
        },
        6000,
        "error on waitUntilListOpen()"
    );
};

const waitUntilDialog = async (driver: webdriver.ThenableWebDriver) => {
    await driver.wait(
        async () => {
            try {
                const dlg = await driver
                    .findElement(By.xpath('//*[@id="_mdlg_dlg"]'))
                    .catch((e) => {
                        return undefined;
                    });
                if (dlg === undefined) {
                    return false;
                }
                const visible = await dlg.isDisplayed();
                if (!visible) {
                    return false;
                }
            } catch (error) {
                return false;
            }
            try {
                const form = await driver.findElement(
                    By.name("preferenceActionForm")
                );
                const visible = await form.isDisplayed();
                if (!visible) {
                    return false;
                }
            } catch (error) {
                return false;
            }
            return true;
        },
        6000,
        "error on waitUntilDialog()"
    );
};

const registerOrCancelAndDialogClear = async (
    driver: webdriver.ThenableWebDriver,
    isRegister: boolean
) => {
    let max_retry = 5;
    let last_error: unknown = undefined;
    while (max_retry > 0) {
        max_retry -= 1;
        const buttonNumber = isRegister ? 3 : 1;
        const registerOrCancelButton = await driver.findElement(
            By.xpath(
                `//*[@id="emotemsg-edit-modal"]/div/div/form/table[2]/tbody/tr/td[${buttonNumber}]/p/a`
            )
        );
        if (registerOrCancelButton != undefined) {
            await driver.executeScript(
                "arguments[0].click()",
                registerOrCancelButton
            );
        } else {
            return;
        }

        try {
            await driver.wait(
                async () => {
                    try {
                        const dlg = await driver
                            .findElement(By.xpath('//*[@id="_mdlg_dlg"]'))
                            .catch((e) => {
                                return undefined;
                            });
                        if (dlg === undefined) {
                            return true;
                        }
                        const visible = await dlg.isDisplayed();
                        if (!visible) {
                            return true;
                        }
                        return false;
                    } catch (error) {
                        return true;
                    }
                },
                6000,
                "waitUntilDialogClear()"
            );
            return;
        } catch (error) {
            last_error = error;
        }
    }
    throw last_error;
};

class EmoteData {
    pageId: string = "";
    index: number = -1;
    type: string = "";
    contents: string = "";
    action: string = "";
    face: string = "";
    timing: string = "";

    emoteToString(): string {
        const settings = `${this.pageId}\t${this.index}\t${this.type}\t${this.contents}\t${this.action}\t${this.face}\t${this.timing}`;
        return settings;
    }

    emoteFromString(settings: string) {
        const u = settings.split("\t");
        if (u.length != 7) {
            throw Error(`parse error`);
        }
        this.pageId = u[0];
        this.index = Number(u[1]);
        this.type = u[2];
        this.contents = u[3];
        this.action = u[4];
        this.face = u[5];
        this.timing = u[6];
    }

    contentsToKey(): string {
        return this.contents
            .split("&nbsp;")
            .join(" ")
            .split("&amp;")
            .join("&")
            .split("&lt;")
            .join("<")
            .split("&gt;")
            .join(">")
            .split("<br>")
            .join("\r\n");
    }
}
