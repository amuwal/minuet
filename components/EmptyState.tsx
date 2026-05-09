"use client";

import Icon, { type IconName } from "./Icon";

type Props = {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon = "doc", title, description, action }: Props) {
  return (
    <div className="empty">
      <div className="empty-ico">
        <Icon name={icon} size={22} />
      </div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-desc">{description}</div>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
