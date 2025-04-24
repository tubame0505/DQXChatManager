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
    const [profile, setProfile] = useState("");

    const onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEmoteData(event.currentTarget.value);
    };

    const onStateMessage = (message: string) => {
        setStateData((prev) => {
            const updatedStateData = prev + message;
            stateareaRef.current?.focus();
            stateareaRef.current?.setSelectionRange(updatedStateData.length, updatedStateData.length);
            return updatedStateData;
        });
    };

    const onEmoteMessage = (message: string) => {
        setEmoteData((prev) => {
            const updatedEmoteData = prev + message;
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(updatedEmoteData.length, updatedEmoteData.length);
            return updatedEmoteData;
        });
    };

    const onLogin = () => myAPI.login(profile);

    const onExport = () => {
        setEmoteData(""); // Clear
        myAPI.export();
    };

    const onImport = () => myAPI.import(emoteData);

    const onSelectProfile = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setProfile(event.target.value);
    };

    const messageListener = (target: string, message: string): void => {
        if (target === "log") {
            onStateMessage(message);
        } else if (target === "emote") {
            onEmoteMessage(message);
        }
    };

    if (messageHandler) {
        messageHandler();
    }
    messageHandler = myAPI.onReceiveMessage(messageListener);

    return (
        <div className="container">
            <div>
                <button onClick={onLogin}>広場ログイン</button>
                <select value={profile} onChange={onSelectProfile}>
                    <option value="">No Profile</option>
                    <option value="Profile1">Profile1</option>
                    <option value="Profile2">Profile2</option>
                    <option value="Profile3">Profile3</option>
                    <option value="Profile4">Profile4</option>
                </select>
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
                    onChange={onTextChange}
                />
            </div>
            <div id="statedata">
                <textarea
                    ref={stateareaRef}
                    value={stateData}
                    cols={100}
                    rows={12}
                    spellCheck={false}
                    readOnly
                />
            </div>
        </div>
    );
};
