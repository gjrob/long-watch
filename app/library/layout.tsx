import type { Metadata } from 'next';
import LibraryHeader from './LibraryHeader';
import styles from './library.module.css';

export const metadata: Metadata = {
  title: 'Field Library — Long Watch',
  description:
    'Practical knowledge for careful study, everyday usefulness, and offline reference.',
};

export default function FieldLibraryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.site}>
      <LibraryHeader />
      {children}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <strong>LONG WATCH FIELD LIBRARY</strong>
          <p>Knowledge worth keeping.</p>
        </div>
      </footer>
    </div>
  );
}
