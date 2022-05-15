# DQXChatManager

## はじめに

-   DQX のよく使うセリフを管理するアプリです
-   [Edge](https://www.microsoft.com/ja-jp/edge)がインストールされた Windows PC が必要です（普通は入っていると思います）
-   Mac/スマホなどでは動作しません
-   このページの内容をよく読み理解できる方のみ使用願います

![](./media/screen01.png)

## 機能

-   現在のよく使うセリフの設定をテキストへ出力する
-   テキストの内容をもとに、アプリがブラウザを操作してよく使うセリフを設定する

## ダウンロード

[ダウンロード](https://github.com/tubame0505/DQXChatManager/releases/download/v0.1.4/DQXChatManager-win32-x64.zip)  
ダウンロードした ZIP ファイルを展開して、中の DQXChatManager.exe を実行してください

## 使い方（設定出力）

-   初回起動時に画像のような画面が出るので ✕ で消すかキャンセルしてください。許可を押す必要はありません。

    ![](./media/screen05.png)

-   「広場ログイン」ボタン押すとブラウザが立ち上がるのでログインしてください。よく使うセリフのページが表示されるはずです
-   「設定をテキストへ出力」ボタン押すとテキストボックスに設定が書き出されるので、メモ帳アプリ等へ保存しておいてください（テキスト選択後 CTRL+C でコピーできます）

## 使い方（取り込みテスト）

-   まず動作チェックをしてください
-   この後の操作をすると、よく使うセリフ１ページ目の先頭が書き換わります
-   テキストボックスに下の文字を正確にコピペしてください（CTRL+C でコピー、CTRL+V で貼り付け）

```
emote-list-0	1	セリフ	ありがとう！	はくしゅ	えがお	はじめ
```

![](./media/screen02.png)

-   「設定をテキストから取り込み」ボタンを押すと確認画面が出て OK を押すとアプリがブラウザを操作して設定を書き込みます  
    ![](./media/screen03.png)
-   １ページ目の先頭が変わっていたら成功です  
    ![](./media/screen04.png)

## 使い方（取り込み）

-   「広場ログイン」後に、保存しておいた設定テキストをテキストボックスに貼り付けて「設定をテキストから取り込み」ボタンを押すと、アプリがブラウザを操作して設定を書き込みます
-   今の設定が上書きされてしまうので注意
-   設定中の中断はできません。動きがおかしいなと思ったら、ブラウザを ✕ ボタンで閉じてください
-   設定の不要な行を削除しておくと早く終わります
-   他のキャラクターへの設定引っ越しなどもできるかと思いますが、動作は未確認です

## 注意事項

-   広場の仕様変更、ブラウザの更新などで急に動作しなくなる場合があります
-   Edge のアップデート直後はうまく動作しない場合があります
-   不具合などのサポートは基本的には致しません
-   アプリが制御しているブラウザへのログイン ID やパスの入力が心配であればワンタイムパスワードを設定しておいてください
-   このアプリによるブラウザ操作は[スクウェア・エニックス アカウント規約](https://support.jp.square-enix.com/rule.php?id=450&la=0&tag=sqexaccount)「第 15 条　禁止行為 (24)」に違反するものではないと考えていますが、不安な方は利用をお控えください
    > 第 15 条　禁止行為  
    > (24) 自動的に特定の行為を繰り返させるプログラムやツールを用いて対象サービスの各コンテンツや各サービス（コミュニティを含む）を利用する行為。
