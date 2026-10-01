// Display names of elements and groups ("Piston 2", "Rectangle 1"). Names are
// assigned on first use and stored on the element (`name`) or in
// engine.groupNames; Engine export/import keeps both.
import { SensorZone } from '../physics/SensorZone.js';
import { TextLabel } from '../physics/TextLabel.js';
import { ELEMENT_TYPES, elementTypeOf } from './elementSchema.js';

const GROUP_LABELS = { rect: 'Rectangle', circle: 'Circle', arc: 'Arc', poly: 'Polygon', group: 'Group' };

function nextFree(label, used) {
  let n = 1;
  while (used.has(`${label} ${n}`)) n++;
  return `${label} ${n}`;
}

export function elementName(item, engine) {
  if (item instanceof SensorZone) return item.label;
  if (item instanceof TextLabel) return `“${item.text}”`;
  if (item.name) return item.name;
  const type = elementTypeOf(item);
  const label = type ? ELEMENT_TYPES[type].label : 'Element';
  const used = new Set((engine?.elements || []).map(e => e.name).filter(Boolean));
  item.name = nextFree(label, used);
  return item.name;
}

export function renameElement(item, name) {
  const clean = name.trim();
  if (!clean) return;
  if (item instanceof SensorZone) item.label = clean;
  else if (item instanceof TextLabel) item.text = clean.replace(/^“|”$/g, '');
  else item.name = clean;
}

export function groupKindOf(groupId) {
  const m = /^g_(rect|circle|arc|poly)_/.exec(groupId || '');
  return m ? m[1] : 'group';
}

export function groupName(groupId, engine) {
  engine.groupNames = engine.groupNames || {};
  if (!engine.groupNames[groupId]) {
    engine.groupNames[groupId] = nextFree(GROUP_LABELS[groupKindOf(groupId)], new Set(Object.values(engine.groupNames)));
  }
  return engine.groupNames[groupId];
}

export function renameGroup(groupId, name, engine) {
  const clean = name.trim();
  if (!clean) return;
  engine.groupNames = engine.groupNames || {};
  engine.groupNames[groupId] = clean;
}
