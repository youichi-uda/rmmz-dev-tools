import * as vscode from 'vscode';

type Messages = Record<string, string>;

let messages: Messages = {};
let fallback: Messages = {};

export function initLocale(en: Messages, ja: Messages): void {
  fallback = en;
  const lang = vscode.env.language;
  if (lang.startsWith('ja')) {
    messages = ja;
  } else {
    messages = en;
  }
}

export function t(key: string, ...args: (string | number)[]): string {
  let text = messages[key] || fallback[key] || key;
  for (let i = 0; i < args.length; i++) {
    text = text.replace(`{${i}}`, String(args[i]));
  }
  return text;
}
