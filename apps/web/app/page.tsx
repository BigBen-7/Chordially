const links = [
  {
    href: "#artists",
    title: "Artist Flow",
    description: "Go live, share your page, and collect real-time support."
  },
  {
    href: "#fans",
    title: "Fan Flow",
    description: "Discover live sets and drop a chord in seconds."
  },
  {
    href: "#admins",
    title: "Admin Flow",
    description: "Monitor users, sessions, and transactions from one dashboard."
  }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Chordially</p>
        <h1>Digital busking for artists, fans, and operators.</h1>
        <p className="lede">
          A monorepo starter for real-time artist sessions, fan tipping, and
          admin operations on Stellar.
        </p>
        <div className="cta-row">
          <a className="primary-link" href="#artists">
            Explore the product surface
          </a>
          <a className="secondary-link" href="https://stellar.org">
            Stellar network
          </a>
        </div>
      </section>

      <section className="grid">
        {links.map((link) => (
          <article className="card" id={link.href.slice(1)} key={link.title}>
            <p className="card-label">{link.title}</p>
            <p className="card-copy">{link.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
