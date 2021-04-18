(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.singleSpa = {}));
}(this, (function (exports) { 'use strict';

  // 描述应用的整个状态

  // 应用刚刚初始化，应用初始状态
  const NOT_LOADED = 'NOT_LOADED';
  // 调用了registerApplication方法， 加载资源的时候
  const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE';
  // 还没调用bootstrap方法
  const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED';
  // 启动中
  const BOOTSTRAPPING = 'BOOTSTRAPPING';
  // 没有调用 mount 方法
  const NOT_MOUNTED = 'NOT_MOUNTED';
  // 正在挂载中
  const MOUNTING = 'MOUNTING';
  // 挂载完毕
  const MOUNTED = 'MOUNTED';
  // 接触挂载
  const UNMOUNTING = 'UNMOUNTING';

  // 当前这个应用是否要被激活：当路由匹配成功的时候，进行激活
  function shouldBeActive(app) {
    return app.activeWhen(window.location);
  }

  async function toBootstrapPromise(app) {
    if (app.status !== NOT_BOOTSTRAPPED) {
      return app;
    }
    app.status = BOOTSTRAPPING;
    await app.bootstrap(app.customProps);
    app.status = NOT_MOUNTED;
    return app;
  }

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

  async function toLoadPromise(app) {
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

  async function toUnmountPromise(app) {
    // 当前应用没有被挂载的应用则直接什么都不用做
    if (app.status != MOUNTED) {
      return app;
    }
    app.status = UNMOUNTING;
    await app.unmount(app.customProps);
    app.status = NOT_MOUNTED;
    return app;
  }

  async function toMountPromise(app) {
    if (app.status !== NOT_MOUNTED) {
      return app;
    }
    app.status = MOUNTING;
    await app.mount(app.customProps);
    app.status = MOUNTED;
    return app;
  }

  // 哨兵变量
  let started = false;

  function start() {
    // 需要挂载应用
    started = true;
    // 除了加载应用还需要挂载应用
    reroute();
  }

  const routingEventsListeningTo = ['hashchange', 'popstate'];

  function urlReroute() {
    reroute();
  }

  const capturedEventListeners = {
    hashchange: [],
    popstate: [],
  };

  window.addEventListener('hashchange', urlReroute);
  window.addEventListener('popstate', urlReroute);

  // 保留原有的事件
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  window.addEventListener = function (eventName, fn) {
    // 当事件存在需要捕获的，并且未被捕获过
    if (
      routingEventsListeningTo.indexOf(eventName) >= 0 &&
      !capturedEventListeners[eventName].some((listener) => listener == fn)
    ) {
      capturedEventListeners[eventName].push(fn);
      return;
    }
    return originalAddEventListener.apply(this, arguments);
  };

  window.removeEventListener = function (eventName, fn) {
    if (routingEventsListeningTo.indexOf(eventName) >= 0) {
      capturedEventListeners[eventName] = capturedEventListeners[
        eventName
      ].filter((l) => l !== fn);
      return;
    }
    return originalRemoveEventListener.apply(this, arguments);
  };

  // 如果是hash路由 hash变化时可以切换
  // 浏览器路由，浏览器是由 h5 API的，如果切换时不会触发popstate，所以需要重写浏览器切换的方法

  function patchedUpdateState(updateState, methodName) {
    return function () {
      // 获取切换之前的路由
      const urlBefore = window.location.href;
      // 调用原生的切换页面的方法
      updateState.apply(this, arguments);
      // 获取切换之后的路由
      const urlAfter = window.location.href;
      if (urlBefore !== urlAfter) {
        urlReroute(new PopStateEvent('popstate'));
      }
    };
  }
  window.history.pushState = patchedUpdateState(
    window.history.pushState);
  window.history.replaceState = patchedUpdateState(
    window.history.replaceState);

  // 用户可能还会绑定自己的路由事件 如vue应用中的路由

  // 当我们应用切换后，还需要处理原来的方法，并且是需要在应用切换后再执行

  /**
   * 核心应用处理方法
   */
  function reroute() {
    // 需要获取要加载的应用

    // 需要获取要被挂载的应用

    // 哪些应用需要被卸载

    const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges();

    //   console.log(appsToLoad, appsToMount, appsToUnmount);

    if (started) {
      // app 装载
      // console.log('started');

      return performAppChanges();
    } else {
      // 注册应用时， 需要预先加载
      // console.log('register');
      return loadApps();
    }

    /**
     * 预加载应用
     */
    async function loadApps() {
      // 获取到bootstrap、mount、unmount方法放到app上
      await Promise.all(appsToLoad.map(toLoadPromise));
      // console.log('apps :>> ', apps);
    }

    /**
     * 根据路径来装载应用
     */
    async function performAppChanges() {
      // 先卸载不需要的应用
      appsToUnmount.map(toUnmountPromise);
      // 去加载需要的应用
      // 这里可能出现一种情况，当要加载app1的时候，这时候切换到app2了，那么app1其实就不需要加载了，这也需要做判断
      appsToLoad.map(async (app) => {
        // 将需要加载的应用拿到之后： 加载 => 启动 => 挂载
        app = await toLoadPromise(app);
        app = await toBootstrapPromise(app);
        return await toMountPromise(app);
      });

      // 有些应用是之前就加载完毕的，这时候需要直接去挂载
      appsToMount.map(async (app) => {
        app = await toBootstrapPromise(app);
        return await toMountPromise(app);
      });
    }
  }

  // 这个流程是用于初始化操作的，我们还需要做到当路由切换的时候重新加载应用

  // 重写路由相关的方法

  // 用来存放所有的应用
  const apps = [];

  // 维护应用所有的状态：状态机原理
  /**
   * 本质上做的是将传入的子应用组成一个对象存放到apps数组中
   * @param {*} appName 应用名字
   * @param {*} loadApp 加载的应用
   * @param {*} activeWhen 当激活时会调用loadApp
   * @param {*} customProps 自定义属性
   */
  function registerApplication(appName, loadApp, activeWhen, customProps) {
    // 注册应用
    apps.push({
      name: appName,
      loadApp,
      activeWhen,
      customProps,
      status: NOT_LOADED,
    });

    //   console.log('apps :>> ', apps);

    // 加载应用
    reroute();

    // vue一系列生命周期
  }

  function getAppChanges() {
    // 要卸载的app
    const appsToUnmount = [];
    // 要加载的app
    const appsToLoad = [];
    // 需要挂载的app
    const appsToMount = [];

    // 根据app的不同的状态填装进不同的数组中
    apps.forEach((app) => {
      // 需不需要被加载
      const appShouldBeActive = shouldBeActive(app);
      switch (app.status) {
        case NOT_LOADED:
        case LOADING_SOURCE_CODE:
          if (appShouldBeActive) {
            appsToLoad.push(app);
          }
          break;
        case NOT_BOOTSTRAPPED:
        case BOOTSTRAPPING:
        case NOT_MOUNTED:
          if (appShouldBeActive) {
            appsToMount.push(app);
          }
          break;
        case MOUNTED:
          if (!appShouldBeActive) {
            appsToUnmount.push(app);
          }
          break;
      }
    });
    return {
      appsToMount,
      appsToUnmount,
      appsToLoad,
    };
  }

  exports.registerApplication = registerApplication;
  exports.start = start;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=single-spa.js.map
