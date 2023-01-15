import { OsakashiLibraryFetcher } from "./OsakashiLibraryFetcher";
import * as dotenv from "dotenv";
import { ResultProcessor } from "./ResultProcessor";
import { HTMLBuilder } from "./HTMLBuilder";
import fs from "fs";
dotenv.config();

type LoginInfo = {
  id: string;
  pw: string;
  name: string;
};

(async () => {
  if (!process.env.LOGIN_INFO) throw new Error("LOGIN_INFOが設定されていません。");

  let loginInfos: LoginInfo[] = [];
  try {
    loginInfos = JSON.parse(process.env.LOGIN_INFO);
  } catch (error) {
    console.log("JSON.parseに失敗しました。おそらく.envがどこか間違っています。");
    return;
  }

  const resultProcessor = new ResultProcessor();
  const htmlBuilder = new HTMLBuilder();
  const osakashiLibraryFether = new OsakashiLibraryFetcher();

  const today = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  htmlBuilder.AddBody(`取得日時: ${today}`);

  for (const { id, name, pw } of loginInfos) {
    const { borrowedBookListDom, reservedBookListDom } = await osakashiLibraryFether.Fetch({
      id,
      name,
      pw,
    });

    const borrowedBookList = resultProcessor.FromBorrowedBookList(borrowedBookListDom);
    const reservedBookList = resultProcessor.FromReservedBookList(reservedBookListDom);

    const bodyContent = `<h2>${name}</h2><h3>予約分</h3>  ${reservedBookList}  <h3>貸出分</h3>  ${borrowedBookList}`;
    htmlBuilder.AddBody(bodyContent);
  }
  const dom = htmlBuilder.GetHtmlDom();
  const processedDom = resultProcessor.DuplicateBooksToRedText(dom);
  await fs.promises.writeFile(__dirname + "/result.html", processedDom.serialize());
  console.log("🎉正常に終了しました!!");
  return;
})().catch((e) => {
  console.log("🙅何らかのエラーが発生しました!!", e);
});
