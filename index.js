const fs = require("fs");
const fetchData = require("./fetchData");
const { JSDOM } = require("jsdom");
const dayjs = require('dayjs') // v1.9.7
dayjs.extend(require('dayjs/plugin/timezone'))
dayjs.extend(require('dayjs/plugin/utc'))
dayjs.tz.setDefault('Asia/Tokyo')

const main = async () => {
  //現在時刻の取得
  const today = "取得日時：" + dayjs.tz().format('YYYY/MM/DD HH:mm');
  console.log(today);

  const {loginIds, passwords, names} = JSON.parse(process.env.LOGIN_INFO)
  const isCorrectUserInfo = loginIds.length === passwords.length && passwords.length === names.length;
  if (!isCorrectUserInfo) throw new Error("ID、PW、名前のいずれかが不足もしくはオーバーしています。");

  const body = await loginIds.reduce(
    async (acc, _, i) =>
      (await acc) + (await fetchData(loginIds[i], passwords[i], names[i])),
    ""
  );


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
  const htmlfooter = `</body></html>`;

  const dom = new JSDOM(htmlHead + today + body + htmlfooter);
  duplicateReservedBooksToRedText(dom);
  
  //index.htmlの作成
  await fs.promises.writeFile(__dirname + "/result.html", dom.serialize());

  console.log("全員分の取得に成功しました🎉");
};

main().catch((e) => {
  console.log("何らかのエラーが発生しました💧");
  console.log(e);
  process.exit(-1);
});


function duplicateReservedBooksToRedText(dom){
  const uniqeCheck = [];
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
}