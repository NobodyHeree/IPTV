
import * as all from 'mpegts.js';
import def from 'mpegts.js';

console.log('Named exports:', Object.keys(all));
console.log('Default export keys:', def ? Object.keys(def) : 'null');
console.log('Is getIsSupported in default?', def && typeof def.getIsSupported);
