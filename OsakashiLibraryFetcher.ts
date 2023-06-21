import puppeteer, { Browser, Page } from "puppeteer";
import { JSDOM } from "jsdom";

type FetchProps = {
  id: string;
  pw: string;
  name: string;
};

export class OsakashiLibraryFetcher {
  #browser: Browser | null = null;
  #page: Page | null = null;

  async #launchBrowser() {
    console.log(`#launchBrowser: start`);
    this.#browser = await puppeteer.launch();
    this.#page = await this.#browser.newPage();

    //画像、css、フォントファイルを拒否する
    await this.#page.setRequestInterception(true);
    this.#page.on("request", (req) => {
      if (["image", "stylesheet", "font"].indexOf(req.resourceType()) !== -1) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }
  async Fetch(props: FetchProps) {
    const { id, name, pw } = props;
    if (!id || !pw || !name) throw new Error("id,pw,nameのいずれかが間違っています");

    await this.#launchBrowser();
    if (!this.#browser || !this.#page) throw new Error("pageとbrowserが初期化されていません");

    console.log(`${name}のfetchを開始: `);
    //ログインページに行く
    await this.#page.goto(
      "https://web.oml.city.osaka.lg.jp/webopac_i_ja/login.do?url=ufisnd.do%3Fredirect_page_id%3D13",
      { waitUntil: "networkidle0" }
    );
    console.log(`ログインページに移動完了:  `);

    //IDとPWを入力する
    await this.#page.type("input[type=text]", id);
    await this.#page.type("input[type=password]", pw);

    //ログインボタンをクリックして、目的の要素が出現するまで待つ
    await Promise.all([
      this.#page.waitForSelector('a[title="ログアウト"]'),
      this.#page.click("a.btn"),
    ]);
    console.log(`ログイン完了:  `);

    //マイページを開き、目的の要素が出現するまで待つ
    await Promise.all([
      this.#page.waitForSelector("iframe[id='usepopup_frm']"),
      this.#page.goto("https://www.oml.city.osaka.lg.jp/?page_id=113", {
        waitUntil: "networkidle0",
      }),
    ]);
    console.log(`マイページの表示完了:  `);

    //フレームを取得する
    const frameHandle = await this.#page.$("iframe[id='usepopup_frm']");
    if (!frameHandle) throw new Error("frameHandleが見つかりませんでした");
    const frame = await frameHandle.contentFrame();
    if (!frame) throw new Error("frameが見つかりませんでした");

    await frame.waitForSelector('*[name="askuseform"]');

    //予約一覧ページを開く
    await Promise.all([
      frame.waitForSelector('form[name="askrsvform"]'),
      frame.evaluate(() => {
        // @ts-ignore
        opacSendActionPopup("_7695", "rsvlst.do", document.tmpActForm);
        return false;
      }),
    ]);
    console.log(`予約一覧ページの表示完了:  `);

    // 予約一覧を取得する
    const reservedBookListDom = new JSDOM(
      await (await (await frame.$('form[name="askrsvform"]'))!.getProperty("outerHTML")).jsonValue()
    );
    //再度マイページへ
    await Promise.all([
      frame.waitForSelector('form[name="askuseform"]'),
      frame.evaluate(() => {
        // @ts-ignore
        opacSendActionPopup("_7695", "asklst.do", document.tmpActForm);
        return false;
      }),
    ]);

    //貸し出し数が0冊だとボタンが表示されないので処理丸ごとスキップする
    const rentalBooks = await (
      await (await frame.$$(".opac_description_area"))[1].getProperty("textContent")
    ).jsonValue();
    const isExitsRentalBooks = rentalBooks!.match(/0点/) === null ? false : true;
    if (isExitsRentalBooks) {
      await this.#closeBrowser();
      return {
        reservedBookListDom,
        borrowedBookListDom: new JSDOM(""),
      };
    } else {
      //貸し出し一覧ページへ
      await Promise.all([
        frame.waitForSelector('form[name="asklenform"]'),
        frame.evaluate(() => {
          // @ts-ignore
          opacSendActionPopup("_7695", "lenlst.do", document.tmpActForm);
          return false;
        }),
      ]);
      //貸し出し一覧を取得する
      const borrowedBookListDom = new JSDOM(
        await (
          await (await frame.$('form[name="asklenform"]'))!.getProperty("outerHTML")
        ).jsonValue()
      );

      await this.#closeBrowser();
      return {
        reservedBookListDom,
        borrowedBookListDom,
      };
    }
  }

  async #closeBrowser() {
    if (!this.#browser || !this.#page) throw new Error("pageとbrowserが初期化されていません");
    await this.#page.close();
    await this.#browser.close();
  }
}
