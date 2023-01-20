/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
export interface IElectronAPI {
    login: (profile: string) => void;
    export: () => void;
    import: (emoteData: string) => void;
    onReceiveMessage: (
        listener: (target: string, message: string) => void
    ) => () => void;
}

declare global {
    interface Window {
        myAPI: IElectronAPI;
    }
}
