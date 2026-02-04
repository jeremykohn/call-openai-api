import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const harper = await import('harper.js');
const linter = new harper.LocalLinter({
  binary: harper.binary,
  dialect: harper.Dialect.American,
});

await importDictionary(linter);

const args = process.argv.slice(2);
const files = args.length > 0 ? args : getMarkdownFiles();

if (files.length === 0) {
  console.log('No Markdown files found.');
  process.exit(0);
}

for (const file of files) {
  const absolutePath = resolve(file);
  const text = readFileSync(absolutePath, 'utf8');
  const lints = (await linter.lint(text)).filter((lint) => !isHeadingCaseSuggestion(lint));
  console.log(`---\n${file}`);
  if (lints.length === 0) {
    console.log('No issues found.');
    continue;
  }

  const lineStarts = getLineStarts(text);
  for (const lint of lints) {
    const span = lint.span();
    const start = span.start;
    const { line, column } = getLineColumn(lineStarts, start);
    console.log(`${line}:${column} ${lint.message()}`);
    const suggestions = lint.suggestions();
    if (suggestions.length > 0) {
      console.log(`  Suggestions: ${suggestions.map((s) => s.get_replacement_text()).join(' | ')}`);
    }
  }
}

function getMarkdownFiles() {
  try {
    const output = execSync("git ls-files '*.md'", { encoding: 'utf8' });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function importDictionary(lintInstance) {
  const dictionaryPath = resolve('scripts/harper-words.txt');
  if (!existsSync(dictionaryPath)) {
    return;
  }
  const content = readFileSync(dictionaryPath, 'utf8');
  const words = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
  if (words.length > 0) {
    await lintInstance.importWords(words);
  }
}

function getLineStarts(text) {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') {
      starts.push(index + 1);
    }
  }
  return starts;
}

function getLineColumn(lineStarts, index) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lineStarts[mid] <= index) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  const line = Math.max(high, 0) + 1;
  const column = index - lineStarts[Math.max(high, 0)] + 1;
  return { line, column };
}

function isHeadingCaseSuggestion(lint) {
  return lint.message().toLowerCase().includes('title case in headings');
}
