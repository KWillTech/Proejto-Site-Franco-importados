import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ padding: '32px 0' }}>
      <section className="container" style={{ textAlign: 'center' }}>
        <h1 className="sec-title">Página não encontrada</h1>
        <p>
          Não encontramos o que você procurava. <Link href="/">Voltar para a home</Link>
        </p>
      </section>
    </main>
  );
}
