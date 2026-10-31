import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';
import { es } from './es';
import themes from '../puzzles/themes.json';

// Ningún texto con letras puede quedar escrito directo en las pantallas: tiene que venir de t() / es.ts.
// Se revisan los .tsx con el analizador de TypeScript:
//  - texto suelto dentro de una etiqueta (<Text>Hola</Text>) y cadenas dentro de { } en los hijos;
//  - atributos de texto (title, label, accessibilityLabel...) y propiedades de objetos con esos nombres;
//  - argumentos de Alert.alert.

const SRC = path.resolve(__dirname, '..');

// Nombres de atributo y de propiedad que llevan texto para el usuario.
const TEXT_NAMES = new Set(['title', 'label', 'buttonLabel', 'accessibilityLabel', 'description', 'placeholder', 'message', 'sub']);

// Excepciones: textos que no se traducen. Cada una dice por qué.
const ALLOWED = new Set([
  'Stockfish', // nombre del motor (marca)
  'Gradus', // nombre de la app (marca)
  'database.lichess.org', // dirección web que se muestra tal cual
  'github.com/jhlywa/chess.js', // dirección web
  'Google Fonts', // nombre de un sitio (marca)
  'expo.dev', // dirección web
  'Nf3, Bxf7+', // ejemplo de notación inglesa, igual en todos los idiomas
]);

const hasLetters = (s: string) => /\p{L}/u.test(s);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, out);
    else if (name.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/** Cadenas con letras que llegan "tal cual" al usuario desde esta expresión (a través de ?:, &&, +, plantillas). */
function literals(node: ts.Node, found: string[] = []): string[] {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    if (hasLetters(node.text)) found.push(node.text);
  } else if (ts.isTemplateExpression(node)) {
    if (hasLetters(node.head.text)) found.push(node.head.text);
    for (const span of node.templateSpans) {
      if (hasLetters(span.literal.text)) found.push(span.literal.text);
      literals(span.expression, found);
    }
  } else if (ts.isConditionalExpression(node)) {
    literals(node.whenTrue, found);
    literals(node.whenFalse, found);
  } else if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) {
    literals(node.expression, found);
  } else if (ts.isBinaryExpression(node)) {
    const op = node.operatorToken.kind;
    if (
      op === ts.SyntaxKind.PlusToken ||
      op === ts.SyntaxKind.AmpersandAmpersandToken ||
      op === ts.SyntaxKind.BarBarToken ||
      op === ts.SyntaxKind.QuestionQuestionToken
    ) {
      literals(node.left, found);
      literals(node.right, found);
    }
  } else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    // `.join(' · ')`, `.filter(Boolean)`: solo importa lo que se junta, no el separador.
    if (node.expression.name.text === 'join') literals(node.expression.expression, found);
  } else if (ts.isArrayLiteralExpression(node)) {
    node.elements.forEach((e) => literals(e, found));
  }
  return found;
}

function check(file: string): string[] {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const problems: string[] = [];
  const report = (node: ts.Node, text: string) => {
    if (ALLOWED.has(text.trim()) || text in es) return; // `text in es`: una clave de es.ts, como 'common.white'
    const { line } = source.getLineAndCharacterOfPosition(node.getStart());
    problems.push(`${path.relative(SRC, file).replace(/\\/g, '/')}:${line + 1}  "${text.trim().slice(0, 50)}"`);
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && hasLetters(node.text)) report(node, node.text);
    // Hijos entre llaves: {'texto'} o {cond ? 'a' : 'b'}.
    if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      literals(node.expression).forEach((t) => report(node, t));
    }
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && TEXT_NAMES.has(node.name.text) && node.initializer) {
      const init = node.initializer;
      const expr = ts.isJsxExpression(init) ? init.expression : init;
      if (expr) literals(expr).forEach((t) => report(node, t));
    }
    if (ts.isPropertyAssignment(node) && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) && TEXT_NAMES.has(node.name.text)) {
      literals(node.initializer).forEach((t) => report(node, t));
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText() === 'Alert' &&
      node.expression.name.text === 'alert'
    ) {
      node.arguments.forEach((a) => literals(a).forEach((t) => report(a, t)));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return problems;
}

test('ninguna pantalla tiene texto fijo con letras', () => {
  const problems = walk(SRC).flatMap(check);
  assert.deepEqual(problems, [], `Textos fijos:\n${problems.join('\n')}`);
});

test('los nombres de los temas de puzzles viven en es.ts, no en themes.json', () => {
  assert.equal('names' in themes, false, 'themes.json no debe tener "names"');
  const keys = new Set(Object.keys(es));
  const missing = [...themes.practice, ...themes.main, ...themes.known].filter((t) => !keys.has(`puzzleTheme.${t}`));
  assert.deepEqual(missing, []);
});
