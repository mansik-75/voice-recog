import fs from 'fs';
import path from 'path';
import * as commander  from 'commander';
import { TFIDF } from './tf-idf.js';

/**
 * Рекурсивно читает все файлы в директории
 * @param {string} dirPath - Путь к директории
 * @returns {Promise<Array<{filePath: string, content: string}>>} - Массив файлов с содержимым
 */
async function readFilesRecursively(dirPath) {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const nestedFiles = await readFilesRecursively(fullPath);
      files.push(...nestedFiles);
    } else if (entry.isFile()) {
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      files.push({ filePath: fullPath, content });
    }
  }

  return files;
}

/**
 * Строит TF-IDF индекс для всех файлов в указанной директории
 * @param {string} directory - Путь к директории
 */
async function buildIndex(directory) {
  try {
    console.log(`Начинаем индексацию директории: ${directory}`);
    const tfidf = new TFIDF();
    const files = await readFilesRecursively(directory);

    if (files.length === 0) {
      console.log('В указанной директории нет файлов для индексации.');
      return;
    }

    for (const file of files) {
      tfidf.addDocument(file.content, file.filePath);
    }

    const indexData = tfidf.serialize();
    const outputPath = path.join(process.cwd(), 'search-index.json');

    await fs.promises.writeFile(outputPath, JSON.stringify(indexData, null, 2), 'utf-8');
    console.log(`Индекс успешно построен и сохранен в: ${outputPath}`);
    console.log(`Проиндексировано файлов: ${files.length}`);
    console.log(`Уникальных слов: ${Object.keys(tfidf.docCount).length}`);
  } catch (error) {
    console.error('Ошибка при построении индекса:', error);
    process.exit(1);
  }
}


const program = new commander.Command()
program
  .requiredOption('--directory <path>', 'Путь к директории для индексации')
  .parse(process.argv);

const options = program.opts();


buildIndex(options.directory);
