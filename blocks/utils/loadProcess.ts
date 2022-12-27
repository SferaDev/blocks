declare global {
  var process: any;
}

globalThis.process = {
  env: {
    NODE_ENV: 'development'
  }
};

export {};
