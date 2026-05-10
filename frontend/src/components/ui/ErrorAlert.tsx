export function ErrorAlert({ message }: { message: string }) {
  return <div className="alert alert-error" role="alert">{message}</div>;
}
