import type { Gijiroku } from "./types";

export function gijirokuToMarkdown(g: Gijiroku): string {
  const lines: string[] = [];
  lines.push(`# ${g.会議名}`);
  lines.push("");
  lines.push(`- 作成日：${g.作成日}`);
  lines.push(`- 開催日時：${g.開催日時}`);
  if (g.場所) lines.push(`- 場所：${g.場所}`);
  if (g.出席者?.length) lines.push(`- 出席者：${g.出席者.join("、")}`);
  if (g.欠席者?.length) lines.push(`- 欠席者：${g.欠席者.join("、")}`);
  if (g.議事録作成者) lines.push(`- 議事録作成者：${g.議事録作成者}`);
  lines.push("");

  if (g.議題?.length) {
    lines.push("## 議題");
    g.議題.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
    lines.push("");
  }

  if (g.決定事項?.length) {
    lines.push("## 決定事項");
    g.決定事項.forEach((d, i) => lines.push(`${i + 1}. ${d}`));
    lines.push("");
  }

  if (g.議論内容?.length) {
    lines.push("## 議論内容");
    g.議論内容.forEach((d, i) => {
      lines.push(`### 議題${i + 1}：${d.議題}`);
      if (d.提案_論点) lines.push(`- 提案・論点：${d.提案_論点}`);
      if (d.議論経緯) lines.push(`- 議論の経緯：${d.議論経緯}`);
      lines.push(`- 結論：${d.結論}`);
      lines.push("");
    });
  }

  if (g.ToDo?.length) {
    lines.push("## ToDo");
    lines.push("| 担当者 | 内容 | 期限 |");
    lines.push("| --- | --- | --- |");
    g.ToDo.forEach((t) => {
      lines.push(`| ${t.担当者} | ${t.内容} | ${t.期限 ?? "未定"} |`);
    });
    lines.push("");
  }

  if (g.保留懸案事項?.length) {
    lines.push("## 保留・懸案事項");
    g.保留懸案事項.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }

  if (g.次回会議 && (g.次回会議.日時 || g.次回会議.議題?.length)) {
    lines.push("## 次回会議");
    if (g.次回会議.日時) lines.push(`- 日時：${g.次回会議.日時}`);
    if (g.次回会議.議題?.length) {
      lines.push(`- 議題：`);
      g.次回会議.議題.forEach((a) => lines.push(`  - ${a}`));
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function gijirokuToPlainText(g: Gijiroku): string {
  const md = gijirokuToMarkdown(g);
  return md
    .replace(/^#+\s*/gm, "")
    .replace(/^\|\s*---.*$/gm, "")
    .replace(/\|/g, "  ");
}
