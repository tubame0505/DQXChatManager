/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import path from "path";
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

if (isDev) {
    const execPath =
        process.platform === "win32"
            ? "../node_modules/electron/dist/electron.exe"
            : "../node_modules/.bin/electron";

    require("electron-reload")(__dirname, {
        electron: path.resolve(__dirname, execPath),
    });
}

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });
    _mainWindow = mainWindow;
    _mainWindow.setMenu(null);

    ipcMain.on("login", async (_e) => {
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
            login(driver.path);
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
app.once("window-all-closed", () => {
    dispose();
    if (process.platform !== "darwin") {
        app.quit();
    }
});

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

const login = async (driverPath: string) => {
    addLog("広場ログイン開始");
    try {
        dispose();
        const service = new edge.ServiceBuilder(driverPath);
        const edgeOptions = new edge.Options();
        await edgeOptions.windowSize({ width: 1000, height: 1200 });
        const driver = new Builder()
            .forBrowser("MicrosoftEdge")
            .setEdgeOptions(edgeOptions)
            .setEdgeService(service)
            .build();
        //driver.manage().setTimeouts({ implicit: 3000 });
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
                let pageId = `emote-list-${i}`;
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
    const settings = emote.split("\r").join("").split("\n");
    for (const setting of settings) {
        try {
            if (setting.length > 0) {
                await setEmote(_driver, setting);
            }
        } catch (error) {
            addLog(`エラーが発生しました ${error}`);
        }
    }
    _isBusy = false;
    addLog("完了");
};

const getEmotePage = async (
    driver: webdriver.ThenableWebDriver,
    pageId: string
) => {
    const emoteList = await driver.findElement(By.id(pageId));
    const emotes = await emoteList.findElements(By.css("tr"));
    if (emotes.length != 10) {
        throw Error(`ページ読み込みエラー <emotes.length != 10>`);
    }
    for (let i = 0; i < 10; i++) {
        const emoteData = new EmoteData();
        emoteData.pageId = pageId;
        emoteData.index = i + 1;
        const attrs = await emotes[i].findElements(By.css("td"));
        if (attrs.length != 6) {
            throw Error(`ページ読み込みエラー <attrs.length != 6>`);
        }
        emoteData.type = await attrs[1].getText();
        if (emoteData.type === "セリフ") {
            let contents = await attrs[2]
                .findElement(By.css("span"))
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
            const contents = await attrs[2]
                .findElement(By.css("span"))
                .findElement(By.css("img"))
                .getAttribute("src");
            const stampNo = contents.split("/")[6].split("_")[0];
            const stampName = await attrs[2].getText();
            emoteData.contents = `${stampNo}_${stampName}`;
        } else {
            emoteData.contents = await attrs[2].getText();
        }
        emoteData.action = await attrs[3].getText();
        emoteData.face = await attrs[4].getText();
        emoteData.timing = await attrs[5].getText();
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
    if (emoteData.type != "セリフ" && emoteData.type != "スタンプ") {
        addLog("セリフ・スタンプ以外のためスキップします");
        return;
    }
    /* 設定ダイアログ開く */
    const emoteList = await driver.findElement(By.id(emoteData.pageId));
    const emotes = await emoteList.findElements(By.css("tr"));
    if (emotes.length != 10) {
        throw Error(
            "ページ読み込みエラー <emotes.Count != 10>\r\n中断しました"
        );
    }
    const target = emotes[emoteData.index - 1];
    const attrs = await target.findElements(By.css("td"));
    if (attrs.length != 6) {
        throw Error("ページ読み込みエラー <attrs.Count != 6>\r\n中断しました");
    }
    const link = await attrs[2].findElement(By.css("a"));
    await link.click();
    await waitUntilDialog(driver);

    if (emoteData.type === "セリフ") {
        await setDialogue(driver, emoteData);
    } else {
        await setStamp(driver, emoteData);
    }
};

const setDialogue = async (
    driver: webdriver.ThenableWebDriver,
    emoteData: EmoteData
) => {
    /* 値を設定 */
    const dlg = await driver.findElement(By.id("_mdlg_dlg"));
    /* ラジオボタン　→　セリフ */
    await (
        await (
            await (
                await dlg.findElements(By.css("tr"))
            )[1].findElements(By.css("td"))
        )[2].findElements(By.css("input"))
    )[0].click();
    /* テキストエリア */
    const contentsArea = await (
        await (
            await dlg.findElements(By.css("tr"))
        )[1].findElements(By.css("td"))
    )[3].findElement(By.css("textarea"));
    await contentsArea.clear();
    if (emoteData.contents != "（なし）") {
        contentsArea.sendKeys(emoteData.contentsToKey());
    }
    /* しぐさ */
    const actionList = await (
        await (
            await dlg.findElements(By.css("tr"))
        )[1].findElement(By.name("emoteId"))
    ).findElements(By.css("option"));
    let isSetSuccess = false;
    for (let i = 0; i < actionList.length; i++) {
        const actionElem = actionList[i];
        const actionName = await actionElem.getText();
        if (actionName === emoteData.action) {
            await actionElem.click();
            isSetSuccess = true;
            break;
        }
    }
    if (!isSetSuccess) {
        addLog(`しぐさ ${emoteData.action}の設定に失敗しました`);
    }
    /* 表情 */
    const faceList = await (
        await (
            await dlg.findElements(By.css("tr"))
        )[1].findElement(By.name("faceType"))
    ).findElements(By.css("option"));
    isSetSuccess = false;
    for (let i = 0; i < faceList.length; i++) {
        const actionElem = faceList[i];
        const actionName = await actionElem.getText();
        if (actionName === emoteData.face) {
            await actionElem.click();
            isSetSuccess = true;
            break;
        }
    }
    if (!isSetSuccess) {
        addLog(`表情 ${emoteData.face}の設定に失敗しました`);
    }
    /* タイミング */
    const timingList = await (
        await (
            await dlg.findElements(By.css("tr"))
        )[1].findElement(By.name("msgTiming"))
    ).findElements(By.css("option"));
    isSetSuccess = false;
    for (let i = 0; i < timingList.length; i++) {
        const actionElem = timingList[i];
        const actionName = await actionElem.getText();
        if (actionName === emoteData.timing) {
            await actionElem.click();
            isSetSuccess = true;
            break;
        }
    }
    if (!isSetSuccess) {
        addLog(`発言タイミング ${emoteData.timing}の設定に失敗しました`);
    }
    /* 登録 */
    const elems = await dlg.findElements(By.css("p"));
    isSetSuccess = false;
    for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        const elemClass = await elem.getAttribute("class");
        if (elemClass === "btn-reg") {
            const regButton = await elem.findElement(By.css("a"));
            await regButton.click();
            isSetSuccess = true;
            break;
        }
    }
    if (!isSetSuccess) {
        addLog(`登録に失敗しました`);
    }
    await waitUntilDialogClear(driver);
    isSetSuccess = true;
};

const setStamp = async (
    driver: webdriver.ThenableWebDriver,
    emoteData: EmoteData
) => {
    /* 値を設定 */
    const dlg = await driver.findElement(By.id("_mdlg_dlg"));
    /* ラジオボタン　→　スタンプ */
    await (
        await (
            await (
                await dlg.findElements(By.css("tr"))
            )[1].findElements(By.css("td"))
        )[2].findElements(By.css("input"))
    )[1].click();
    /* スタンプ */
    const stampSlecterArea = await (
        await (
            await (
                await dlg.findElements(By.css("tr"))
            )[1].findElements(By.css("td"))
        )[3].findElements(By.css("td"))
    )[1];
    const openButton = await stampSlecterArea.findElement(By.css("div"));
    await openButton.click();
    const stampOptions = await stampSlecterArea.findElements(By.css("div"));
    const targetStampNo = emoteData.contents.split("_")[0];
    for (let i = 0; i < stampOptions.length; i++) {
        const stampOption = stampOptions[i];
        const className = await stampOption.getAttribute("class");
        if (className === "dropdown-option") {
            const button = await stampOption.findElement(By.css("a"));
            const stampNo = await button.getAttribute("data-value");
            if (stampNo === targetStampNo) {
                await button.click();
                break;
            }
        }
    }
    /* しぐさ */
    const actionList = await (
        await (
            await dlg.findElements(By.css("tr"))
        )[1].findElement(By.name("emoteId"))
    ).findElements(By.css("option"));
    let isSetSuccess = false;
    for (let i = 0; i < actionList.length; i++) {
        const actionElem = actionList[i];
        const actionName = await actionElem.getText();
        if (actionName === emoteData.action) {
            await actionElem.click();
            isSetSuccess = true;
            break;
        }
    }
    if (!isSetSuccess) {
        addLog(`しぐさ ${emoteData.action}の設定に失敗しました`);
    }
    /* 表情 */
    const faceList = await (
        await (
            await dlg.findElements(By.css("tr"))
        )[1].findElement(By.name("faceType"))
    ).findElements(By.css("option"));
    isSetSuccess = false;
    for (let i = 0; i < faceList.length; i++) {
        const actionElem = faceList[i];
        const actionName = await actionElem.getText();
        if (actionName === emoteData.face) {
            await actionElem.click();
            isSetSuccess = true;
            break;
        }
    }
    if (!isSetSuccess) {
        addLog(`表情 ${emoteData.action}の設定に失敗しました`);
    }
    /* 登録 */
    const elems = await dlg.findElements(By.css("p"));
    isSetSuccess = false;
    for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        const elemClass = await elem.getAttribute("class");
        if (elemClass === "btn-reg") {
            const regButton = await elem.findElement(By.css("a"));
            await regButton.click();
            isSetSuccess = true;
            break;
        }
    }
    if (!isSetSuccess) {
        addLog(`登録に失敗しました`);
    }
    await waitUntilDialogClear(driver);
    isSetSuccess = true;
};

const waitUntilDialog = async (driver: webdriver.ThenableWebDriver) => {
    await driver.wait(async () => {
        try {
            const dlg = await driver.findElement(By.id("_mdlg_dlg"));
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
    }, 3000);
};

const waitUntilDialogClear = async (driver: webdriver.ThenableWebDriver) => {
    await driver.wait(async () => {
        try {
            const dlg = await driver.findElement(By.id("_mdlg_dlg"));
            const visible = await dlg.isDisplayed();
            if (!visible) {
                return true;
            }
            return false;
        } catch (error) {
            return true;
        }
    }, 3000);
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
            .split("<br>")
            .join("\r\n");
    }
}
