# OSAKASHI-LIBRARY-FETCH - 大阪市図書館のデータを取得するツール

[大阪市図書館の WEB サイト](https://www.oml.city.osaka.lg.jp/)から「予約一覧」と「貸出一覧」を取得して HTML ファイルを生成するツールです。  

[サンプルサイト](https://osakashi-library.penpen-dev.com/)

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
生成場所は、`gh-pages`ブランチの`/index.html`です。

## ライセンス
[SUSHI-WARE LICENSE](https://github.com/MakeNowJust/sushi-ware)🍣
