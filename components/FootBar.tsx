"use client";

type Props = {
  info: React.ReactNode;
  actions?: React.ReactNode;
};

export default function FootBar({ info, actions }: Props) {
  return (
    <footer className="footbar">
      <div className="info">{info}</div>
      <div className="actions">{actions}</div>
    </footer>
  );
}
