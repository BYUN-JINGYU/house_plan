// 화면 가운데 안내 한 장 (불러오는 중, 오류)
interface Props {
  title: string;
  text?: string;
  action?: string;
  onAction?: () => void;
}

export function Notice({ title, text, action, onAction }: Props) {
  return (
    <div className="notice" role="status">
      <p className="notice-title">{title}</p>
      {text && <p className="notice-text">{text}</p>}
      {action && onAction && <button type="button" className="btn" onClick={onAction}>{action}</button>}
    </div>
  );
}
