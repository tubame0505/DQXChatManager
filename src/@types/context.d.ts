/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
export interface IElectronAPI {
    login: (profile: string) => void;
    export: () => void;
    import: (emoteData: string) => void;
    onReceiveMessage: (
        listener: (target: string, message: string) => void
    ) => () => void;
    // コンテキストメニュー関連のAPI
    showContextMenu: (data: {
        targetId: string;
        selectedText: string;
        hasSelection: boolean;
        isReadOnly: boolean;
        hasClipboardText: boolean;
    }) => void;
    // クリップボード操作API
    clipboardCut: (targetId: string, selectedText: string) => void;
    clipboardCopy: (selectedText: string) => void;
    clipboardPaste: (
        targetId: string
    ) => Promise<{ targetId: string; text: string }>;
    textDelete: (targetId: string) => void;
    textSelectAll: (targetId: string) => void;
}

declare global {
    interface Window {
        myAPI: IElectronAPI;
    }
}
