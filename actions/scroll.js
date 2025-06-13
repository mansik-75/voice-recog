import { BaseAction } from "./base.js";


export class ScrollAction extends BaseAction {
  constructor() {
    super("scroll", [
      "прокрут", "листание", "скролл", "скром",
      "вверх", "вниз", "выше", "ниже", "к", "до"
    ]);
  }

  extractParams(input) {
    const direction = input.includes("вверх") ? "up" : 
                      input.includes("вниз") ? "down" : null;

    input = input.replace(".", "");
    
    const pixelMatch = input.match(/(\d+)\s?(px|пикселей)/);
    const selectorMatch = input.match(/(до|к)\s?(#|\.)?(\w+)/i);
    
    return {
      direction,
      pixels: pixelMatch ? pixelMatch[1] : null,
      selector: selectorMatch ? `${selectorMatch[2] || ''}${selectorMatch[3]}` : null
    };
  }

  execute(params) {
    console.log(params);
    if (params.selector) {
      const element = document.querySelector(params.selector);
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      let count = params.pixels ? parseInt(params.pixels) : 100;
      window.scrollBy(0, params.direction === "up" ? -count : count);
    }
  }
}
