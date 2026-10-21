interface Props {
  message: { id: number; text: string } | null;
}

export function Toast({ message }: Props) {
  if (!message) return null;
  return (
    <div key={message.id} className="toast" role="status" aria-live="polite">
      {message.text}
    </div>
  );
}
