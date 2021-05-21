const fs = require("fs");
const puppeteer = require("puppeteer");
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

  //htmlの取得
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

    //予約一覧を取得する
    const reservedbookList = await frame.$eval(
      "#opac_popup_target > div > div > div > div > div > div.opac_block_big > form:nth-child(3) > div > div.opac_data_list_wrapper > table",
      (e) => {
        Array.from(e.children[1].children).forEach((v1, i1) => {
          if (i1 > 0) {
            const el = e.children[1].children[i1].children[2];
            el.textContent = el.textContent.substring(
              0,
              el.textContent.lastIndexOf("∥")
            );
          }
          e.children[1].children[i1].children[7].remove();
          e.children[1].children[i1].children[6].remove();
          e.children[1].children[i1].children[4].remove();
          e.children[1].children[i1].children[3].remove();
          e.children[1].children[i1].children[1].remove();
        });
        return e.outerHTML;
      }
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
    const checkoutList = await frame.$eval(
      "#opac_popup_target > div > div > div > div > div > div.opac_block_big > form:nth-child(3) > div > div.opac_data_list_wrapper > table",
      (e) => {
        Array.from(e.children[1].children).forEach((v1, i1) => {
          if (i1 > 0) {
            const el = e.children[1].children[i1].children[2];
            el.textContent = el.textContent.substring(
              0,
              el.textContent.lastIndexOf("∥")
            );
          }
          e.children[1].children[i1].children[5].remove();
          e.children[1].children[i1].children[1].remove();
        });
        return e.outerHTML;
      }
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
</head>
<body>`;
  const htmlfooter = `</body>
</html>`;
  const cssStyle = `<style>
table{
    border-collapse: collapse;
    color: #3a4d5b;
    margin:0 0 10px 0;
}
table tr th{
    border: solid 1px #99ccc6;
    background-color: #f5ffff;
    padding: 5px;
}
table tr td{
    border: solid 1px #99ccc6;
    padding: 5px;
}
</style>`;

  //index.htmlの作成
  await fs.promises.writeFile(
    __dirname + "/public/index.html",
    htmlHead + cssStyle + today + body + htmlfooter
  );

  await browser.close();
  console.log("取得成功🎉");
};

main().catch((e) => {
  console.log("何らかのエラー💧");
  console.log(e);
  process.exit(-1);
});
