window.process = {
  ...window.process,
  nextTick: (callback, ...args) =>
    new Promise((resolve) => {
      setTimeout(() => {
        callback(...args);
        resolve(null);
      });
    }),
};
