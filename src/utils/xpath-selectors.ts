/*! DQXChatManager | The MIT License | https://github.com/tubame0505/DQXChatManager/blob/main/LICENSE.md */

/**
 * WebページのXPathセレクターを集約したクラス
 * 変更時の影響範囲を限定し、保守性を向上させる
 */
export class XPathSelectors {
    // ページ関連
    static readonly PAGE_BAR = (pageNumber: string) =>
        `//*[@id="p1${pageNumber}"]`;

    // エモートリスト関連
    static readonly EMOTE_LIST_ROW = (pageId: string, index: number) =>
        `//*[@id="${pageId}"]/table/tbody/tr[${index}]/td`;

    static readonly EMOTE_CONTENT_LINK = (pageId: string, index: number) =>
        `//*[@id="${pageId}"]/table/tbody/tr[${index}]/td[3]/a`;

    // モーダルダイアログ関連
    static readonly MODAL_DIALOG = '//*[@id="_mdlg_dlg"]';
    static readonly PREFERENCE_FORM = "preferenceActionForm";

    // エモート編集モーダル関連
    static readonly EMOTE_MODAL_BASE =
        '//*[@id="emotemsg-edit-modal"]/div/div/form';

    // ラジオボタン
    static readonly DIALOGUE_RADIO = `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[3]/div[1]/label/input`;
    static readonly STAMP_RADIO = `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[3]/div[2]/label/input`;
    static readonly IMPORTANT_ITEM_RADIO = `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[3]/div[3]/label/input`;
    static readonly OTHER_RADIO = `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[3]/div[4]/label/input`;

    // コンテンツ入力フィールド
    static readonly CONTENTS_TEXTAREA = `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[4]/textarea`;

    // スタンプ関連
    static readonly STAMP_OPEN_BUTTON = `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[4]/table/tbody/tr/td[2]/div`;
    static readonly STAMP_BUTTON = (stampNo: string) =>
        `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[4]/table/tbody/tr/td[2]/div/div[2]//a[@data-value='${stampNo}']`;

    // セレクトボックス関連
    static readonly ACTION_SELECT = `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[5]/div[1]/select`;
    static readonly FACE_SELECT = `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[6]/div[1]/select`;
    static readonly TIMING_SELECT = `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[7]/div[1]/select`;

    // だいじなもの/その他セレクト
    static readonly IMPORTANT_ITEM_SELECT = `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[4]/div[1]/select`;
    static readonly OTHER_SELECT = `${XPathSelectors.EMOTE_MODAL_BASE}/table[1]/tbody/tr[2]/td[4]/div[2]/select`;

    // ボタン関連
    static readonly REGISTER_BUTTON = `${XPathSelectors.EMOTE_MODAL_BASE}/table[2]/tbody/tr/td[3]/p/a`;
    static readonly CANCEL_BUTTON = `${XPathSelectors.EMOTE_MODAL_BASE}/table[2]/tbody/tr/td[1]/p/a`;

    // エモートデータ取得用
    static readonly EMOTE_SPAN = "./a/span";
    static readonly EMOTE_IMAGE = "./a/span/img";

    /**
     * セレクトオプション用XPath生成
     */
    static selectOption(selectXPath: string, optionText: string): string {
        return `${selectXPath}/option[text()='${optionText}']`;
    }

    /**
     * 動的なページIDを含むXPath生成
     */
    static dynamicEmoteListPath(
        pageId: string,
        index: number,
        columnIndex: number
    ): string {
        return `//*[@id="${pageId}"]/table/tbody/tr[${index}]/td[${columnIndex}]`;
    }
}
