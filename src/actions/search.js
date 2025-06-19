import indexData from '@/assets/search-index.json';

import { BaseAction } from "./base.js";
import { TFIDF } from '../tf-idf.js';


export class SearchAction extends BaseAction {
  constructor() {
    super('search', ['найди', 'поищи', 'ищи']);
    this.index = null;
    this._loadIndex();
  }

  _loadIndex() {
    try {
      let data = indexData;
      this.index = new TFIDF()
      this.index.deserialize(data);
      console.log(this.index)
      console.log(`Индекс успешно загружен`);
    } catch (error) {
      console.error('Ошибка загрузки индекса:', error);
      throw error;
    }
    return this.index;
  }

  extractParams(input) {
    const cleanedInput = input
      .replace(/(найди|поищи|ищи|где есть)/gi, '')
      .trim();
    
    return {
      query: cleanedInput,
    };
  }

  execute({ query }) {
    if (!this.index) {
      return;
    }

    try {
      // Выполняем поиск по TF-IDF
      const results = this.index.search(query)
        .filter((result) => result.score > 0.1) // Фильтр по порогу релевантности
        .slice(0, 5); // Ограничение количества результатов

      console.log(results)
      if (results.length === 0) {
        return;
      }

      // Показываем и озвучиваем результаты
      this._displayResults(results);
      
    } catch (error) {
      console.error('Ошибка поиска:', error);
    }
  }

  _displayResults(results) {
    const container = document.getElementById('search-results') || this._createResultsContainer();
    container.innerHTML = results.map(result => `
      <div class="search-result">
        <h3><a href="${result.id}">${result.id}</a></h3>
        <small>Релевантность: ${Math.round(result.score * 100)}%</small>
      </div>
    `).join('');
  }

  _createResultsContainer() {
    const container = document.createElement('div');
    container.id = 'search-results';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.background = 'white';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    container.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    document.body.appendChild(container);
    return container;
  }
}
