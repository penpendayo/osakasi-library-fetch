# OSAKASHI-LIBRARY-FETCH - 大阪市図書館のデータを取得するツール

[大阪市図書館の WEB サイト](https://www.oml.city.osaka.lg.jp/)から「予約一覧」と「貸出一覧」を取得して HTML ファイルを生成するツールです。  

[サンプルサイト](https://penpendayo.github.io/osakasi-library-fetch/result.html)

## 使い方📖

### 1.clone
`git clone`でこのプロジェクトを clone します。
### 2.npm install
`npm install`を叩いて、必要なパッケージをインストールします。
### 3.GitHubの設定からActions secretsを設定
GitHubのプロジェクト設定から、`LOGIN_INFO`というキー名で、以下のような値を設定します。
```
  [
    {
      "name": "やまだ",
      "id": "2012534527-2",
      "pw": "235234"
    },
    {
      "name": "たなか",
      "id": "223545057-9",
      "pw": "3452345"
    }
  ]
```

namesの部分は任意です。（サンプルサイトをご覧ください）

### 4.取得
15分に1回、GitHub Actionsが実行されます。
生成場所は、`gh-pages`ブランチの`/result.html`です。

## その他🏃
サイトに負荷をかけないために、並行で処理せずに「1人目が終わったら2人目、2人目が終わったら3人目」という風に直列に処理していくようにしています。以下の部分です。
```
 body = await idList.reduce(
      async (acc, v, i) =>
        (await acc) + (await getHTML(idList[i], pwList[i], nameList[i])),
      Promise.resolve("")
    );
```
なので単純計算で人数をn倍にすると処理にかかる時間もn倍になります。並行で処理したい場合は`Promise.all`などを使った処理に書き換えてください。
## ライセンス

[SUSHI-WARE LICENSE](https://github.com/MakeNowJust/sushi-ware)で配布します😋　  
お寿司たべたい🍣

連絡先： [@penpen_dev](https://twitter.com/penpen_dev)
