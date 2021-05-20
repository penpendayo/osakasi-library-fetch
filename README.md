# OSAKASHI-LIBRARY-FETCH - 大阪市図書館のデータを取得するツール

[大阪市図書館の WEB サイト](https://www.oml.city.osaka.lg.jp/)から「予約一覧」と「貸出一覧」を取得して HTML ファイルを生成するツールです。  

[サンプルサイト](https://library-osakashi.web.app/)

## 使い方📖

### 1.clone
`git clone`でこのプロジェクトを clone します。
### 2.npm install
`npm install`を叩いて、必要なパッケージをインストールします。
### 3.envファイルの作成
プロジェクトのトップに`.env` ファイルを作成します。

`.env`ファイルには以下のような形式で、大阪市図書館のID/PW/名前を入力します。（名前については自分で自由に決めます）
```
ID=2020845-1
PW=043850934
NAME=たけし
```
複数人いる場合は、,区切りで入力していきます。
```
ID=1人目のID,2人目のID
PW=1人目のPW,2人目のPW
NAME=1人目の名前,2人目の名前
```
### 4.取得
`npm start`を叩いて、スクリプトを走らせます。
（定期的に走らせる場合は、[forever](https://www.npmjs.com/package/forever)パッケージなどを使うと良いと思います）
### 5.ご自由に
`.public/`配下に`index.html`が作成されているので、あとは煮るなり焼くなりしてください。

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
