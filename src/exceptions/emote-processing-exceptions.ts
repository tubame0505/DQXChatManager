/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */

export class EmoteProcessingError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly context?: any
    ) {
        super(message);
        this.name = "EmoteProcessingError";
    }
}

export class WebDriverError extends Error {
    constructor(
        message: string,
        public readonly operation: string,
        public readonly xpath?: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = "WebDriverError";
    }
}

export class EmoteValidationError extends Error {
    constructor(
        message: string,
        public readonly emoteData: any,
        public readonly field?: string
    ) {
        super(message);
        this.name = "EmoteValidationError";
    }
}

export class PageLoadError extends Error {
    constructor(
        message: string,
        public readonly pageId: string,
        public readonly url?: string
    ) {
        super(message);
        this.name = "PageLoadError";
    }
}

export class DialogOperationError extends Error {
    constructor(
        message: string,
        public readonly dialogType: string,
        public readonly operation: string
    ) {
        super(message);
        this.name = "DialogOperationError";
    }
}
