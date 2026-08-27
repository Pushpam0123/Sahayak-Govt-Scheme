import type { SchemeInfo } from './types';

export interface AudienceDefinition {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  predicate: (scheme: SchemeInfo) => boolean;
}

export const AUDIENCES: AudienceDefinition[] = [
  {
    slug: 'farmers',
    title: 'Government Schemes for Farmers & Agricultural Workers',
    shortTitle: 'Farmers',
    description:
      'Central and state welfare schemes offering direct income support, crop insurance coverage, pensions, and social security for agricultural households.',
    predicate: (s: SchemeInfo) => {
      const cat = s.category.toLowerCase();
      const id = s.id.toLowerCase();
      return (
        cat.includes('agri') ||
        id.includes('kisan') ||
        id.includes('fby') ||
        id.includes('fasal') ||
        id.includes('pm-jjby') ||
        id.includes('pm-sby') ||
        id.includes('atal-pension')
      );
    },
  },
  {
    slug: 'women',
    title: 'Government Schemes for Women & Mothers',
    shortTitle: 'Women',
    description:
      'Welfare programs providing direct maternity financial benefits, monthly assistance deposits, and business loans for women.',
    predicate: (s: SchemeInfo) => {
      const cat = s.category.toLowerCase();
      const id = s.id.toLowerCase();
      return (
        cat.includes('women') ||
        id.includes('matru') ||
        id.includes('ladli') ||
        id.includes('stand-up-india')
      );
    },
  },
  {
    slug: 'entrepreneurs',
    title: 'Government Schemes for Entrepreneurs & Small Businesses',
    shortTitle: 'Entrepreneurs',
    description:
      'Credit facilitation and bank loan schemes supporting greenfield enterprise setup for qualified borrowers.',
    predicate: (s: SchemeInfo) => {
      const cat = s.category.toLowerCase();
      const id = s.id.toLowerCase();
      return (
        cat.includes('business') ||
        cat.includes('financial inclusion') ||
        cat.includes('finance') ||
        id.includes('stand-up') ||
        id.includes('mudra')
      );
    },
  },
  {
    slug: 'students',
    title: 'Government Schemes for Students',
    shortTitle: 'Students',
    description:
      'Scholarships and educational support programs for students and scholars.',
    predicate: (s: SchemeInfo) => {
      const cat = s.category.toLowerCase();
      const id = s.id.toLowerCase();
      return (
        cat.includes('education') ||
        cat.includes('scholarship') ||
        id.includes('scholarship')
      );
    },
  },
];

export function getAudienceBySlug(slug: string): AudienceDefinition | undefined {
  return AUDIENCES.find((a) => a.slug === slug);
}
