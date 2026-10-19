// 돈 숫자: 숫자는 크고 굵게, '억·만·원·년' 같은 단위는 작게 (통장 숫자처럼 숫자가 먼저 읽히게)
const PART = /([+−-]?[\d,.]+)/;

export function Num({ text }: { text: string }) {
  if (!/\d/.test(text)) return <>{text}</>;
  return (
    <>
      {text.split(PART).filter(Boolean).map((p, i) => (PART.test(p) ? <span key={i} className="n">{p}</span> : <span key={i} className="u">{p}</span>))}
    </>
  );
}
