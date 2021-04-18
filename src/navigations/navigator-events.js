import { reroute } from './reroute';

export const routingEventsListeningTo = ['hashchange', 'popstate'];

function urlReroute() {
  reroute([], arguments);
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
  window.history.pushState,
  'pushState'
);
window.history.replaceState = patchedUpdateState(
  window.history.replaceState,
  'replaceState'
);

// 用户可能还会绑定自己的路由事件 如vue应用中的路由

// 当我们应用切换后，还需要处理原来的方法，并且是需要在应用切换后再执行
