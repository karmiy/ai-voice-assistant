import { WakeWordStreamer } from '../utils/wakeWordStreamer';
import { WakeWordModel, WakeWordModelOptions } from '../utils/wakeWordModel';
import context from '../../context';

const logger = context.logger.tags('[WakeWordManager]');

class WakeWordManager {
}

export const wakeWordManager = new WakeWordManager();