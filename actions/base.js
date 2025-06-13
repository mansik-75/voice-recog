export class BaseAction {
  constructor(name, keywords = []) {
    this.name = name;
    this.keywords = keywords;
  }

  extractParams(input) {
    return {};
  }

  execute(params) {
    console.log(`Выполняется ${this.name}`, params);
  }
}
