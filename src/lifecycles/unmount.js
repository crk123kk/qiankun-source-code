import { MOUNTED, NOT_MOUNTED, UNMOUNTING } from '../applications/app.helpers';

export async function toUnmountPromise(app) {
  // 当前应用没有被挂载的应用则直接什么都不用做
  if (app.status != MOUNTED) {
    return app;
  }
  app.status = UNMOUNTING;
  await app.unmount(app.customProps);
  app.status = NOT_MOUNTED;
  return app;
}
