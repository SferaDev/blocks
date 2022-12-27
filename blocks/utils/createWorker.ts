function createWorker() {
  var code = `
  importScripts('https://cdn.jsdelivr.net/npm/@rollup/browser/dist/rollup.browser.js');
  importScripts('https://unpkg.com/isomorphic-git');
  importScripts('https://unpkg.com/@isomorphic-git/lightning-fs');

  const SEARCH_EXTENSIONS = [
    "/index.tsx",
    "/index.ts",
    "/index.js",
    ".tsx",
    ".ts",
    ".json",
    ".js",
  ];

  function searchFile(    vfs,    filepath,   extensions  ) {
    for (const ext of ["", ...extensions]) {
      // console.log("searching...", filepath + ext);
      if (vfs.has(filepath + ext)) {
        return filepath + ext;
      }
    }
  }

  const DEBUG = false;
  const log = (...args) => {
    if (DEBUG) console.log(...args);
  };

  const isFileSchema = (id) =>
    id.startsWith("file://") || id.startsWith("/");

  const isRelativePath = (id) => stripSchema(id).startsWith(".");
  const stripSchema = (id) => id.replace(/^file\\:(\\/\\/)?/, "");

  const virtualFs = ({
    files,
    extensions = SEARCH_EXTENSIONS,
    memoryOnly = true,
  }) => {

    const vfs = new Map(Object.entries(files));

    return {
      name: "virtual-fs",
      resolveId(id, importer) {
        // const exts = extensions ?;
        log("[rollup-plugin-virtual-fs]", id, importer);
        const normalized = stripSchema(id);
        // entry point
        if (isFileSchema(id) && importer == null) {
          return searchFile(vfs, normalized, extensions);
        }
        // relative filepath
        if (importer && isFileSchema(importer) && isRelativePath(id)) {
          const rawImporter = importer.replace(/^file\\:/, "");
          const fullpath = id;
          const reslovedWithExt = searchFile(vfs, fullpath, extensions);
          if (reslovedWithExt) return reslovedWithExt;
          this.warn('[rollup-plugin-virtual-fs] can not resolve id: ' + fullpath);
        }
      },
      load(id) {
        const real = stripSchema(id);
        const ret = vfs.get(real);
        if (ret) return ret;
        if (memoryOnly)
          throw new Error('[virtualFs] ' + id + ' is not found on files');
      },
    };
  };

  // Convert a value to an Async Iterator
// This will be easier with async generator functions.
function fromValue(value) {
  let queue = [value];
  return {
    next() {
      return Promise.resolve({ done: queue.length === 0, value: queue.pop() })
    },
    return() {
      queue = [];
      return {}
    },
    [Symbol.asyncIterator]() {
      return this
    },
  }
}

function getIterator(iterable) {
  if (iterable[Symbol.asyncIterator]) {
    return iterable[Symbol.asyncIterator]()
  }
  if (iterable[Symbol.iterator]) {
    return iterable[Symbol.iterator]()
  }
  if (iterable.next) {
    return iterable
  }
  return fromValue(iterable)
}

// Currently 'for await' upsets my linters.
async function forAwait(iterable, cb) {
  const iter = getIterator(iterable);
  while (true) {
    const { value, done } = await iter.next();
    if (value) await cb(value);
    if (done) break
  }
  if (iter.return) iter.return();
}

async function collect(iterable) {
  let size = 0;
  const buffers = [];
  await forAwait(iterable, value => {
    buffers.push(value);
    size += value.byteLength;
  });
  const result = new Uint8Array(size);
  let nextIndex = 0;
  for (const buffer of buffers) {
    result.set(buffer, nextIndex);
    nextIndex += buffer.byteLength;
  }
  return result
}

// Convert a web ReadableStream (not Node stream!) to an Async Iterator
// adapted from https://jakearchibald.com/2017/async-iterators-and-generators/
function fromStream(stream) {
  // Use native async iteration if it's available.
  if (stream[Symbol.asyncIterator]) return stream
  const reader = stream.getReader();
  return {
    next() {
      return reader.read()
    },
    return() {
      reader.releaseLock();
      return {}
    },
    [Symbol.asyncIterator]() {
      return this
    },
  }
}


async function request({
  onProgress,
  url,
  method = 'GET',
  headers = {},
  body,
}) {
  // streaming uploads aren't possible yet in the browser
  if (body) {
    body = await collect(body);
  }
  const res = await fetch(url, { method, headers, body });
  const iter =
    res.body && res.body.getReader
      ? fromStream(res.body)
      : [new Uint8Array(await res.arrayBuffer())];
  // convert Header object to ordinary JSON
  headers = {};
  for (const [key, value] of res.headers.entries()) {
    headers[key] = value;
  }
  return {
    url: res.url,
    method: res.method,
    statusCode: res.status,
    statusMessage: res.statusText,
    body: iter,
    headers: headers,
  }
}

  const http = { request };

  self.onmessage = async function (e) {
    try {
    const { rollup: runRollup } = rollup;

    const bundle = await runRollup({
        input: '/index.js',
        output: { file: 'file://bundle.js' },
        plugins: [virtualFs({ files: { "/index.js": 'const foo = 1; export default foo;' } })]
      });

    const { output } = await bundle.generate({});

    self.postMessage({ kind:"bundle", data: output[0].code});

    self.postMessage({ kind:"git", data: null});

    const fs = new LightningFS('block-tests-fs');

    await git.clone({
      fs,
      http,
      dir: '/foo-bar',
      url: 'https://github.com/SferaDev/block-tests',
      corsProxy: 'https://dev.eyeseetea.com/cors/',
      force: true,
    });

    const foo = await fs.promises.readFile('/foo-bar/myadd.test.ts', 'utf8');

    self.postMessage({ kind:"git", data: foo});

    self.postMessage({ kind:"done", data: null});
  } catch (e) {
    self.postMessage({ kind:"error", data: e});
  }

    // Close the worker
    self.close();
  };
  `;

  const blob = new Blob([code], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));

  // Test, used in all examples:
  worker.onmessage = function (e) {
    console.log('Response: ' + e.data.kind, e.data.data);
  };

  worker.postMessage('Test');
}
