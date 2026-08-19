import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <h1>Página no encontrada · Page not found</h1>
        <p>La dirección no existe o fue movida. The requested page does not exist or has moved.</p>
        <Link href="/">Volver al generador · Back to the builder</Link>
      </div>
    </main>
  );
}
