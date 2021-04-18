import { reroute } from './navigations/reroute';

// 哨兵变量
export let started = false;

export function start() {
  // 需要挂载应用
  started = true;
  // 除了加载应用还需要挂载应用
  reroute();
}
