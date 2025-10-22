/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import * as fs from "fs";
import path from "path";
import { SecurityError } from "./security-validator";

export class SecureFileManager {
    /**
     * 安全なディレクトリクリーンアップ
     * Path Traversal攻撃を防ぐため、許可されたベースパス内のみで動作
     */
    static async safeDirectoryCleanup(
        targetDir: string,
        allowedBasePath: string
    ): Promise<void> {
        const resolvedTarget = path.resolve(targetDir);
        const resolvedBase = path.resolve(allowedBasePath);

        if (!resolvedTarget.startsWith(resolvedBase)) {
            throw new SecurityError("Directory operation outside allowed path");
        }

        try {
            const stats = await fs.promises.stat(resolvedTarget);
            if (stats.isDirectory()) {
                await fs.promises.rm(resolvedTarget, {
                    recursive: true,
                    force: true,
                });
            }
        } catch (error: any) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }
    }

    /**
     * 安全なディレクトリ作成
     */
    static async safeCreateDirectory(
        targetPath: string,
        allowedBasePath: string
    ): Promise<void> {
        const resolvedTarget = path.resolve(targetPath);
        const resolvedBase = path.resolve(allowedBasePath);

        if (!resolvedTarget.startsWith(resolvedBase)) {
            throw new SecurityError("Directory creation outside allowed path");
        }

        await fs.promises.mkdir(resolvedTarget, { recursive: true });
    }

    /**
     * 安全なファイル書き込み
     */
    static async safeWriteFile(
        filePath: string,
        data: Buffer,
        allowedBasePath: string
    ): Promise<void> {
        const resolvedFile = path.resolve(filePath);
        const resolvedBase = path.resolve(allowedBasePath);

        if (!resolvedFile.startsWith(resolvedBase)) {
            throw new SecurityError("File write outside allowed path");
        }

        await fs.promises.writeFile(resolvedFile, data);
    }

    /**
     * 安全なファイル削除
     */
    static async safeDeleteFile(
        filePath: string,
        allowedBasePath: string
    ): Promise<void> {
        const resolvedFile = path.resolve(filePath);
        const resolvedBase = path.resolve(allowedBasePath);

        if (!resolvedFile.startsWith(resolvedBase)) {
            throw new SecurityError("File deletion outside allowed path");
        }

        try {
            await fs.promises.unlink(resolvedFile);
        } catch (error: any) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }
    }

    /**
     * 安全なファイル存在確認
     */
    static safeFileExists(filePath: string, allowedBasePath: string): boolean {
        const resolvedFile = path.resolve(filePath);
        const resolvedBase = path.resolve(allowedBasePath);

        if (!resolvedFile.startsWith(resolvedBase)) {
            throw new SecurityError("File access outside allowed path");
        }

        return fs.existsSync(resolvedFile);
    }

    /**
     * 安全なディレクトリ内ファイル一覧取得
     */
    static async safeReadDirectory(
        dirPath: string,
        allowedBasePath: string
    ): Promise<string[]> {
        const resolvedDir = path.resolve(dirPath);
        const resolvedBase = path.resolve(allowedBasePath);

        if (!resolvedDir.startsWith(resolvedBase)) {
            throw new SecurityError("Directory read outside allowed path");
        }

        try {
            return await fs.promises.readdir(resolvedDir);
        } catch (error: any) {
            if (error.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }
}
