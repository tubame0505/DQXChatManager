/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import * as axios from "axios";
import path from "path";
import * as fs from "fs";
import * as compressing from "compressing";
import * as util from "util";
import * as regedit from "regedit";
import * as child_process from "child_process";

const WINDOWS_REGISTRY_APP_PATHS =
    "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\" +
    "msedge.exe";
const CDN_URL = "https://msedgedriver.azureedge.net/";

/* for Windows only */
export class DriverDownloader {
    getArchitecture() {
        const platform = process.platform;
        if (
            platform !== "linux" &&
            platform !== "darwin" &&
            platform !== "win32"
        ) {
            return undefined;
        }
        if (platform === "darwin") {
            return { platform: "mac", bitness: "64" };
        }
        if (platform === "win32") {
            return { platform: "win", bitness: "32" };
        }
        return undefined;
    }

    async getDriver(basePath: string, version: string | undefined = undefined) {
        if (version === undefined) {
            version = await this.getBrowserVersion();
        }
        if (version === undefined) {
            return {
                path: undefined,
                error: "getBroserversion error.",
            };
        }
        // Check downloadad?
        const driverBasePath = path.join(basePath, "win64");
        const driverPath = this.getDriverPath(basePath, version);
        const driverDir = path.dirname(driverPath);
        const url = `${CDN_URL}/${version}/edgedriver_win64.zip`;
        try {
            fs.mkdirSync(driverBasePath, { recursive: true });
            if (this.isDriverInstalled(basePath, version)) {
                return { path: driverPath, error: undefined };
            }
            // remove old driver
            const dirs = fs.readdirSync(driverBasePath).filter((file) => {
                return fs
                    .statSync(path.join(driverBasePath, file))
                    .isDirectory();
            });
            dirs.forEach((dir) => {
                try {
                    fs.rmSync(path.join(driverBasePath, dir), {
                        recursive: true,
                        force: true,
                    });
                } catch {
                    // nop
                }
            });
            // download
            fs.mkdirSync(driverDir, { recursive: true });
            const response = await axios.default.get(url, {
                responseType: "arraybuffer",
            });
            const data = Buffer.from(response.data);
            fs.writeFileSync(driverDir + "/temp.zip", data);
            await compressing.zip.uncompress(
                driverDir + "/temp.zip",
                driverDir
            );
            fs.unlinkSync(driverDir + "/temp.zip");
            return { path: driverPath, error: undefined };
        } catch (error) {
            //console.error(`getLatestDriver error ${error}`);
            return {
                path: undefined,
                error: `getLatestDriver error ${error}`,
            };
        }
    }

    isDriverInstalled(basePath: string, version: string) {
        const driverPath = this.getDriverPath(basePath, version);
        return fs.existsSync(driverPath);
    }

    getDriverPath(basePath: string, version: string) {
        return path.join(basePath, "win64", version, "msedgedriver.exe");
    }

    async getBrowserVersion() {
        const platform = process.platform;
        if (platform != "win32") {
            return undefined;
        }
        const exePath = await this.getWindowsExePath(
            WINDOWS_REGISTRY_APP_PATHS
        );
        if (exePath === undefined) {
            return undefined;
        }
        try {
            const runCommand = util.promisify(child_process.execFile);
            const exeVersion = await runCommand("powershell", [
                `(Get-Item "${exePath}").VersionInfo.ProductVersion`,
            ]);
            return exeVersion.stdout.split("\r")[0];
        } catch (error) {
            return undefined;
        }
    }

    async getWindowsExePath(regPath: string) {
        const regQuery: (
            arg1: readonly string[],
            arg2: string
        ) => Promise<unknown> = util.promisify(regedit.list);
        try {
            let result: any = await regQuery([regPath], "64");
            if (!result[regPath].exists || !result[regPath].values[""]) {
                result = await regQuery([regPath], "32");
            }
            if (!result[regPath].exists || !result[regPath].values[""]) {
                return undefined;
            }
            const exePath: string = result[regPath].values[""].value;
            return exePath;
        } catch (error) {
            return undefined;
        }
    }
}
