import type { ReactNode } from "react";

function inlineMarkdown(value: string): ReactNode[] {
  const pattern = /(\*\*|__)(.+?)\1|~~(.+?)~~|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(?<!\w)(\*|_)([^*_]+)\7/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value))) {
    if (match.index > lastIndex) nodes.push(value.slice(lastIndex, match.index));

    if (match[2]) nodes.push(<strong key={match.index}>{match[2]}</strong>);
    else if (match[3]) nodes.push(<del key={match.index}>{match[3]}</del>);
    else if (match[4]) nodes.push(<code key={match.index} className="rounded bg-gray-100 px-1 py-0.5 text-[0.9em]">{match[4]}</code>);
    else if (match[5] && match[6]) {
      nodes.push(<a key={match.index} href={match[6]} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#963E1B] underline">{match[5]}</a>);
    } else if (match[8]) nodes.push(<em key={match.index}>{match[8]}</em>);

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < value.length) nodes.push(value.slice(lastIndex));
  return nodes;
}

export function MarkdownContent({ content, className = "" }: { content: string; className?: string }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(<p key={`p-${blocks.length}`}>{inlineMarkdown(paragraph.join(" "))}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const ListTag = list.ordered ? "ol" : "ul";
    blocks.push(<ListTag key={`list-${blocks.length}`} className={list.ordered ? "list-decimal" : "list-disc"}>{list.items.map((item, index) => <li key={index}>{inlineMarkdown(item)}</li>)}</ListTag>);
    list = null;
  };

  lines.forEach((line) => {
    const heading = /^(#{1,4})\s+(.+?)\s*#*$/.exec(line);
    const unordered = /^\s*[-*+]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);

    if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const headingTags = ["h3", "h4", "h5", "h6"] as const;
      const Tag = headingTags[level - 1];
      blocks.push(<Tag key={`h-${blocks.length}`} className="font-bold text-gray-900">{inlineMarkdown(heading[2])}</Tag>);
    } else if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push((unordered ?? ordered)![1]);
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  });

  flushParagraph();
  flushList();

  return <div className={`space-y-2 ${className}`}>{blocks}</div>;
}
