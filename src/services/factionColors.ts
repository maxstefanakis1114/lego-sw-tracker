export const factionColors: Record<string, string> = {
  'Clone': '#fff176',
  'Empire': '#90a4ae',
  'First Order': '#78909c',
  'Rebel Alliance': '#ef5350',
  'Resistance': '#ff8a65',
  'Jedi': '#4fc3f7',
  'Sith': '#ef5350',
  'Mandalorian': '#4db6ac',
  'Bounty Hunter': '#66bb6a',
  'Droid': '#b0bec5',
  'Wookiee': '#8d6e63',
  'Ewok': '#a1887f',
  'Civilian': '#ffcc80',
  'Other': '#757575',
};

export function getFactionColor(faction: string): string {
  return factionColors[faction] || '#757575';
}

export function factionGlowClass(faction: string): string {
  const map: Record<string, string> = {
    'Jedi': 'faction-glow-jedi',
    'Sith': 'faction-glow-sith',
    'Empire': 'faction-glow-empire',
    'Rebel Alliance': 'faction-glow-rebel',
    'Mandalorian': 'faction-glow-mandalorian',
    'Clone': 'faction-glow-clone',
    'Bounty Hunter': 'faction-glow-bounty',
    'Droid': 'faction-glow-droid',
    'Wookiee': 'faction-glow-wookiee',
    'Ewok': 'faction-glow-ewok',
    'Civilian': 'faction-glow-civilian',
  };
  return map[faction] || 'faction-glow-default';
}
