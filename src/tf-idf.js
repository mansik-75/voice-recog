export class TFIDF {
  constructor() {
    this.documents = [];
    this.wordCount = {};
    this.docCount = {};
  }

  addDocument(text, docId) {
    const words = this._tokenize(text);
    this.documents.push({ id: docId, words });
    
    new Set(words).forEach(word => {
      this.docCount[word] = (this.docCount[word] || 0) + 1;
    });
    
    words.forEach(word => {
      this.wordCount[word] = (this.wordCount[word] || 0) + 1;
    });
  }

  search(query) {
    const queryWords = this._tokenize(query);
    const scores = [];
    
    this.documents.forEach(docWords => {
      let score = 0;
      let docIndex = docWords.id;
      console.log(docIndex)
      
      queryWords.forEach(queryWord => {
        const tf = docWords.words.filter(w => w === queryWord).length / docWords.words.length;
        const idf = Math.log(this.documents.length / (this.docCount[queryWord] || 1));
        score += tf * idf;
      });
      
      if (score > 0) {
        scores.push({ id: docIndex, score: score });
      }
    });
    
    return scores.sort((a, b) => b.score - a.score);
  }

  serialize() {
    return {
      documents: this.documents,
      wordCount: this.wordCount,
      docCount: this.docCount
    };
  }

  deserialize(data) {
    this.documents = data.documents;
    this.wordCount = data.wordCount;
    this.docCount = data.docCount;
  }

  _tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\wа-яёЁА-Я]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 2);
  }
}
