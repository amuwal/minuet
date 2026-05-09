export type ContextFormState = {
  title: string;
  datetime: string;
  place: string;
  author: string;
  attendees: string;
  agenda: string;
  terms: string;
};

export const EMPTY_CTX: ContextFormState = {
  title: "",
  datetime: "",
  place: "",
  author: "",
  attendees: "",
  agenda: "",
  terms: "",
};

export const SAMPLE_CTX: ContextFormState = {
  title: "商品企画部 Q3定例会議",
  datetime: "2026/05/09 14:00〜15:42",
  place: "本社 A-301 / Zoom併用",
  author: "中村 葵",
  attendees: [
    "田中 真一 / 商品企画部",
    "佐藤 由美子 / マーケティング部",
    "鈴木 健太 / 営業部",
    "山本 直樹 / 開発部",
    "中村 葵 / 商品企画部",
    "小林 大輔 / 管理部",
  ].join("\n"),
  agenda: [
    "Q2業績振り返りと進捗共有",
    "新商品「ホスピタリティ・プラス」発表計画",
    "既存ラインナップの価格戦略見直し",
    "Q4予算配分とリソース計画",
  ].join("\n"),
  terms: [
    "ホスピタリティ・プラス",
    "ホスピタリティ・ベーシック",
    "山田工業株式会社",
    "ARPU",
    "NPS",
    "ベータユーザー",
    "弊社",
    "アライアンス推進室",
    "TFP-2026",
    "リテンション率",
  ].join("\n"),
};
