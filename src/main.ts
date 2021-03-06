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
    addLog("????????????????????????");
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
        addLog(`??????????????????????????? ${error}`);
    }
};

const exportEmote = async () => {
    if (_driver === undefined) {
        addLog("????????????????????????????????????????????????");
        return;
    }
    const url = await _driver.getCurrentUrl();
    if (!url.startsWith(TargetURL)) {
        addLog("????????????????????????????????????????????????");
        return;
    }
    if (_isBusy) {
        return;
    }
    addLog("??????????????????");
    try {
        _isBusy = true;
        if (_driver != undefined) {
            for (let i = 0; i < 10; i++) {
                addLog(`${i + 1}?????????????????????`);
                const pageId = `emote-list-${i}`;
                await getEmotePage(_driver, pageId);
            }
        }
        addLog(`???????????????`);
    } catch (error) {
        addLog(`????????????\r\n> ${error}\r\n??????????????????`);
    } finally {
        _isBusy = false;
    }
};

const importEmote = async (emote: string) => {
    if (_driver === undefined) {
        addLog("????????????????????????????????????????????????");
        return;
    }
    const url = await _driver.getCurrentUrl();
    if (!url.startsWith(TargetURL)) {
        addLog("????????????????????????????????????????????????");
        return;
    }
    if (_isBusy) {
        return;
    }
    if (emote.length == 0) {
        addLog("???????????????????????????????????????????????????????????????");
        return;
    }
    // ?????????????????????
    const options: Electron.MessageBoxSyncOptions = {
        type: "question",
        title: "??????",
        message: "?????????????????????????????????????????????????????????????????????",
        buttons: ["OK", "Cancel"],
        cancelId: -1,
    };
    const selected: number = dialog.showMessageBoxSync(options);
    if (selected != 0) {
        addLog("??????????????????????????????");
        return;
    }
    // ????????????
    _isBusy = true;
    addLog("??????????????????");
    const settings = emote.split("\r").join("").split("\n");
    for (const setting of settings) {
        try {
            if (setting.length > 0) {
                await setEmote(_driver, setting);
            }
        } catch (error) {
            addLog(`?????????????????????????????? ${error}`);
        }
    }
    _isBusy = false;
    addLog("??????");
};

const getEmotePage = async (
    driver: webdriver.ThenableWebDriver,
    pageId: string
) => {
    /* ???????????????????????????????????? */
    const pageBar = `p1${pageId.split("-")[2]}`;
    const listHolder = await driver.findElement(
        By.xpath(`//*[@id="${pageBar}"]`)
    );
    if (listHolder === undefined) {
        throw Error(`?????????????????????????????? <element not found>\r\n??????????????????`);
    }
    const listHolderStyle = await listHolder.getAttribute("class");
    if (listHolderStyle.indexOf("hide") > 0) {
        await listHolder.click();
    }
    // ????????????
    for (let i = 0; i < 10; i++) {
        const emoteData = new EmoteData();
        emoteData.pageId = pageId;
        emoteData.index = i + 1;
        const attrs = await driver.findElements(
            By.xpath(`//*[@id="${pageId}"]/table/tbody/tr[${i + 1}]/td`)
        );
        if (attrs.length < 6) {
            throw Error(`?????????????????????????????? <element not found>`);
        }
        const typeElement = attrs[1];
        const contentsElement = attrs[2];
        const actionElement = attrs[3];
        const faceElement = attrs[4];
        const timingElement = attrs[5];
        emoteData.type = await typeElement.getText();
        if (emoteData.type === "?????????") {
            let contents = await contentsElement
                .findElement(By.xpath("./a/span"))
                .getAttribute("innerHTML");
            // ?????????????????????
            contents = contents
                .split("\r")
                .join("")
                .split("\n")
                .join("")
                .split("\t")
                .join("");
            emoteData.contents = contents;
        } else if (emoteData.type === "????????????") {
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
        addEmote(emoteData.emoteToString());
    }
};

const setEmote = async (
    driver: webdriver.ThenableWebDriver,
    setting: string
) => {
    addLog(` ${setting} >?????????<`);
    const emoteData = new EmoteData();
    /* parse */
    try {
        emoteData.emoteFromString(setting);
    } catch (error) {
        addLog("????????????????????????????????????????????????????????????");
        return;
    }
    if (emoteData.type != "?????????" && emoteData.type != "????????????") {
        addLog("????????????????????????????????????????????????????????????");
        return;
    }
    /* ???????????????????????????????????? */
    const pageBar = `p1${emoteData.pageId.split("-")[2]}`;
    const listHolder = await driver.findElement(
        By.xpath(`//*[@id="${pageBar}"]`)
    );
    if (listHolder === undefined) {
        throw Error(`?????????????????????????????? <element not found>\r\n??????????????????`);
    }
    const listHolderStyle = await listHolder.getAttribute("class");
    if (listHolderStyle.indexOf("hide") > 0) {
        await listHolder.click();
        await waitUntilListOpen(
            driver,
            `//*[@id="${emoteData.pageId}"]/table/tbody/tr[${emoteData.index}]/td[3]/a`
        );
    }
    /* ??????????????????????????? */
    const openLink = await driver.findElement(
        By.xpath(
            `//*[@id="${emoteData.pageId}"]/table/tbody/tr[${emoteData.index}]/td[3]/a`
        )
    );
    if (openLink === undefined) {
        throw Error("?????????????????????????????? <openLink>\r\n??????????????????");
    }
    await openLink.click();
    await waitUntilDialog(driver);

    if (emoteData.type === "?????????") {
        await setDialogue(driver, emoteData);
    } else {
        await setStamp(driver, emoteData);
    }
};

const setDialogue = async (
    driver: webdriver.ThenableWebDriver,
    emoteData: EmoteData
) => {
    /* ???????????????????????????????????? */
    await driver
        .findElement(
            By.xpath(
                '//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[3]/div[1]/label/input'
            )
        )
        .click();
    /* ????????????????????? */
    const contentsArea = await driver.findElement(
        By.xpath(
            '//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[4]/textarea'
        )
    );
    await contentsArea.clear();
    if (emoteData.contents != "????????????") {
        contentsArea.sendKeys(emoteData.contentsToKey());
    }
    /* ????????? */
    const actionElem = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[5]/div[1]/select/option[text()='${emoteData.action}']`
        )
    );
    if (actionElem != undefined) {
        actionElem.click();
    } else {
        addLog(`????????? ${emoteData.action}??????????????????????????????`);
    }
    /* ?????? */
    const faceElem = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[6]/div[1]/select/option[text()='${emoteData.face}']`
        )
    );
    if (faceElem != undefined) {
        faceElem.click();
    } else {
        addLog(`?????? ${emoteData.face}??????????????????????????????`);
    }
    /* ??????????????? */
    const timingElem = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[7]/div[1]/select/option[text()='${emoteData.timing}']`
        )
    );
    if (timingElem != undefined) {
        timingElem.click();
    } else {
        addLog(`????????????????????? ${emoteData.timing}??????????????????????????????`);
    }
    /* ?????? */
    const registerButton = await driver.findElement(
        By.xpath(
            '//*[@id="emotemsg-edit-modal"]/div/div/form/table[2]/tbody/tr/td[3]/p/a'
        )
    );
    if (registerButton != undefined) {
        registerButton.click();
    } else {
        addLog(`???????????????????????????`);
    }
    await waitUntilDialogClear(driver);
};

const setStamp = async (
    driver: webdriver.ThenableWebDriver,
    emoteData: EmoteData
) => {
    /* ??????????????????????????????????????? */
    await driver
        .findElement(
            By.xpath(
                '//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[3]/div[2]/label/input'
            )
        )
        .click();
    /* ???????????? */
    const openButton = await driver.findElement(
        By.xpath(
            '//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[4]/table/tbody/tr/td[2]/div'
        )
    );
    await openButton.click();
    const targetStampNo = emoteData.contents.split("_")[0];
    const stampButton = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[4]/table/tbody/tr/td[2]/div/div[2]//a[@data-value='${targetStampNo}']`
        )
    );
    if (stampButton != undefined) {
        stampButton.click();
    } else {
        addLog(`???????????? ${emoteData.contents}??????????????????????????????`);
    }
    /* ????????? */
    const actionElem = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[5]/div[1]/select/option[text()='${emoteData.action}']`
        )
    );
    if (actionElem != undefined) {
        actionElem.click();
    } else {
        addLog(`????????? ${emoteData.action}??????????????????????????????`);
    }
    /* ?????? */
    const faceElem = await driver.findElement(
        By.xpath(
            `//*[@id="emotemsg-edit-modal"]/div/div/form/table[1]/tbody/tr[2]/td[6]/div[1]/select/option[text()='${emoteData.face}']`
        )
    );
    if (faceElem != undefined) {
        faceElem.click();
    } else {
        addLog(`?????? ${emoteData.face}??????????????????????????????`);
    }
    /* ?????? */
    const registerButton = await driver.findElement(
        By.xpath(
            '//*[@id="emotemsg-edit-modal"]/div/div/form/table[2]/tbody/tr/td[3]/p/a'
        )
    );
    if (registerButton != undefined) {
        registerButton.click();
    } else {
        addLog(`???????????????????????????`);
    }
    await waitUntilDialogClear(driver);
};

const waitUntilListOpen = async (
    driver: webdriver.ThenableWebDriver,
    xpath: string
) => {
    await driver.wait(async () => {
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
    }, 3000);
};

const waitUntilDialog = async (driver: webdriver.ThenableWebDriver) => {
    await driver.wait(async () => {
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
    }, 3000);
};

const waitUntilDialogClear = async (driver: webdriver.ThenableWebDriver) => {
    await driver.wait(async () => {
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
