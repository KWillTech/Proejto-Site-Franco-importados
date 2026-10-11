import Image from "next/image";

export default function Home() {
  return (
    <main className="container">
      <Image
        src="/logos/franco-logo-preto.png"
        alt="Franco Importados"
        width={240}
        height={80}
        priority
      />
    </main>
  );
}
