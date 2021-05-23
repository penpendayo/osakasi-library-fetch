const fs = require("fs");
const puppeteer = require("puppeteer");
const { JSDOM } = require("jsdom");
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
  //ブラウザ初期化
  const browser = await puppeteer.launch();
  //現在時刻の取得
  const today = "取得日時：" + yyyymmddhhmiss();
  console.log(today);

  //htmlデータの取得
  const getHTML = async (id, pass, name) => {
    const page = await browser.newPage();
    //画像、css、フォントファイルを拒否する
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["image", "stylesheet", "font"].indexOf(req.resourceType()) !== -1) {
        req.abort();
      } else {
        req.continue();
      }
    });

    //ログインページに行く
    await page.goto(
      "https://web.oml.city.osaka.lg.jp/webopac_i_ja/login.do?url=ufisnd.do%3Fredirect_page_id%3D13",
      { waitUntil: "networkidle0" }
    );

    //IDとPWを入力する
    await page.type(
      "body > div > div > div > div.opac_block_body_big > form > table > tbody > tr:nth-child(1) > td > input[type=text]",
      id
    );
    await page.type(
      "body > div > div > div > div.opac_block_body_big > form > table > tbody > tr:nth-child(2) > td > input[type=password]",
      pass
    );

    //ログインボタンをクリックして、目的の要素が出現するまで待つ
    await Promise.all([
      page.waitForSelector(
        "#_6749 > tbody > tr > td > table > tbody > tr:nth-child(2) > td.th_fsimplecommon_graygradationbox_content.th_fsimplecommon_graygradationbox_content_no_title > div > div > ul > li:nth-child(3) > a"
      ),
      page.click(
        "body > div > div > div > div.opac_block_body_big > form > div:nth-child(12) > a.btn"
      ),
    ]);
    //マイページを開き、目的の要素が出現するまで待つ
    await Promise.all([
      page.waitForSelector("iframe[id='usepopup_frm']"),
      page.goto("https://www.oml.city.osaka.lg.jp/?page_id=113", {
        waitUntil: "networkidle0",
      }),
    ]);

    //フレームを取得する
    const frameHandle = await page.$("iframe[id='usepopup_frm']");
    const frame = await frameHandle.contentFrame();
    frame.waitForSelector(
      "#opac_popup_target > div > div > div > div > div.opac_block_big > form > div > div:nth-child(7) > div.opac_block_body_middle_bg > div > button"
    );

    //予約一覧ページを開く
    await Promise.all([
      frame.waitForSelector(".opac_data_list_ex"),
      frame.evaluate(() => {
        opacSendActionPopup("_7695", "rsvlst.do", document.tmpActForm);
        return false;
      }),
    ]);

    //Tableを加工する関数
    const tableDataProcessing = async (denyColumList, targetSelector) => {
      const dom = new JSDOM(
        await (
          await (await frame.$(targetSelector)).getProperty("outerHTML")
        ).jsonValue()
      );
      const document = dom.window.document;
      const element = document.querySelector(".opac_data_list_ex");
      let table = document.createElement("table");
      table.classList.add("itirann", "tablesorter-blue");
      let thead = document.createElement("thead");
      let tbody = document.createElement("tbody");
      Array.from(element.children[1].children).forEach((TR, row) => {
        let tr = document.createElement("tr");
        Array.from(TR.children).forEach((TD, col) => {
          if (!denyColumList.includes(col)) {
            let th =
              row === 0
                ? document.createElement("th")
                : document.createElement("td");
            th.innerHTML = TD.innerHTML;
            if (col === 2 && row !== 0) {
              let tmp = th.innerHTML
                .substring(0, th.innerHTML.lastIndexOf("∥"))
                .split("∥");
              tmp[0] += "<br>";
              tmp[1] = '<span style="font-size:10px;color:gray">' + tmp[1];
              tmp[tmp.length - 1] += "</span>";
              th.innerHTML = tmp.join("");
            }
            tr.appendChild(th);
          }
        });
        if (row === 0) thead.appendChild(tr);
        if (row > 0) tbody.appendChild(tr);
      });
      table.appendChild(thead);
      table.appendChild(tbody);
      return table.outerHTML;
    };

    // 予約一覧を取得する
    const reservedbookList = await tableDataProcessing(
      [1, 3, 4, 6, 7],
      "#opac_popup_target > div > div > div > div > div > div.opac_block_big > form:nth-child(3) > div > div.opac_data_list_wrapper > table"
    );
    //再度マイページへ
    await Promise.all([
      frame.waitForSelector(
        "#opac_popup_target > div > div > div > div > div > div.opac_block_big > form > div > div:nth-child(5) > div.opac_block_body_middle_bg > div > button"
      ),
      frame.click("#tab_area > li.opac_tab_present > a"),
    ]);

    //貸し出し一覧ページへ
    await Promise.all([
      frame.waitForSelector(".opac_data_list_ex"),
      frame.evaluate(() => {
        opacSendActionPopup("_7695", "lenlst.do", document.tmpActForm);
        return false;
      }),
    ]);
    //貸し出し一覧を取得する
    const checkoutList = await tableDataProcessing(
      [1, 5, 6],
      "#opac_popup_target > div > div > div > div > div > div.opac_block_big > form:nth-child(3) > div > div.opac_data_list_wrapper > table"
    );

    await page.close();
    return `<h2>${name}</h2><h3>予約分</h3>  ${reservedbookList}  <h3>貸出分</h3>  ${checkoutList}`;
  };

  const idList = process.env.ID.split(",");
  const pwList = process.env.PW.split(",");
  const nameList = process.env.NAME.split(",");
  let body = "";
  if (idList.length === pwList.length && pwList.length === nameList.length) {
    body = await idList.reduce(
      async (acc, v, i) =>
        (await acc) + (await getHTML(idList[i], pwList[i], nameList[i])),
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

  await browser.close();
  console.log("取得成功🎉");
};

main().catch((e) => {
  console.log("何らかのエラー💧");
  console.log(e);
  process.exit(-1);
});
