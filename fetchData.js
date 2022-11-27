const puppeteer = require("puppeteer");
const { JSDOM } = require("jsdom");

const fetchData = async (id, pass, name) => {
  console.log(`${name}のfetchを開始: `);
  try {

  } catch (error) {
    console.log(error);
  }

  const browser = await puppeteer.launch();
  console.log(`ブラウザ初期化:`);
  // console.dir(browser);
  const page = await browser.newPage();
  console.log(`ページ初期化:`);
  // console.dir(page);


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
  console.log(`ログインページに移動: `);


  //IDとPWを入力する
  await page.type("input[type=text]", id);
  await page.type("input[type=password]", pass);
  

  //ログインボタンをクリックして、目的の要素が出現するまで待つ
  await Promise.all([
    page.waitForSelector('a[title="ログアウト"]'),
    page.click("a.btn"),
  ]);
  console.log(`ログインボタンをクリックして、目的の要素が出現するまで待つ: `);

  //マイページを開き、目的の要素が出現するまで待つ
  await Promise.all([
    page.waitForSelector("iframe[id='usepopup_frm']"),
    page.goto("https://www.oml.city.osaka.lg.jp/?page_id=113", {
      waitUntil: "networkidle0",
    }),
  ]);
  console.log(`マイページを開き、目的の要素が出現するまで待つ `);


  //フレームを取得する
  const frameHandle = await page.$("iframe[id='usepopup_frm']");
  const frame = await frameHandle.contentFrame();
  await frame.waitForSelector('*[name="askuseform"]');

  //予約一覧ページを開く
  await Promise.all([
    frame.waitForSelector('form[name="askrsvform"]'),
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
    const element = document.querySelector("table.opac_data_list_ex");
    let table = document.createElement("table");
    table.classList.add("itirann", "tablesorter-blue");
    let thead = document.createElement("thead");
    thead.style.position = "sticky";
    thead.style.top = 0;
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
    'form[name="askrsvform"]'
  );
  //再度マイページへ
  await Promise.all([
    frame.waitForSelector('form[name="askuseform"]'),
    frame.evaluate(() => {
      opacSendActionPopup("_7695", "asklst.do", document.tmpActForm);
      return false;
    }),
  ]);

  //貸出一覧を取得する
  const checkoutList = await (async () => {
    //貸し出し数が0冊だとボタンが表示されないので処理丸ごとスキップする
    const rentalBooks = await (
      await (
        await frame.$$(".opac_description_area")
      )[1].getProperty("textContent")
    ).jsonValue();

    const isExitsRentalBooks =
      rentalBooks.match(/\s0点/) === null ? false : true;
    if (isExitsRentalBooks) return "なし";
    //貸し出し一覧ページへ
    await Promise.all([
      frame.waitForSelector('form[name="asklenform"]'),
      frame.evaluate(() => {
        opacSendActionPopup("_7695", "lenlst.do", document.tmpActForm);
        return false;
      }),
    ]);
    //貸し出し一覧を取得する
    return await tableDataProcessing([1, 5, 6], 'form[name="asklenform"]');
  })();

  await page.close();
  await browser.close();
  console.log(`${name}のfetchを終了: `);

  return `<h2>${name}</h2><h3>予約分</h3>  ${reservedbookList}  <h3>貸出分</h3>  ${checkoutList}`;
};

module.exports = fetchData;
