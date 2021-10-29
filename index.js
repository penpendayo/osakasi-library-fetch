const fs = require("fs");
const fetchData = require("./fetchData");
require("dotenv").config();

// 1桁の数字を0埋めで2桁にする
const toDoubleDigits = (num) => {
  num += "";
  if (num.length === 1) {
    num = "0" + num;
  }
  return num;
};
// 日付をYYYY/MM/DD HH:DD:MI:SS形式で取得
const yyyymmddhhmiss = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = toDoubleDigits(date.getMonth() + 1);
  const dd = toDoubleDigits(date.getDate());
  const hh = toDoubleDigits(date.getHours());
  const mi = toDoubleDigits(date.getMinutes());
  return yyyy + "/" + mm + "/" + dd + " " + hh + ":" + mi;
};

const main = async () => {
  //現在時刻の取得
  const today = "取得日時：" + yyyymmddhhmiss();
  console.log(today);

  const idList = process.env.ID.split(",");
  const pwList = process.env.PW.split(",");
  const nameList = process.env.NAME.split(",");
  let body = "";
  if (idList.length === pwList.length && pwList.length === nameList.length) {
    body = await idList.reduce(
      async (acc, _, i) =>
        (await acc) + (await fetchData(idList[i], pwList[i], nameList[i])),
      Promise.resolve("")
    );
  } else {
    throw new Error("ID、PW、名前のいずれかが不足もしくはオーバーしています。");
  }

  const htmlHead = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.31.0/css/theme.blue.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js" defer></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.31.0/js/jquery.tablesorter.min.js" defer></script>
    <script >
    window.addEventListener( 'DOMContentLoaded', function(){
      $(".itirann").tablesorter();
    })
    </script>
</head>
<body>`;
  const htmlfooter = `</body>
</html>`;

  //index.htmlの作成
  await fs.promises.writeFile(
    __dirname + "/public/index.html",
    htmlHead + today + body + htmlfooter
  );

  console.log("取得成功🎉");
};

main().catch((e) => {
  console.log("何らかのエラー💧");
  console.log(e);
  process.exit(-1);
});
