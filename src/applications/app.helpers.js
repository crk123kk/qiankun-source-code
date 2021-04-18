// 描述应用的整个状态

// 应用刚刚初始化，应用初始状态
export const NOT_LOADED = 'NOT_LOADED';
// 调用了registerApplication方法， 加载资源的时候
export const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE';
// 还没调用bootstrap方法
export const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED';
// 启动中
export const BOOTSTRAPPING = 'BOOTSTRAPPING';
// 没有调用 mount 方法
export const NOT_MOUNTED = 'NOT_MOUNTED';
// 正在挂载中
export const MOUNTING = 'MOUNTING';
// 挂载完毕
export const MOUNTED = 'MOUNTED';
// 更新中
export const UPDATING = 'UPDATING';
// 接触挂载
export const UNMOUNTING = 'UNMOUNTING';
// 完全卸载
export const UNLOADING = 'UNLOADING';
// 加载资源发生错误
export const LOAD_ERR = 'LOAD_ERR';
// 代码发生异常时
export const SKIP_BECAUSE_BROKEN = 'SKIP_BECAUSE_BROKEN';

// 当前应用是否被激活
export function isActive(app) {
  return app.status === MOUNTED;
}

// 当前这个应用是否要被激活：当路由匹配成功的时候，进行激活
export function shouldBeActive(app) {
  return app.activeWhen(window.location);
}
