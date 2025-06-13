function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
              matrix[j][i - 1] + 1,
              matrix[j - 1][i] + 1,
              matrix[j - 1][i - 1] + cost
          );
      }
  }

  return matrix[b.length][a.length];
}

function jaccardSimilarity(str1, str2) {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function combinedSimilarity(userInput, phrase) {
  const levDistance = levenshteinDistance(userInput, phrase);
  const maxLength = Math.max(userInput.length, phrase.length);
  const levSimilarity = 1 - (levDistance / maxLength);
  
  const jaccard = jaccardSimilarity(userInput, phrase);
  
  return 0.6 * levSimilarity + 0.4 * jaccard;
}

export async function findBestMatch(userInput, synonymDictionary) {
  let bestScore = -Infinity;
  let bestMatch = userInput;

  for (const [phrase, synonyms] of Object.entries(synonymDictionary)) {
      const phraseScore = combinedSimilarity(userInput, phrase);
      if (phraseScore > bestScore) {
          bestScore = phraseScore;
          bestMatch = phrase;
      }

      for (const synonym of synonyms) {
          const synonymScore = combinedSimilarity(userInput, synonym);
          if (synonymScore > bestScore) {
              bestScore = synonymScore;
              bestMatch = phrase;
          }
      }
  }

  return {'phrase': bestMatch, 'data': ''};
}

export class CommandParser {
  constructor(actions = []) {
    this.actions = actions;
    this.synonymDictionary = {}
  }

  registerAction(action) {
    this.actions.push(action);
    this.synonymDictionary[action.name] = action.keywords || [];
  }

  parse(input) {
    const normalizedInput = input.toLowerCase();
    let bestScore = -Infinity;
    let bestMatch = null;
    let bestAction;

    for (const [phrase, synonyms] of Object.entries(this.synonymDictionary)) {
        const phraseScore = combinedSimilarity(normalizedInput, phrase);
        if (phraseScore > bestScore) {
            bestScore = phraseScore;
            bestMatch = phrase;
        }

        for (const synonym of synonyms) {
            const synonymScore = combinedSimilarity(normalizedInput, synonym);
            if (synonymScore > bestScore) {
                bestScore = synonymScore;
                bestMatch = phrase;
            }
        }
    }

    if (!bestMatch) return { error: "Действие не распознано" };

    bestAction = this.actions.find(action => action.name === bestMatch);

    const params = bestAction.extractParams 
      ? bestAction.extractParams(normalizedInput) 
      : {};
    console.log(params)

    return {
      action: bestAction,
      params: params
    };
  }

  _matchAction(input, action) {
    const keywords = [
      action.name,
      ...(this.synonymDictionary[action.name] || []),
      ...(action.keywords || [])
    ];
    
    let maxScore = 0;
    keywords.forEach(keyword => {
      const score = jaccardSimilarity(input, keyword);
      if (score > maxScore) maxScore = score;
    });
    
    return maxScore;
  }
}
