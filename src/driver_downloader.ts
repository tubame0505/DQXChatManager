/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import * as axios from "axios";
import path from "path";
import * as fs from "fs";
import * as compressing from "compressing";
import * as util from "util";
import * as regedit from "regedit";
import * as child_process from "child_process";

const WINDOWS_REGISTRY_APP_PATHS =
    "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe";
const CDN_URL = "https://msedgedriver.azureedge.net/";

/* for Windows only */
export class DriverDownloader {
    getArchitecture() {
        const platform = process.platform;
        if (platform === "darwin") {
            return { platform: "mac", bitness: "64" };
        }
        if (platform === "win32") {
            return { platform: "win", bitness: "32" };
        }
        return undefined;
    }

    async getDriver(basePath: string, version: string | undefined = undefined) {
        if (!version) {
            version = await this.getBrowserVersion();
        }
        if (!version) {
            return { path: undefined, error: "getBrowserVersion error." };
        }

        const driverBasePath = path.join(basePath, "win64");
        const driverPath = this.getDriverPath(basePath, version);
        const driverDir = path.dirname(driverPath);
        const url = `${CDN_URL}/${version}/edgedriver_win64.zip`;

        try {
            fs.mkdirSync(driverBasePath, { recursive: true });
            if (this.isDriverInstalled(basePath, version)) {
                return { path: driverPath, error: undefined };
            }

            const dirs = fs.readdirSync(driverBasePath).filter((file) =>
                fs.statSync(path.join(driverBasePath, file)).isDirectory()
            );
            dirs.forEach((dir) => {
                try {
                    fs.rmSync(path.join(driverBasePath, dir), { recursive: true, force: true });
                } catch {
                    // Ignore errors
                }
            });

            fs.mkdirSync(driverDir, { recursive: true });
            const response = await axios.default.get(url, { responseType: "arraybuffer" });
            if (response.status !== 200) {
                throw new Error(`Failed to download driver: HTTP ${response.status}`);
            }
            const data = Buffer.from(response.data);
            const tempZipPath = path.join(driverDir, "temp.zip");
            fs.writeFileSync(tempZipPath, data);
            await compressing.zip.uncompress(tempZipPath, driverDir);
            fs.unlinkSync(tempZipPath);

            return { path: driverPath, error: undefined };
        } catch (error) {
            console.error("Error during driver download or extraction:", error);
            return { path: undefined, error: `getLatestDriver error ${error}` };
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
        if (process.platform !== "win32") {
            return undefined;
        }

        const exePath = await this.getWindowsExePath(WINDOWS_REGISTRY_APP_PATHS);
        if (!exePath) {
            return undefined;
        }

        try {
            const runCommand = util.promisify(child_process.execFile);
            const exeVersion = await runCommand("powershell", [
                `(Get-Item "${exePath}").VersionInfo.ProductVersion`,
            ]);
            return exeVersion.stdout.split("\r")[0];
        } catch {
            return undefined;
        }
    }

    async getWindowsExePath(regPath: string) {
        const regQuery = util.promisify(regedit.list);
        try {
            let result: any = await regQuery([regPath]);
            if (!result[regPath].exists || !result[regPath].values[""]) {
                result = await regQuery([regPath]);
            }
            if (!result[regPath].exists || !result[regPath].values[""]) {
                return undefined;
            }
            return result[regPath].values[""].value;
        } catch {
            return undefined;
        }
    }
}
