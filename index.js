const fs = require("fs");
const fetchData = require("./fetchData");
const { JSDOM } = require("jsdom");
const { yyyymmddhhmiss } = require("./helper");

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
  //重複で予約してる本を赤字で表示
  const uniqeCheck = [];
  const dom = new JSDOM(htmlHead + today + body + htmlfooter);
  dom.window.document.querySelectorAll("table").forEach((e) => {
    [...e.rows].forEach((_, row) => {
      if (row === 0) return;
      const currentCellElement = e.rows[row].cells[1];
      const uniqueBook = uniqeCheck.find((e) => e.textContent === currentCellElement.textContent);
      if (uniqueBook) {
        const replaceHTML = `<span style="color:red;">（😫重複してます）${currentCellElement.innerHTML}</span>`;
        uniqueBook.innerHTML = replaceHTML;
        currentCellElement.innerHTML = replaceHTML;
      } else {
        uniqeCheck.push(currentCellElement);
      }
    });
  });
  //index.htmlの作成
  await fs.promises.writeFile(__dirname + "/index.html", dom.serialize());

  console.log("取得成功🎉");
};

main().catch((e) => {
  console.log("何らかのエラー💧");
  console.log(e);
  process.exit(-1);
});
