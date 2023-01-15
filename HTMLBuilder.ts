import { JSDOM } from "jsdom";

export class HTMLBuilder {
  #html: JSDOM = new JSDOM();

  constructor(){
    const head = this.#html.window.document.head;
    const header = this.#createHeader();
    head.insertAdjacentHTML('beforeend', header);
  }
  #createHeader() {
    return `
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
    `;
  }
  AddBody(bodyContent: string) {
    const body = this.#html.window.document.body;
    body.insertAdjacentHTML('beforeend', bodyContent);
    return this.#html;
  }

  GetHtmlDom(){
    return this.#html;
  }
}
