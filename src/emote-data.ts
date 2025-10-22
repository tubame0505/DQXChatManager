import { ContentSanitizer } from "./security/content-sanitizer";
import { EmoteType, PageId } from "./config/app-config";
import { EmoteValidationError } from "./exceptions/emote-processing-exceptions";

export interface IEmoteData {
    pageId: PageId;
    index: number;
    type: EmoteType;
    contents: string;
    action: string;
    face: string;
    timing: string;
}

export class EmoteData implements IEmoteData {
    pageId: PageId = "" as PageId;
    index: number = -1;
    type: EmoteType = "セリフ";
    contents: string = "";
    action: string = "";
    face: string = "";
    timing: string = "";

    constructor(data?: Partial<IEmoteData>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    emoteToString(): string {
        return `${this.pageId}\t${this.index}\t${this.type}\t${this.contents}\t${this.action}\t${this.face}\t${this.timing}`;
    }

    /**
     * 正規化された文字列比較用
     * タグと\r\nの違いを吸収して比較する
     */
    emoteToNormalizedString(): string {
        const normalizedContents = ContentSanitizer.normalizeForComparison(
            this.contents
        );
        return `${this.pageId}\t${this.index}\t${this.type}\t${normalizedContents}\t${this.action}\t${this.face}\t${this.timing}`;
    }

    emoteFromString(settings: string): void {
        const parts = settings.split("\t");
        if (parts.length !== 7) {
            throw new EmoteValidationError(
                `Invalid format: expected 7 parts, got ${parts.length}`,
                { settings, parts }
            );
        }

        this.pageId = this.validatePageId(parts[0]);
        this.index = this.validateIndex(parts[1]);
        this.type = this.validateEmoteType(parts[2]);
        this.contents = parts[3] || "";
        this.action = parts[4] || "";
        this.face = parts[5] || "";
        this.timing = parts[6] || "";
    }

    contentsToKey(): string {
        return this.contents
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/<br>/g, "\r\n");
    }

    /**
     * エモートデータの検証
     */
    validate(): boolean {
        try {
            this.validatePageId(this.pageId);
            this.validateIndex(this.index.toString());
            this.validateEmoteType(this.type);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * エモートデータのクローンを作成
     */
    clone(): EmoteData {
        return new EmoteData({
            pageId: this.pageId,
            index: this.index,
            type: this.type,
            contents: this.contents,
            action: this.action,
            face: this.face,
            timing: this.timing,
        });
    }

    private validatePageId(pageId: string): PageId {
        if (!pageId || !pageId.startsWith("emote-list-")) {
            throw new EmoteValidationError(
                `Invalid pageId: ${pageId}`,
                { pageId },
                "pageId"
            );
        }
        return pageId as PageId;
    }

    private validateIndex(indexStr: string): number {
        const index = Number(indexStr);
        if (isNaN(index) || index < 1 || index > 10) {
            throw new EmoteValidationError(
                `Invalid index: ${indexStr}`,
                { index: indexStr },
                "index"
            );
        }
        return index;
    }

    private validateEmoteType(type: string): EmoteType {
        const validTypes: EmoteType[] = [
            "セリフ",
            "スタンプ",
            "だいじなもの",
            "その他",
        ];
        if (!validTypes.includes(type as EmoteType)) {
            throw new EmoteValidationError(
                `Invalid emote type: ${type}`,
                { type },
                "type"
            );
        }
        return type as EmoteType;
    }

    /**
     * 文字列を安全にEmoteTypeに変換
     */
    static toEmoteType(type: string): EmoteType {
        const validTypes: EmoteType[] = [
            "セリフ",
            "スタンプ",
            "だいじなもの",
            "その他",
        ];
        if (validTypes.includes(type as EmoteType)) {
            return type as EmoteType;
        }
        // デフォルトはセリフ
        return "セリフ";
    }

    /**
     * 文字列を安全にPageIdに変換
     */
    static toPageId(pageId: string): PageId {
        if (pageId && pageId.startsWith("emote-list-")) {
            return pageId as PageId;
        }
        return "emote-list-0" as PageId;
    }
}
