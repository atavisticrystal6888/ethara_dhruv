export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <section className="state state-empty">
      <p>{title}</p>
      {action}
    </section>
  );
}
