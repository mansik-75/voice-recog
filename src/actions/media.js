import { BaseAction } from "./base.js";

import JSZip from 'jszip';


export class DownloadMediaAction extends BaseAction {
  constructor() {
    super('download', ['скачай', 'загрузи', 'сохрани']);
    this.mediaTypes = {
      'аудио': 'audio',
      'музыку': 'audio',
      'песни': 'audio',
      'видео': 'video',
      'фото': 'image',
      'изображения': 'image',
      'картинки': 'image'
    };
  }

  extractParams(input) {
    const mediaType = this._detectMediaType(input);
    return {
      type: mediaType,
      all: input.includes('все') || input.includes('весь')
    };
  }

  async execute({ type, all }) {
    if (!type) {
      return;
    }

    console.log(`Начинаю загрузку ${type}...`);

    try {
      const mediaElements = this._collectMediaElements(type);
      
      if (mediaElements.length === 0) {
        console.log(`На странице не найдено ${type}`);
        return;
      }

      const elementsToDownload = all ? mediaElements : mediaElements.slice(0, 5);
      
      const zip = new JSZip();
      const folder = zip.folder(type);
      
      await this._addFilesToZip(folder, elementsToDownload);
      
      const content = await zip.generateAsync({ type: 'blob' });
      this._downloadZip(content, `${type}_${new Date().toISOString().slice(0,10)}.zip`);
      
      console.log(`Готово! Скачано ${elementsToDownload.length} файлов`);
    } catch (error) {
      console.error('Ошибка при создании архива:', error);
    }
  }

  _detectMediaType(input) {
    for (const [keyword, type] of Object.entries(this.mediaTypes)) {
      if (input.includes(keyword)) return type;
    }
    return null;
  }

  _collectMediaElements(type) {
    const selectors = {
      audio: ['audio', 'a[href$=".mp3"]', 'a[href$=".wav"]'],
      video: ['video', 'a[href$=".mp4"]', 'a[href$=".webm"]'],
      image: ['img', 'picture', 'a[href$=".jpg"]', 'a[href$=".png"]', 'a[href$=".webp"]']
    };

    const elements = [];
    selectors[type].forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el.tagName.toLowerCase() === 'a') {
          elements.push({ url: el.href, name: el.textContent.trim() || el.href.split('/').pop() });
        } else {
          const src = el.currentSrc || el.src;
          if (src) elements.push({ url: src, name: src.split('/').pop() });
        }
      });
    });

    return elements;
  }

  async _addFilesToZip(folder, elements) {
    for (const [index, element] of elements.entries()) {
      try {
        const response = await fetch(element.url);
        if (!response.ok) continue;
        
        const blob = await response.blob();
        const extension = element.url.split('.').pop().toLowerCase();
        const filename = `${index+1}_${element.name || `file_${Date.now()}`}.${extension}`;
        
        folder.file(filename, blob);
      } catch (error) {
        console.warn(`Не удалось загрузить ${element.url}:`, error);
      }
    }
  }

  _downloadZip(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
