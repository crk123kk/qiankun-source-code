import { getAppChanges } from '../applications/app';
import { toBootstrapPromise } from '../lifecycles/bootstrap';
import { toLoadPromise } from '../lifecycles/load';
import { toUnmountPromise } from '../lifecycles/unmount';
import { toMountPromise } from '../lifecycles/mount';
import { started } from '../start';

import './navigator-events';

/**
 * 核心应用处理方法
 */
export function reroute() {
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
    let apps = await Promise.all(appsToLoad.map(toLoadPromise));
    // console.log('apps :>> ', apps);
  }

  /**
   * 根据路径来装载应用
   */
  async function performAppChanges() {
    // 先卸载不需要的应用
    let unmountPromses = appsToUnmount.map(toUnmountPromise);
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
