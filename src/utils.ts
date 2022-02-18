export function setPath(target: any, paths: string[], value: unknown) {
  if (paths.length === 1) {
    target[paths[0]] = value;
    return target;
  }

  let next = target;

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    if (i === paths.length - 1) {
      next[path] = value;
    } else {
      const current = next[path];
      next = next[path] = current ?? (isNaN(paths[i + 1] as any) ? {} : []);
    }
  }
}
