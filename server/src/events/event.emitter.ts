import { EventEmitter } from 'events';

const appEmitter = new EventEmitter();

appEmitter.setMaxListeners(20);

export default appEmitter;