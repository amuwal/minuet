import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { Gijiroku } from "./types";

const JP_FONT = "Yu Gothic";

type RunOpts = {
  bold?: boolean;
  size?: number;
};

function jpRun(text: string, opts: RunOpts = {}): TextRun {
  return new TextRun({
    text,
    font: { name: JP_FONT, hint: "eastAsia" },
    bold: opts.bold,
    size: opts.size,
  });
}

function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 200 },
    children: [jpRun(text, { bold: true, size: 32 })],
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
    children: [jpRun(text, { bold: true, size: 26 })],
  });
}

function heading3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 120, after: 80 },
    children: [jpRun(text, { bold: true, size: 22 })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    children: [jpRun(text)],
  });
}

function numbered(text: string, n: number): Paragraph {
  return new Paragraph({
    children: [jpRun(`${n}. ${text}`)],
  });
}

function plainPara(text: string): Paragraph {
  return new Paragraph({ children: [jpRun(text)] });
}

function todoTable(rows: { 担当者: string; 内容: string; 期限?: string }[]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: ["担当者", "内容", "期限"].map(
      (h) =>
        new TableCell({
          children: [new Paragraph({ children: [jpRun(h, { bold: true })] })],
        })
    ),
  });

  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [jpRun(r.担当者)] })] }),
          new TableCell({ children: [new Paragraph({ children: [jpRun(r.内容)] })] }),
          new TableCell({
            children: [new Paragraph({ children: [jpRun(r.期限 ?? "未定")] })],
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
}

export async function gijirokuToDocxBuffer(g: Gijiroku): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  children.push(heading1(g.会議名));

  children.push(plainPara(`作成日：${g.作成日}`));
  children.push(plainPara(`開催日時：${g.開催日時}`));
  if (g.場所) children.push(plainPara(`場所：${g.場所}`));
  if (g.出席者?.length) children.push(plainPara(`出席者：${g.出席者.join("、")}`));
  if (g.欠席者?.length) children.push(plainPara(`欠席者：${g.欠席者.join("、")}`));
  if (g.議事録作成者) children.push(plainPara(`議事録作成者：${g.議事録作成者}`));

  if (g.議題?.length) {
    children.push(heading2("議題"));
    g.議題.forEach((a, i) => children.push(numbered(a, i + 1)));
  }

  if (g.決定事項?.length) {
    children.push(heading2("決定事項"));
    g.決定事項.forEach((d, i) => children.push(numbered(d, i + 1)));
  }

  if (g.議論内容?.length) {
    children.push(heading2("議論内容"));
    g.議論内容.forEach((d, i) => {
      children.push(heading3(`議題${i + 1}：${d.議題}`));
      if (d.提案_論点) children.push(bullet(`提案・論点：${d.提案_論点}`));
      if (d.議論経緯) children.push(bullet(`議論の経緯：${d.議論経緯}`));
      children.push(bullet(`結論：${d.結論}`));
    });
  }

  if (g.ToDo?.length) {
    children.push(heading2("ToDo"));
    children.push(todoTable(g.ToDo));
  }

  if (g.保留懸案事項?.length) {
    children.push(heading2("保留・懸案事項"));
    g.保留懸案事項.forEach((p) => children.push(bullet(p)));
  }

  if (g.次回会議 && (g.次回会議.日時 || g.次回会議.議題?.length)) {
    children.push(heading2("次回会議"));
    if (g.次回会議.日時) children.push(bullet(`日時：${g.次回会議.日時}`));
    if (g.次回会議.議題?.length) {
      children.push(bullet("議題："));
      g.次回会議.議題.forEach((a) => children.push(bullet(`  ${a}`)));
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: { name: JP_FONT, hint: "eastAsia" },
            size: 22,
          },
        },
      },
    },
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
