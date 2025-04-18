import { Writable } from 'readable-stream';

export const blackHoleAudioWriter = new Writable({
  write: function (chunk, encoding, callback) {
    callback();
  },
  objectMode: true,
  decodeStrings: false,
});
