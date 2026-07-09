import { BadRequestException } from '@nestjs/common';

interface KnowledgeTypePayload {
  type: string;
  content?: { fr?: string };
  videoUrl?: string;
  pdfUrl?: string;
  images?: string[];
  steps?: { title?: { fr?: string }; description?: { fr?: string } }[];
}

/**
 * Enforces the Article/Video/Tutorial content rules against the FINAL merged
 * state of a knowledge item (existing doc + patch), not just the raw request
 * body — a partial PATCH may omit fields that are still relevant to the type.
 */
export function assertValidKnowledgeType(data: KnowledgeTypePayload): void {
  const errors: string[] = [];

  if (['article', 'video'].includes(data.type) && !data.content?.fr?.trim()) {
    errors.push('Le contenu (FR) est requis pour ce type de contenu');
  }

  if (data.type === 'video' && !data.videoUrl) {
    errors.push('La vidéo est requise pour un contenu de type Vidéo');
  }
  if (data.type !== 'video' && data.videoUrl) {
    errors.push("La vidéo n'est autorisée que pour le type Vidéo");
  }

  if (data.type !== 'article' && data.pdfUrl) {
    errors.push("Le PDF n'est autorisé que pour le type Article");
  }
  if (data.type !== 'article' && data.images?.length) {
    errors.push('Les images ne sont autorisées que pour le type Article');
  }

  if (data.type === 'tutorial') {
    const valid = !!data.steps?.length && data.steps.every(
      (s) => !!s?.title?.fr?.trim() && !!s?.description?.fr?.trim(),
    );
    if (!valid) errors.push('Au moins une étape avec titre et description est requise pour un tutoriel');
  } else if (data.steps?.length) {
    errors.push('Les étapes ne sont autorisées que pour le type Tutoriel');
  }

  if (errors.length) throw new BadRequestException(errors);
}
