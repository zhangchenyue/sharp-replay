import NodeCache from 'node-cache';

type InitializeFunction = () => Promise<void>;
type QueryFunction = (...args: string[]) => Promise<IQueryReturn>;

interface IQueryReturn {
  /** data returned of query */
  value: string;
  /** TTL of value in memory cache, seconds */
  ttl?: number;
}

/**
 * generate a singleton that only initialize once and query once for same parameters during TTL
 * @param queryFn query function to call
 * @param initializeFn intialize function to call at the beginning
 */
const singleton = (queryFn: QueryFunction, initializeFn: InitializeFunction) => {
  const memoryCache = new NodeCache();
  let init: boolean | Promise<boolean> = false;
  return async (...args: string[]) => {
    if (init === false) {
      init = initializeFn().then(() => true);
      init = await init;
    } else if (init instanceof Promise) {
      await init;
    }

    const cacheKey = args.join(':');
    const cache = memoryCache.get<string | Promise<string>>(cacheKey);
    if (typeof cache === 'string') {
      return cache;
    } else if (cache instanceof Promise) {
      return await cache;
    }
    const cachePromise = setCache(queryFn, args, memoryCache);
    memoryCache.set(cacheKey, cachePromise);
    return await cachePromise;
  };
};

const setCache = async (queryFn: QueryFunction, args: string[], memoryCache: NodeCache) => {
  const cacheKey = args.join(':');

  const { value, ttl } = await queryFn(...args);
  if (typeof ttl === 'number') {
    memoryCache.set(cacheKey, value, ttl);
  } else {
    memoryCache.set(cacheKey, value);
  }
  return value;
};

export default singleton;
