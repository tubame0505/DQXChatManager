/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import path from "path";
import * as compressing from "compressing";
import * as util from "util";
import * as regedit from "regedit";
import * as child_process from "child_process";
import { SecureFileManager } from "./security/secure-file-manager";
import {
    RegistryValidator,
    SecurityError,
} from "./security/security-validator";
import { Logger, ConsoleLogger } from "./utils/logger";

const WINDOWS_REGISTRY_APP_PATHS =
    "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe";
const CDN_URL = "https://msedgedriver.microsoft.com/";

export interface DriverResult {
    path?: string;
    error?: string;
}

/* for Windows only */
export class DriverDownloader {
    private logger: Logger;

    constructor(logger?: Logger) {
        this.logger = logger || new ConsoleLogger();
    }
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

    async getDriver(
        basePath: string,
        version: string | undefined = undefined
    ): Promise<DriverResult> {
        try {
            if (!version) {
                version = await this.getBrowserVersion();
            }
            if (!version) {
                const errorMsg = "getBrowserVersion error.";
                this.logger.error(errorMsg);
                return { error: errorMsg };
            }

            const driverBasePath = path.join(basePath, "win64");
            const driverPath = this.getDriverPath(basePath, version);
            const driverDir = path.dirname(driverPath);
            const url = `${CDN_URL}/${version}/edgedriver_win64.zip`;

            this.logger.debug(`Driver download URL: ${url}`);

            await SecureFileManager.safeCreateDirectory(
                driverBasePath,
                basePath
            );

            if (this.isDriverInstalled(basePath, version)) {
                this.logger.debug(`Driver already installed: ${version}`);
                return { path: driverPath };
            }

            // 既存のドライバーディレクトリを安全にクリーンアップ
            await this.cleanupOldDrivers(driverBasePath, basePath);

            await SecureFileManager.safeCreateDirectory(driverDir, basePath);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            let data: Buffer;
            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(
                        `Failed to download driver: HTTP ${response.status}`
                    );
                }

                const arrayBuffer = await response.arrayBuffer();
                data = Buffer.from(arrayBuffer);
            } finally {
                clearTimeout(timeoutId);
            }

            const tempZipPath = path.join(driverDir, "temp.zip");

            await SecureFileManager.safeWriteFile(tempZipPath, data, basePath);
            await compressing.zip.uncompress(tempZipPath, driverDir);
            await SecureFileManager.safeDeleteFile(tempZipPath, basePath);

            this.logger.info(`インストール完了: ${version}`);
            return { path: driverPath };
        } catch (error) {
            const errorMsg = `Driver download failed: ${error}`;
            this.logger.error(
                errorMsg,
                error instanceof Error ? error : undefined
            );
            return { error: errorMsg };
        }
    }

    private async cleanupOldDrivers(
        driverBasePath: string,
        basePath: string
    ): Promise<void> {
        try {
            const dirs = await SecureFileManager.safeReadDirectory(
                driverBasePath,
                basePath
            );

            for (const dir of dirs) {
                const dirPath = path.join(driverBasePath, dir);
                try {
                    await SecureFileManager.safeDirectoryCleanup(
                        dirPath,
                        basePath
                    );
                } catch (error) {
                    this.logger.warn(
                        `Failed to cleanup directory ${dir}: ${error}`
                    );
                }
            }
        } catch (error) {
            // ディレクトリが存在しない場合は無視
            if (error instanceof SecurityError) {
                throw error; // セキュリティエラーは再スロー
            }
        }
    }

    isDriverInstalled(basePath: string, version: string): boolean {
        try {
            const driverPath = this.getDriverPath(basePath, version);
            return SecureFileManager.safeFileExists(driverPath, basePath);
        } catch (error) {
            this.logger.warn(`Failed to check driver installation: ${error}`);
            return false;
        }
    }

    async getBrowserVersion(): Promise<string | undefined> {
        if (process.platform !== "win32") {
            this.logger.debug("Non-Windows platform detected");
            return undefined;
        }

        try {
            const exePath = await this.getWindowsExePath(
                WINDOWS_REGISTRY_APP_PATHS
            );
            if (!exePath) {
                this.logger.warn("Edge executable path not found in registry");
                return undefined;
            }

            const runCommand = util.promisify(child_process.execFile);
            const result = await runCommand(
                "powershell",
                [`(Get-Item "${exePath}").VersionInfo.ProductVersion`],
                {
                    timeout: 10000, // 10秒タイムアウト
                    maxBuffer: 1024, // バッファサイズ制限
                }
            );

            const version = result.stdout.split("\r")[0].trim();
            this.logger.debug(`Detected Edge version: ${version}`);
            return version;
        } catch (error) {
            this.logger.error(
                "Failed to get browser version",
                error instanceof Error ? error : undefined
            );
            return undefined;
        }
    }

    private async getWindowsExePath(
        regPath: string
    ): Promise<string | undefined> {
        try {
            // セキュリティ検証
            RegistryValidator.validateRegistryPath(regPath);

            const regQuery = util.promisify(regedit.list);
            let result: any = await regQuery([regPath]);

            if (!result[regPath]?.exists || !result[regPath]?.values?.[""]) {
                this.logger.debug(
                    `Registry path not found on first try: ${regPath}`
                );
                result = await regQuery([regPath]);
            }

            if (!result[regPath]?.exists || !result[regPath]?.values?.[""]) {
                this.logger.warn(`Registry path does not exist: ${regPath}`);
                return undefined;
            }

            const exePath = result[regPath].values[""].value;
            this.logger.debug(`Found executable path: ${exePath}`);
            return exePath;
        } catch (error) {
            if (error instanceof SecurityError) {
                this.logger.error(
                    "Security violation in registry access",
                    error
                );
                throw error;
            }
            this.logger.error(
                "Failed to access registry",
                error instanceof Error ? error : undefined
            );
            return undefined;
        }
    }

    private getDriverPath(basePath: string, version: string): string {
        return path.join(basePath, "win64", version, "msedgedriver.exe");
    }
}
