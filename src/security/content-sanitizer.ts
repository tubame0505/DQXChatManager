/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */

export class ContentSanitizer {
    /**
     * HTMLコンテンツから安全にテキストを抽出する
     * XSS攻撃を防ぐためにHTMLタグを除去し、エンティティをデコードする
     */
    static extractSafeTextContent(html: string): string {
        if (!html || typeof html !== "string") {
            return "";
        }

        // \r, \n, \tの削除
        return html
            .split("\r")
            .join("")
            .split("\n")
            .join("")
            .split("\t")
            .join("");
    }

    /**
     * エモート比較用の正規化
     * <br>タグと\r\n、&nbsp;とスペースを統一して比較可能にする
     */
    static normalizeForComparison(text: string): string {
        if (!text || typeof text !== "string") {
            return "";
        }

        return text
            .replace(/<br\s*\/?>/gi, "\r\n")
            .replace(/&nbsp;/gi, " ")
            .replace(/\r\n/g, "\r\n")
            .trim();
    }

    /**
     * URLの安全性を検証する
     */
    static validateUrl(url: string): boolean {
        try {
            const parsedUrl = new URL(url);
            // HTTPSまたはHTTPのみ許可
            return (
                parsedUrl.protocol === "https:" ||
                parsedUrl.protocol === "http:"
            );
        } catch {
            return false;
        }
    }

    /**
     * スタンプコンテンツから安全にスタンプ番号を抽出する
     */
    static extractStampNumber(stampContent: string): string {
        if (!stampContent || typeof stampContent !== "string") {
            return "";
        }

        // スタンプURLからスタンプ番号を安全に抽出
        const urlParts = stampContent.split("/");
        if (urlParts.length < 7) {
            return "";
        }

        const stampFileName = urlParts[6];
        const stampParts = stampFileName.split("_");
        if (stampParts.length === 0) {
            return "";
        }

        const stampNumber = stampParts[0];
        // 数字のみ許可
        if (!/^\d+$/.test(stampNumber)) {
            return "";
        }

        return stampNumber;
    }
}
