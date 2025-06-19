import { BaseAction } from "./base.js";


export class ClickAction extends BaseAction {
  constructor() {
    super("click", ["нажми", "клик", "тапни"]);
  }

  extractParams(input) {
    const selectorMatch = input.match(/(#|\.)?(\w+)/i);
    this.keywords.forEach(word => {
      input = input.replace(new RegExp(word, 'gi'), '');
    });
    const textMatch = input.match(/.*?([\wа-яА-ЯёЁ]+).*/);
    console.log(input, selectorMatch, textMatch[1])
    
    return {
      selector: selectorMatch ? selectorMnoatch[0] : null,
      text: textMatch ? textMatch[1] : null
    };
  }

  execute(params) {
    let element;
    if (params.selector) {
      element = document.querySelector(params.selector);
    } else if (params.text) {
      element = [...document.querySelectorAll('button, a')]
        .find(el => el.textContent.toLowerCase().includes(params.text));
    }
    element?.click();
  }
}
