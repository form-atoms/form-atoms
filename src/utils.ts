export function setPath<Result>(
  target: any,
  paths: string[],
  value: unknown,
  options: {
    immutable?: boolean;
  } = {}
): Result {
  if (options.immutable) {
    target = { ...target };
  }

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
      const current =
        options.immutable && next[path]
          ? Array.isArray(next[path])
            ? [...next[path]]
            : { ...next[path] }
          : next[path];
      next = next[path] = current ?? (isNaN(paths[i + 1] as any) ? {} : []);
    }
  }

  return target;
}

export function deletePath<Result>(
  target: any,
  paths: string[],
  options: {
    immutable?: boolean;
  } = {}
): Result {
  if (options.immutable) {
    target = { ...target };
  }

  if (paths.length === 1) {
    delete target[paths[0]];
    return target;
  }

  let next = target;

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];

    if (i === paths.length - 1) {
      if (Array.isArray(next)) {
        next.splice(Number(path), 1);
      } else {
        delete next[path];
      }
    } else {
      next = next[path] =
        options.immutable && next[path]
          ? Array.isArray(next[path])
            ? [...next[path]]
            : { ...next[path] }
          : next[path];
    }
  }

  return target;
}
