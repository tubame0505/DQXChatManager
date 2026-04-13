/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */

export class ContentSanitizer {
    private static readonly BR_TAG_PATTERN = /<br\s*\/?>/gi;
    private static readonly NBSP_ENTITY_PATTERN = /&nbsp;/gi;
    private static readonly LT_ENTITY_PATTERN = /&lt;/gi;
    private static readonly GT_ENTITY_PATTERN = /&gt;/gi;
    private static readonly AMP_ENTITY_PATTERN = /&amp;/gi;

    /**
     * 比較前の生文字列を扱いやすくするために制御文字だけを除去する
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
     * <br>タグ、HTMLエンティティ、改行差異を吸収して比較可能にする
     */
    static normalizeForComparison(text: string): string {
        return this.normalizeEmoteContent(text);
    }

    /**
     * Selenium送信用に同じ正規化ルールを適用し、改行をCRLFへ揃える
     */
    static prepareForSendKeys(text: string): string {
        return this.toWindowsNewlines(this.normalizeEmoteContent(text));
    }

    private static normalizeEmoteContent(text: string): string {
        if (!text || typeof text !== "string") {
            return "";
        }

        return text
            .replace(this.BR_TAG_PATTERN, "\n")
            .replace(this.NBSP_ENTITY_PATTERN, " ")
            .replace(this.LT_ENTITY_PATTERN, "<")
            .replace(this.GT_ENTITY_PATTERN, ">")
            .replace(this.AMP_ENTITY_PATTERN, "&")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");
        //.trim();
    }

    private static toWindowsNewlines(text: string): string {
        return text.replace(/\n/g, "\r\n");
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
