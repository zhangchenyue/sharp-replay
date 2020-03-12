import log from './logger';
import single from './singleton';
export * from './constant';
export * from './file';

export const sleep = (waitTimeInMs: number) => new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
export const logger = log;
export const singleton = single;
