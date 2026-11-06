import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCollectionTitle, getFieldGuide } from '@/lib/field-library/catalog';
import styles from '../library.module.css';

export const metadata: Metadata = {
  title: '72 Hours Without Electricity — Long Watch Field Library',
  description:
    'Field Guide 001 is in editorial preparation and is not yet approved for public distribution.',
};

export default function FieldGuidePage() {
  const guide = getFieldGuide('001');
  if (!guide) notFound();

  return (
    <main className={styles.guidePage}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>FIELD GUIDE {guide.id}</p>
        <h1>{guide.title}</h1>
        <p className={styles.guideAuthor}>By {guide.author}</p>
        <p className={styles.guideDescription}>{guide.description}</p>

        <dl className={styles.guideDetails}>
          <div>
            <dt>Collection</dt>
            <dd>{getCollectionTitle(guide.collectionId)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd><span className={styles.status}>{guide.publicationStatus}</span></dd>
          </div>
        </dl>

        <p className={styles.preparationNote}>
          The manuscript is not yet approved for public distribution.
        </p>
      </div>
    </main>
  );
}
