/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import React, { useState, useRef } from "react";
import "./App.css";

const { myAPI } = window;
let messageHandler: (() => void) | undefined = undefined;

export const App = () => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const stateareaRef = useRef<HTMLTextAreaElement>(null);
    const [emoteData, setEmoteData] = useState("");
    const [stateData, setStateData] = useState("広場ログインしてください\r\n");

    const onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEmoteData(event.currentTarget.value);
    };
    const onStateMessage = (message: string) => {
        setStateData((stateData) => stateData + message);
        stateareaRef.current?.focus();
        stateareaRef.current?.setSelectionRange(
            stateData.length,
            stateData.length
        );
        // Memo: こうしないとキレイにスクロールされない
        textareaRef.current?.focus();
        textareaRef.current?.blur();
        stateareaRef.current?.blur();
    };
    const onEmoteMessage = (message: string) => {
        setEmoteData((emoteData) => emoteData + message);
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(
            emoteData.length,
            emoteData.length
        );
        // Memo: こうしないとキレイにスクロールされない
        stateareaRef.current?.focus();
        textareaRef.current?.blur();
        stateareaRef.current?.blur();
    };
    const onLogin = () => {
        myAPI.login();
    };
    const onExport = () => {
        setEmoteData((emoteData) => ""); // Clear
        myAPI.export();
    };
    const onImport = () => {
        myAPI.import(emoteData);
    };
    const messageListener = (target: string, message: string): void => {
        if (target === "log") {
            onStateMessage(message);
        } else if (target === "emote") {
            onEmoteMessage(message);
        }
    };
    if (messageHandler != undefined) {
        messageHandler();
    }
    messageHandler = myAPI.onReceiveMessage(messageListener);

    return (
        <div className="container">
            <div>
                <button onClick={onLogin}>広場ログイン</button>
                <button onClick={onExport}>設定をテキストへ出力</button>
                <button onClick={onImport}>設定をテキストから取り込み</button>
            </div>
            <div id="emotedata">
                <textarea
                    ref={textareaRef}
                    value={emoteData}
                    cols={120}
                    rows={27}
                    spellCheck={false}
                    onChange={(e) => onTextChange(e)}
                />
            </div>
            <div id="statedata">
                <textarea
                    ref={stateareaRef}
                    value={stateData}
                    cols={100}
                    rows={12}
                    spellCheck={false}
                    readOnly={true}
                />
            </div>
        </div>
    );
};
