"use client";

import { useDeferredValue, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Braces, FileCode2 } from "lucide-react";
import type { ImportFramework } from "../_lib/code-import";

type TokenType =
  | "plain"
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "tag"
  | "attribute"
  | "component"
  | "punctuation";

interface CodeToken {
  type: TokenType;
  value: string;
}

const KEYWORDS = new Set([
  "import",
  "from",
  "export",
  "default",
  "function",
  "return",
  "const",
  "let",
  "var",
  "if",
  "else",
  "true",
  "false",
  "null",
  "undefined",
  "async",
  "await",
  "new",
  "type",
  "interface",
  "extends",
  "satisfies",
  "as",
]);

const TOKEN_CLASS_MAP: Record<TokenType, string> = {
  plain: "text-[#d7dae0]",
  keyword: "text-[#c084fc]",
  string: "text-[#86efac]",
  comment: "text-[#6b7280]",
  number: "text-[#f9a8d4]",
  tag: "text-[#7dd3fc]",
  attribute: "text-[#fda4af]",
  component: "text-[#67e8f9]",
  punctuation: "text-[#94a3b8]",
};

function getCursorPosition(value: string, selectionStart: number) {
  const beforeCursor = value.slice(0, selectionStart);
  const lines = beforeCursor.split("\n");
  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length || 0) + 1,
  };
}

function tokenizeLine(line: string, inBlockComment: boolean): { tokens: CodeToken[]; inBlockComment: boolean } {
  const tokens: CodeToken[] = [];
  let index = 0;
  let isInsideBlockComment = inBlockComment;

  while (index < line.length) {
    const rest = line.slice(index);

    if (isInsideBlockComment) {
      const endIndex = rest.indexOf("*/");
      if (endIndex === -1) {
        tokens.push({ type: "comment", value: rest });
        return { tokens, inBlockComment: true };
      }

      const comment = rest.slice(0, endIndex + 2);
      tokens.push({ type: "comment", value: comment });
      index += comment.length;
      isInsideBlockComment = false;
      continue;
    }

    if (rest.startsWith("//")) {
      tokens.push({ type: "comment", value: rest });
      break;
    }

    if (rest.startsWith("/*")) {
      const endIndex = rest.indexOf("*/", 2);
      if (endIndex === -1) {
        tokens.push({ type: "comment", value: rest });
        return { tokens, inBlockComment: true };
      }

      const comment = rest.slice(0, endIndex + 2);
      tokens.push({ type: "comment", value: comment });
      index += comment.length;
      continue;
    }

    const quote = rest[0];
    if (quote === '"' || quote === "'" || quote === "`") {
      let endIndex = 1;
      while (endIndex < rest.length) {
        if (rest[endIndex] === quote && rest[endIndex - 1] !== "\\") {
          endIndex += 1;
          break;
        }
        endIndex += 1;
      }
      tokens.push({ type: "string", value: rest.slice(0, endIndex) });
      index += endIndex;
      continue;
    }

    if (rest.startsWith("</")) {
      const match = rest.match(/^<\/([A-Za-z][\w.-]*)/);
      if (match) {
        tokens.push({ type: "punctuation", value: "</" });
        tokens.push({
          type: /^[A-Z]/.test(match[1]) ? "component" : "tag",
          value: match[1],
        });
        index += match[0].length;
        continue;
      }
    }

    if (rest[0] === "<") {
      const match = rest.match(/^<([A-Za-z][\w.-]*)/);
      if (match) {
        tokens.push({ type: "punctuation", value: "<" });
        tokens.push({
          type: /^[A-Z]/.test(match[1]) ? "component" : "tag",
          value: match[1],
        });
        index += match[0].length;
        continue;
      }
    }

    if (rest.startsWith("/>")) {
      tokens.push({ type: "punctuation", value: "/>" });
      index += 2;
      continue;
    }

    if (rest[0] === ">") {
      tokens.push({ type: "punctuation", value: ">" });
      index += 1;
      continue;
    }

    const numberMatch = rest.match(/^\d+(\.\d+)?/);
    if (numberMatch) {
      tokens.push({ type: "number", value: numberMatch[0] });
      index += numberMatch[0].length;
      continue;
    }

    const wordMatch = rest.match(/^[A-Za-z_$][\w$-]*/);
    if (wordMatch) {
      const word = wordMatch[0];
      const trailing = rest.slice(word.length);
      const trimmedTrailing = trailing.trimStart();

      if (KEYWORDS.has(word)) {
        tokens.push({ type: "keyword", value: word });
      } else if (trimmedTrailing.startsWith("=")) {
        tokens.push({ type: "attribute", value: word });
      } else if (/^[A-Z]/.test(word)) {
        tokens.push({ type: "component", value: word });
      } else {
        tokens.push({ type: "plain", value: word });
      }

      index += word.length;
      continue;
    }

    const punctuationMatch = rest.match(/^[{}()[\].,:;=]/);
    if (punctuationMatch) {
      tokens.push({ type: "punctuation", value: punctuationMatch[0] });
      index += punctuationMatch[0].length;
      continue;
    }

    tokens.push({ type: "plain", value: rest[0] });
    index += 1;
  }

  return { tokens, inBlockComment: isInsideBlockComment };
}

function tokenizeCode(code: string): CodeToken[][] {
  const lines = code.split("\n");
  let inBlockComment = false;

  return lines.map((line) => {
    const result = tokenizeLine(line, inBlockComment);
    inBlockComment = result.inBlockComment;
    return result.tokens;
  });
}

function EditorLine({
  tokens,
}: {
  tokens: CodeToken[];
}) {
  if (tokens.length === 0) {
    return <span>&nbsp;</span>;
  }

  return (
    <>
      {tokens.map((token, index) => (
        <span key={`${token.type}-${index}`} className={TOKEN_CLASS_MAP[token.type]}>
          {token.value}
        </span>
      ))}
    </>
  );
}

export function CodeEditorSurface({
  value,
  onChange,
  framework,
}: {
  value: string;
  onChange: (value: string) => void;
  framework: ImportFramework | "auto";
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);
  const highlightedCodeRef = useRef<HTMLDivElement | null>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const deferredValue = useDeferredValue(value);

  const highlightedLines = useMemo(() => tokenizeCode(deferredValue), [deferredValue]);
  const lineCount = Math.max(value.split("\n").length, 1);
  const cursorPosition = useMemo(
    () => getCursorPosition(value, selectionStart),
    [value, selectionStart],
  );

  function syncScroll(target: HTMLTextAreaElement) {
    const { scrollTop, scrollLeft } = target;

    if (lineNumbersRef.current) {
      lineNumbersRef.current.style.transform = `translateY(${-scrollTop}px)`;
    }

    if (highlightedCodeRef.current) {
      highlightedCodeRef.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
    }
  }

  function handleSelectionChange(target: HTMLTextAreaElement) {
    setSelectionStart(target.selectionStart ?? 0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;

    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    const nextValue = `${value.slice(0, start)}  ${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.selectionStart = start + 2;
      textareaRef.current.selectionEnd = start + 2;
      setSelectionStart(start + 2);
    });
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#090b10] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[linear-gradient(180deg,#10141d,#0b0f17)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/60">
            <FileCode2 size={12} />
            <span>{framework === "react-native" ? "screen.native.tsx" : "screen.tsx"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-200/80">
          <Braces size={12} />
          <span>{framework === "react-native" ? "RN TSX" : "TSX"}</span>
        </div>
      </div>

      <div className="relative h-[560px] overflow-hidden bg-[#0b1020]">
        <div className="absolute inset-0 flex">
          <div className="w-[64px] shrink-0 overflow-hidden border-r border-white/[0.06] bg-[#0d1324]">
            <div
              ref={lineNumbersRef}
              className="px-3 py-4 text-right font-mono text-[12px] leading-7"
            >
              {Array.from({ length: lineCount }, (_, index) => {
                const lineNumber = index + 1;
                const isActive = lineNumber === cursorPosition.line;

                return (
                  <div
                    key={lineNumber}
                    className={isActive ? "text-cyan-300/90" : "text-white/18"}
                  >
                    {lineNumber}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative min-w-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,#0b1020,#090d18)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden font-mono text-[13px] leading-7"
            >
              <div ref={highlightedCodeRef} className="min-w-max px-5 py-4">
                {highlightedLines.map((line, index) => (
                  <div key={index} className="min-h-7 whitespace-pre text-[#d7dae0]">
                    <EditorLine tokens={line} />
                  </div>
                ))}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => {
                onChange(event.target.value);
                handleSelectionChange(event.target);
              }}
              onClick={(event) => handleSelectionChange(event.currentTarget)}
              onKeyUp={(event) => handleSelectionChange(event.currentTarget)}
              onSelect={(event) => handleSelectionChange(event.currentTarget)}
              onScroll={(event) => syncScroll(event.currentTarget)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              wrap="off"
              autoCapitalize="off"
              autoCorrect="off"
              className="absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent px-5 py-4 font-mono text-[13px] leading-7 text-transparent caret-white outline-none selection:bg-cyan-400/25"
              style={{ whiteSpace: "pre", tabSize: 2 }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-[#0b0f17] px-4 py-2.5 text-[11px] text-white/45">
        <span>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
        <div className="flex items-center gap-3">
          <span>{lineCount} {lineCount === 1 ? "line" : "lines"}</span>
          <span>{framework === "react-native" ? "React Native" : framework === "react" ? "React" : "Auto detect"}</span>
        </div>
      </div>
    </div>
  );
}
