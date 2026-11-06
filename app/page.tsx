import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './home.module.css';

const investigationUrl =
  'https://infrastructure.longwatch.win/index.php/2026/09/18/does-a-773-million-funding-gap-mean-wilmingtons-new-bridge-has-to-be-tolled-2/';

export const metadata: Metadata = {
  title: 'Long Watch — Argument Intelligence & Investigative Research',
  description:
    'Long Watch tests consequential claims against evidence through structured analysis, human judgment, and a permanent record of what survives.',
  alternates: { canonical: 'https://www.longwatch.win/' },
};

const method = [
  ['01', 'Claim', 'Define the consequential proposition precisely.'],
  ['02', 'Evidence', 'Gather the relevant record and freeze the packet being tested.'],
  ['03', 'Press', 'Construct the strongest case for the proposition.'],
  ['04', 'Challenge', 'Construct the strongest challenge to it.'],
  ['05', 'Human judgment', 'A person reviews what the evidence actually supports.'],
  ['06', 'What survives', 'State the finding at the level the evidence permits.'],
  ['07', 'Ledger', 'Preserve the finding and the path that led to it.'],
] as const;

export default function Home() {
  return (
    <main className={styles.site}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.wordmark} href="/" aria-label="Long Watch home">LONG WATCH<span className={styles.wordmarkRule} /></Link>
          <nav className={styles.nav} aria-label="Primary navigation">
            <a href="#investigations">Investigations</a>
            <a href="#method">Method</a>
            <a href="#publications">Publications</a>
            <Link href="/library">Library</Link>
            <Link href="/observatory">Observatory</Link>
          </nav>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.container}>
          <p className={styles.eyebrow}>Pressed. Shaken. What survives?</p>
          <h1 id="hero-title">We test consequential claims against evidence<span className={styles.fullStop}>.</span></h1>
          <p className={styles.heroLead}>Long Watch subjects important claims to structured evidence, competing analysis, and human judgment — then preserves what survives in a permanent record.</p>
          <p className={styles.operating}>Machine analysis. <span>Human judgment.</span> Permanent ledger.</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href={investigationUrl}>Read our first investigation <span aria-hidden="true">↗</span></a>
            <a className={styles.textButton} href="#method">How Long Watch works <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className={styles.heroFoot} aria-hidden="true"><span>01 / THE TEST</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className={styles.investigation} id="investigations" aria-labelledby="investigation-title">
        <div className={styles.container}>
          <div className={styles.sectionHead}><p className={styles.eyebrow}>First investigation</p><span className={styles.sectionIndex}>01 — PUBLISHED WORK</span></div>
          <div className={styles.featureGrid}>
            <div>
              <p className={styles.publicationLabel}>Cape Fear Infrastructure</p>
              <h2 id="investigation-title">Does a $773 Million Funding Gap Mean Wilmington&apos;s New Bridge Has to Be Tolled?</h2>
            </div>
            <div className={styles.featureAside}>
              <p>A large funding gap does not by itself prove that tolling is necessary.</p>
              <a className={styles.arrowLink} href={investigationUrl}>Read the investigation <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.method} id="method" aria-labelledby="method-title">
        <div className={styles.container}>
          <div className={styles.sectionHead}><p className={styles.eyebrow}>The method</p><span className={styles.sectionIndex}>02 — HOW IT WORKS</span></div>
          <div className={styles.methodIntro}>
            <h2 id="method-title">The strongest test an argument can survive.</h2>
            <p>A claim is pressed by the evidence and challenged from the other side. Machine output does not independently become the final judgment.</p>
          </div>
          <ol className={styles.methodList}>
            {method.map(([number, title, description]) => (
              <li key={number}><span className={styles.stepNumber}>{number}</span><strong>{title}</strong><span>{description}</span></li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.doors} aria-labelledby="doors-title">
        <div className={styles.container}>
          <div className={styles.sectionHead}><p className={styles.eyebrow}>Where to go next</p><span className={styles.sectionIndex}>03 — THREE DOORS</span></div>
          <h2 id="doors-title" className={styles.visuallyHidden}>Explore Long Watch</h2>
          <div className={styles.doorGrid}>
            <article className={styles.door}>
              <span className={styles.doorNumber}>01 / INVESTIGATIONS</span>
              <h3>Claims in public life.</h3>
              <p>Public-interest investigations of consequential claims, beginning with Cape Fear Infrastructure.</p>
              <a className={styles.arrowLink} href={investigationUrl}>Explore investigations <span aria-hidden="true">↗</span></a>
            </article>
            <article className={styles.door}>
              <span className={styles.doorNumber}>02 / ARGUMENT INTELLIGENCE</span>
              <h3>Decisions under pressure.</h3>
              <p>Research that structures a proposition, tests competing arguments, and records what survives human review.</p>
              <a className={styles.arrowLink} href="#method">Learn about the method <span aria-hidden="true">↑</span></a>
            </article>
            <article className={styles.door} id="publications">
              <span className={styles.doorNumber}>03 / PUBLICATIONS</span>
              <h3>Local work. Distinct desks.</h3>
              <ul>
                <li><a href="https://infrastructure.longwatch.win/">Cape Fear Infrastructure <span aria-hidden="true">↗</span></a></li>
                <li><a href="https://signal.longwatch.win/">Wilmington Local Signal <span aria-hidden="true">↗</span></a></li>
                <li>Cape Fear Business <span className={styles.muted}>— publication profile</span></li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.record} aria-labelledby="record-title">
        <div className={styles.container}>
          <p className={styles.eyebrow}>The record matters</p>
          <div className={styles.recordGrid}>
            <h2 id="record-title">A conclusion should have a history.</h2>
            <div>
              <p>Analysis is easy to rewrite after the fact. Long Watch preserves observable records so the path to a conclusion can be examined later.</p>
              <Link className={styles.arrowLink} href="/observatory">View the observatory <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}><strong>LONG WATCH</strong><nav aria-label="Footer navigation"><a href="#investigations">Investigations</a><a href="#publications">Publications</a><Link href="/observatory">Observatory</Link></nav></div>
          <p>Machine analysis. Human judgment. Permanent ledger.</p>
          <p className={styles.principle}>We don&apos;t sell the truth to the highest bidder.<br />We sell the strongest test an argument can survive.</p>
        </div>
      </footer>
    </main>
  );
}
