/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import path from "path";
import * as compressing from "compressing";
import * as util from "util";
import * as child_process from "child_process";
import { APP_CONFIG } from "./config/app-config";
import { SecureFileManager } from "./security/secure-file-manager";
import {
    RegistryValidator,
    SecurityError,
} from "./security/security-validator";
import { Logger, ConsoleLogger } from "./utils/logger";

const CDN_URL = "https://msedgedriver.microsoft.com/";
const POWERSHELL_EXECUTABLE = "powershell.exe";
const POWERSHELL_FIXED_ARGS = [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
] as const;

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
                APP_CONFIG.REGISTRY.EDGE_PATH
            );
            if (!exePath) {
                this.logger.warn("Edge executable path not found in registry");
                return undefined;
            }

            const version = await this.getWindowsExeVersion(exePath);
            if (!version) {
                this.logger.error(
                    `Failed to extract Edge product version from: ${exePath}`
                );
                return undefined;
            }

            this.logger.debug(`Detected Edge version: ${version}`);
            return version;
        } catch (error) {
            if (error instanceof SecurityError) {
                this.logger.error(
                    "Security violation in browser version discovery",
                    error
                );
                throw error;
            }
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
            const validatedRegPath = RegistryValidator.validateRegistryPath(
                regPath
            );
            const registryLiteral = this.toPowerShellSingleQuotedLiteral(
                this.toRegistryProviderPath(validatedRegPath)
            );
            const exePath = await this.runPowerShellQuery(
                `(Get-Item -LiteralPath ${registryLiteral}).GetValue('')`
            );

            if (!exePath) {
                this.logger.warn(`Registry path does not exist: ${regPath}`);
                return undefined;
            }

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

    private async getWindowsExeVersion(
        exePath: string
    ): Promise<string | undefined> {
        const exePathLiteral = this.toPowerShellSingleQuotedLiteral(exePath);
        const version = await this.runPowerShellQuery(
            `(Get-Item -LiteralPath ${exePathLiteral}).VersionInfo.ProductVersion`
        );

        if (!version) {
            this.logger.warn(`Version query returned empty output: ${exePath}`);
            return undefined;
        }

        return version;
    }

    private async runPowerShellQuery(command: string): Promise<string> {
        const runCommand = util.promisify(child_process.execFile);
        const result = await runCommand(
            POWERSHELL_EXECUTABLE,
            [...POWERSHELL_FIXED_ARGS, command],
            {
                timeout: 10000,
                maxBuffer: 1024,
                windowsHide: true,
            }
        );

        return result.stdout.trim();
    }

    private toPowerShellSingleQuotedLiteral(value: string): string {
        return `'${value.replace(/'/g, "''")}'`;
    }

    private toRegistryProviderPath(regPath: string): string {
        return `Registry::${regPath.replace("HKLM\\", "HKEY_LOCAL_MACHINE\\")}`;
    }

    private getDriverPath(basePath: string, version: string): string {
        return path.join(basePath, "win64", version, "msedgedriver.exe");
    }
}
