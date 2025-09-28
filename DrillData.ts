// Fix: Import DrillCategory from the central types file and remove the local definition.
import { Drill, DrillCategory } from './types';

export interface DrillDefinition {
  id: Drill;
  name: string;
  category: DrillCategory;
}

export const DRILL_CATEGORIES: DrillCategory[] = [
  'Attack Positions',
  'Defensive Situations',
  'Transitional & Neutral',
];

export const ALL_DRILLS: DrillDefinition[] = [
  // Attack Positions
  { id: 'mount', name: 'Mount', category: 'Attack Positions' },
  { id: 'back-control', name: 'Back Control', category: 'Attack Positions' },
  { id: 'side-control', name: 'Side Control', category: 'Attack Positions' },
  { id: 'knee-on-belly', name: 'Knee-on-Belly', category: 'Attack Positions' },
  { id: 'north-south', name: 'North-South', category: 'Attack Positions' },
  { id: 'attacking-guard', name: 'Attacking Guard', category: 'Attack Positions' },
  
  // Defensive Situations
  { id: 'bottom-mount', name: 'Bottom Mount', category: 'Defensive Situations' },
  { id: 'bottom-back-control', name: 'Bottom Back Control', category: 'Defensive Situations' },
  { id: 'bottom-side-control', name: 'Bottom Side Control', category: 'Defensive Situations' },
  { id: 'bottom-knee-on-belly', name: 'Bottom Knee-on-Belly', category: 'Defensive Situations' },
  { id: 'bottom-north-south', name: 'Bottom North-South', category: 'Defensive Situations' },
  { id: 'turtle', name: 'Turtle', category: 'Defensive Situations' },
  { id: 'bottom-takedown', name: 'Bottom of Takedown', category: 'Defensive Situations' },
  { id: 'defensive-guard', name: 'Defensive Guard', category: 'Defensive Situations' },

  // Transitional & Neutral
  { id: 'half-guard', name: 'Half Guard', category: 'Transitional & Neutral' },
  { id: 'open-guard', name: 'Open Guard', category: 'Transitional & Neutral' },
  { id: 'leg-entanglements', name: 'Leg Entanglements', category: 'Transitional & Neutral' },
  { id: 'scramble', name: 'Scramble', category: 'Transitional & Neutral' },
];
