import { JSDOM } from "jsdom";

/**
 * スクレイピングしてきたDOMを見やすく加工するclass
 */
export class ResultProcessor {
  FromBorrowedBookList(dom: JSDOM) {
    const newDomStr = dom.serialize();
    const newDom = new JSDOM(newDomStr);
    const processedNewDom = this.#createTable([1, 5, 6], newDom);
    return processedNewDom;
  }

  FromReservedBookList(dom: JSDOM) {
    const newDomStr = dom.serialize();
    const newDom = new JSDOM(newDomStr);
    const processedNewDom = this.#createTable([1, 3, 4, 6, 7], newDom);
    return processedNewDom;
  }
  #createTable(denyColumList: number[], dom: JSDOM) {
    const document = dom.window.document;
    const element = document.querySelector("table.opac_data_list_ex");
    if (!element) throw new Error("tableDataProcessing: elementがfalthyです");

    let table = document.createElement("table");
    table.classList.add("itirann", "tablesorter-blue");
    let thead = document.createElement("thead");
    thead.style.position = "sticky";
    thead.style.top = "0px";
    let tbody = document.createElement("tbody");
    Array.from(element.children[1].children).forEach((TR, row) => {
      let tr = document.createElement("tr");
      Array.from(TR.children).forEach((TD, col) => {
        if (!denyColumList.includes(col)) {
          let th = row === 0 ? document.createElement("th") : document.createElement("td");
          th.innerHTML = TD.innerHTML;
          if (col === 2 && row !== 0) {
            let tmp = th.innerHTML.substring(0, th.innerHTML.lastIndexOf("∥")).split("∥");
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
  }

  DuplicateBooksToRedText(dom: JSDOM) {
    const newDomStr = dom.serialize();
    const newDom = new JSDOM(newDomStr);
    const uniqeCheck: HTMLTableCellElement[] = [];
    let currentColorIntex = 0;
    newDom.window.document.querySelectorAll("table").forEach((e, i) => {
      [...e.rows].forEach((_, row) => {
        if (row === 0) return;
        const currentCellElement = e.rows[row].cells[1];
        const sameBook = uniqeCheck.find((e) => e.textContent === currentCellElement.textContent);
        if (sameBook) {
          currentCellElement.style.setProperty(
            "color",
            colors[currentColorIntex % colors.length].color
          );
          currentCellElement.innerHTML =
            colors[currentColorIntex % colors.length].prefixStr +
            `重複${currentColorIntex+1}:` +
            currentCellElement.innerHTML;

          sameBook.style.setProperty("color", colors[currentColorIntex % colors.length].color);
          sameBook.innerHTML =
            colors[currentColorIntex % colors.length].prefixStr + `重複${currentColorIntex+1}:` + sameBook.innerHTML;
          currentColorIntex++;
        } else {
          uniqeCheck.push(currentCellElement);
        }
      });
    });
    return newDom;
  }
}

const colors = [
  {
    color: "red",
    prefixStr: "🔴",
  },
  {
    color: "blue",
    prefixStr: "🔵",
  },
  {
    color: "green",
    prefixStr: "🟢",
  },
  {
    color: "purple",
    prefixStr: "🟣",
  },
  {
    color: "brown",
    prefixStr: "🟤",
  },
  {
    color: "orange",
    prefixStr: "🟠",
  },
  {
    color: "black",
    prefixStr: "⚫",
  },
] as const;

