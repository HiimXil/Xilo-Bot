export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomOperator(): string {
  const operators = ["+", "-", "*", "/"];
  return operators[Math.floor(Math.random() * operators.length)];
}

export function generateExpression(termCount: number = 3): string {
  const terms: string[] = [];

  for (let i = 0; i < termCount; i++) {
    let number = getRandomInt(1, 100);

    // Si l'opérateur précédent est une division, éviter 0
    if (i > 0 && terms[terms.length - 1] === "/" && number === 0) {
      number = 1;
    }

    terms.push(number.toString());

    if (i < termCount - 1) {
      terms.push(getRandomOperator());
    }
  }

  // Ajouter des parenthèses aléatoires
  if (termCount >= 3 && Math.random() < 0.6) {
    // 60% de chance
    const start = 0 + (Math.random() < 0.5 ? 0 : 2); // début à 0 ou 2
    const end = start + 2;
    terms[start] = "(" + terms[start];
    terms[end] = terms[end] + ")";
  }
  return terms.join(" ");
}

export function evaluateExpression(expression: string): number | null {
  try {
    const result = eval(expression);
    return Math.round(result * 100) / 100; // arrondi à 2 décimales
  } catch (error) {
    console.error("Erreur lors de l'évaluation :", error);
    return null;
  }
}

export function generateMathQuestion() {
  let question = "";
  let answer = "";
  const termCount = getRandomInt(2, 4); // entre 2 et 4 termes
  const expression = generateExpression(termCount);
  answer = evaluateExpression(expression)?.toString() ?? "";
  question = `Quel est le résultat de : ${expression} ? (2 chiffres après la virgule)`;
  // Si la réponse est un nombre entier, on l'affiche sans décimales
  if (Number.isInteger(Number(answer))) {
    answer = answer.split(".")[0];
  }
  // Si la réponse est un nombre décimal, on l'affiche avec 2 décimales
  else {
    answer = Number(answer).toFixed(2);
  }
  return { question, answer };
}
