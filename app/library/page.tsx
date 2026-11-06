import Link from 'next/link';
import { fieldLibraryCollections, fieldGuides } from '@/lib/field-library/catalog';
import styles from './library.module.css';

export default function FieldLibraryPage() {
  const firstGuide = fieldGuides[0];

  return (
    <main>
      <section className={styles.hero} aria-labelledby="library-title">
        <div className={styles.container}>
          <p className={styles.eyebrow}>LONG WATCH FIELD LIBRARY</p>
          <h1 id="library-title">Knowledge worth keeping.</h1>
          <p className={styles.lead}>
            Practical knowledge in mechanics, electricity, water, chemistry, health, and field skills.
            Built for careful study, everyday usefulness, and offline reference.
          </p>
        </div>
      </section>

      <section className={styles.collections} aria-labelledby="collections-title">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Explore by subject</p>
              <h2 id="collections-title">Six collections.</h2>
            </div>
            <span className={styles.sectionIndex}>FIELD LIBRARY / 01</span>
          </div>
          <ul className={styles.collectionGrid}>
            {fieldLibraryCollections.map((collection, index) => (
              <li className={styles.collection} key={collection.id}>
                <span className={styles.collectionNumber}>{String(index + 1).padStart(2, '0')}</span>
                <h3>{collection.title}</h3>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {firstGuide && (
        <section className={styles.guideSection} aria-labelledby="guide-section-title">
          <div className={styles.container}>
            <p className={styles.eyebrow}>First guide</p>
            <div className={styles.guideFeature}>
              <div>
                <p className={styles.guideId}>FIELD GUIDE {firstGuide.id}</p>
                <h2 id="guide-section-title">{firstGuide.title}</h2>
                <p>{firstGuide.description}</p>
              </div>
              <div className={styles.guideAside}>
                <span className={styles.status}>{firstGuide.publicationStatus}</span>
                <Link className={styles.textLink} href={`/library/${firstGuide.id}`}>
                  View guide details <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
