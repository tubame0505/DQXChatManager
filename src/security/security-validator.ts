/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import path from "path";

export class SecurityError extends Error {
    constructor(
        message: string,
        public readonly code: string = "SECURITY_VIOLATION"
    ) {
        super(message);
        this.name = "SecurityError";
    }
}

export class PathValidator {
    private static readonly ALLOWED_PROFILE_PATTERN = /^[a-zA-Z0-9_-]{1,50}$/;

    static validateProfileName(profile: string): string {
        if (!profile || profile.trim() === "") {
            return ""; // Empty profile is allowed
        }

        if (!this.ALLOWED_PROFILE_PATTERN.test(profile)) {
            throw new SecurityError("Invalid profile name format");
        }
        return profile;
    }

    static createSecureProfilePath(basePath: string, profile: string): string {
        const validatedProfile = this.validateProfileName(profile);
        if (!validatedProfile) {
            return ""; // Empty profile means no profile path
        }

        const profilePath = path.join(basePath, "profiles", validatedProfile);
        const resolvedBase = path.resolve(basePath);
        const resolvedProfile = path.resolve(profilePath);

        if (!resolvedProfile.startsWith(resolvedBase)) {
            throw new SecurityError("Path traversal attack detected");
        }
        return profilePath;
    }
}

export class RegistryValidator {
    private static readonly ALLOWED_REGISTRY_PATHS = new Set([
        "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe",
    ]);

    static validateRegistryPath(regPath: string): string {
        if (!this.ALLOWED_REGISTRY_PATHS.has(regPath)) {
            throw new SecurityError(`Unauthorized registry path: ${regPath}`);
        }
        return regPath;
    }
}

export class SecurityLogger {
    static logSecurityEvent(event: string, details: any): void {
        console.error(`[SECURITY] ${event}:`, details);
        // 本番環境では専用のセキュリティログシステムに送信
    }
}
