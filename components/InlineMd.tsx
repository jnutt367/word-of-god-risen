// Tiny inline-markdown renderer for character sheet text: **bold** and *italic*.
export default function InlineMd({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*.+?\*\*|\*[^*]+?\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-cream-50">
          {tok.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
