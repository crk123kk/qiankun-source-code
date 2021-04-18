import {
  LOADING_SOURCE_CODE,
  NOT_BOOTSTRAPPED,
} from '../applications/app.helpers';

/**
 * 最终返回的是一个多个方法组合成的的一个方法
 */
function flattenFnArray(fns) {
  fns = Array.isArray(fns) ? fns : [fns];

  return (props) => {
    // 最终返回的是一个链式调用的Promise, 通过Promse链来链式调用
    // Promise.resolve().then(() => fn1(props)).then(() => fn2(props));
    return fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve());
  };
}

export async function toLoadPromise(app) {
  // 这里需要做个缓存，避免因为同步异步问题而多次调用
  if (app.loadPromise) {
    return app.loadPromise;
  }

  // 如果loadPromise不存在，则是第一次加载，则将封装好的Promise对象返回给loadPromise中 （即：缓存）
  // 当再次调用app.loadPromise的时候，则用的就还是这个返回的loadPromise方法
  return (app.loadPromise = Promise.resolve().then(async () => {
    app.status = LOADING_SOURCE_CODE;
    let { bootstrap, mount, unmount } = await app.loadApp(app.customProps);
    // 此时还未调用bootstrap方法
    app.status = NOT_BOOTSTRAPPED;

    // 因为传入的bootstrap可能是异步函数的数组，这时候我们希望将其组合起来 compose
    app.bootstrap = flattenFnArray(bootstrap);
    app.mount = flattenFnArray(mount);
    app.unmount = flattenFnArray(unmount);

    // 当方法调用结束，需要将缓存清空
    delete app.loadPromise;
    return app;
  }));
}
