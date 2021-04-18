import { reroute } from '../navigations/reroute';
import {
  BOOTSTRAPPING,
  LOADING_SOURCE_CODE,
  MOUNTED,
  NOT_BOOTSTRAPPED,
  NOT_LOADED,
  NOT_MOUNTED,
  shouldBeActive,
} from './app.helpers';

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
export function registerApplication(appName, loadApp, activeWhen, customProps) {
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

export function getAppChanges() {
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
