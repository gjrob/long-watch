import Link from 'next/link';
import styles from './library.module.css';

export default function LibraryHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.wordmark} href="/" aria-label="Long Watch home">
          LONG WATCH<span className={styles.wordmarkRule} aria-hidden="true" />
        </Link>
        <nav className={styles.nav} aria-label="Primary navigation">
          <Link href="/#investigations">Investigations</Link>
          <Link href="/#method">Method</Link>
          <Link href="/#publications">Publications</Link>
          <Link href="/library" aria-current="page">Library</Link>
          <Link href="/observatory">Observatory</Link>
        </nav>
      </div>
    </header>
  );
}
