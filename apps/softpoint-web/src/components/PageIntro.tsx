import type { ReactNode } from 'react';

type Props = {
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
};

/** 비전문가 친화: 페이지 상단 제목 + 한 줄 설명 */
export default function PageIntro({ title, lead, children }: Props) {
  return (
    <header className="page-intro">
      <h1 className="page-title">{title}</h1>
      {lead && <p className="page-lead">{lead}</p>}
      {children}
    </header>
  );
}
