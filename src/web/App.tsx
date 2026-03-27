/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */
import React, { useState, useRef, useEffect } from "react";
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

    // コンテキストメニューの表示処理
    const handleContextMenu = (
        event: React.MouseEvent<HTMLTextAreaElement>,
        targetId: string,
        isReadOnly: boolean = false
    ) => {
        event.preventDefault();
        const textarea = event.currentTarget;
        const selectedText = textarea.value.substring(
            textarea.selectionStart,
            textarea.selectionEnd
        );
        const hasSelection = selectedText.length > 0;
        const hasClipboardText = true; // クリップボードのチェックは簡略化

        myAPI.showContextMenu({
            targetId,
            selectedText,
            hasSelection,
            isReadOnly,
            hasClipboardText,
        });
    };

    // メニューアクション処理関数
    const handleMenuAction = (data: { action: string; targetId: string }) => {
        const targetTextarea =
            data.targetId === "emotedata"
                ? textareaRef.current
                : stateareaRef.current;
        if (!targetTextarea) return;

        switch (data.action) {
            case "cut":
                if (data.targetId === "emotedata") {
                    const selectedText = targetTextarea.value.substring(
                        targetTextarea.selectionStart,
                        targetTextarea.selectionEnd
                    );
                    myAPI.clipboardCut(data.targetId, selectedText);
                }
                break;
            case "copy":
                const selectedText = targetTextarea.value.substring(
                    targetTextarea.selectionStart,
                    targetTextarea.selectionEnd
                );
                myAPI.clipboardCopy(selectedText);
                break;
            case "paste":
                if (data.targetId === "emotedata") {
                    myAPI
                        .clipboardPaste(data.targetId)
                        .then((result: { targetId: string; text: string }) => {
                            const start = targetTextarea.selectionStart;
                            const end = targetTextarea.selectionEnd;
                            const newValue =
                                emoteData.substring(0, start) +
                                result.text +
                                emoteData.substring(end);
                            setEmoteData(newValue);
                            setTimeout(() => {
                                targetTextarea.setSelectionRange(
                                    start + result.text.length,
                                    start + result.text.length
                                );
                                targetTextarea.focus();
                            }, 0);
                        });
                }
                break;
            case "delete":
                if (data.targetId === "emotedata") {
                    myAPI.textDelete(data.targetId);
                }
                break;
            case "selectAll":
                targetTextarea.select();
                break;
        }
    };

    const handleCutAction = (targetId: string) => {
        if (targetId === "emotedata") {
            const targetTextarea = textareaRef.current;
            if (!targetTextarea) return;

            const start = targetTextarea.selectionStart;
            const end = targetTextarea.selectionEnd;
            const newValue =
                emoteData.substring(0, start) + emoteData.substring(end);
            setEmoteData(newValue);

            setTimeout(() => {
                targetTextarea.setSelectionRange(start, start);
                targetTextarea.focus();
            }, 0);
        }
    };

    const handleDeleteAction = (targetId: string) => {
        if (targetId === "emotedata") {
            const targetTextarea = textareaRef.current;
            if (!targetTextarea) return;

            const start = targetTextarea.selectionStart;
            const end = targetTextarea.selectionEnd;
            const newValue =
                emoteData.substring(0, start) + emoteData.substring(end);
            setEmoteData(newValue);

            setTimeout(() => {
                targetTextarea.setSelectionRange(start, start);
                targetTextarea.focus();
            }, 0);
        }
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
        setEmoteData((prev) => {
            const updatedEmoteData = prev + message;
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(
                updatedEmoteData.length,
                updatedEmoteData.length
            );
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
        } else if (target === "menu-action") {
            try {
                const data = JSON.parse(message);
                handleMenuAction(data);
            } catch (error) {
                console.error("Error parsing menu action:", error);
            }
        } else if (target === "execute-cut") {
            handleCutAction(message);
        } else if (target === "execute-delete") {
            handleDeleteAction(message);
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
                    onContextMenu={(e) =>
                        handleContextMenu(e, "emotedata", false)
                    }
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
                    onContextMenu={(e) =>
                        handleContextMenu(e, "statedata", true)
                    }
                />
            </div>
        </div>
    );
};
