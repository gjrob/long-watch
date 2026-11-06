export const fieldLibraryCollections = [
  { id: 'mechanics-repair', title: 'Mechanics & Repair' },
  { id: 'electricity-electronics', title: 'Electricity & Electronics' },
  { id: 'water-chemistry-sanitation', title: 'Water, Chemistry & Sanitation' },
  { id: 'botany-herbal-knowledge', title: 'Botany & Herbal Knowledge' },
  { id: 'health-emergency-care', title: 'Health & Emergency Care' },
  { id: 'food-field-skills', title: 'Food & Field Skills' },
] as const;

export type FieldGuide = {
  id: string;
  title: string;
  description: string;
  collectionId: (typeof fieldLibraryCollections)[number]['id'];
  author: string;
  publicationStatus: string;
  version: string | null;
  publicationDate: string | null;
  approvedPdfPath: string | null;
  sourceReferences: readonly string[];
  revisionHistory: readonly string[];
};

export const fieldGuides: readonly FieldGuide[] = [
  {
    id: '001',
    title: '72 Hours Without Electricity',
    description:
      'A practical household reference for preparing for and responding to short-term power outages.',
    collectionId: 'electricity-electronics',
    author: 'Long Watch',
    publicationStatus: 'In editorial preparation',
    version: null,
    publicationDate: null,
    approvedPdfPath: null,
    sourceReferences: [],
    revisionHistory: [],
  },
];

export function getFieldGuide(id: string) {
  return fieldGuides.find((guide) => guide.id === id);
}

export function getCollectionTitle(id: FieldGuide['collectionId']) {
  return fieldLibraryCollections.find((collection) => collection.id === id)?.title;
}
