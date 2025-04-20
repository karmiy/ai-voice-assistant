export enum CUSTOM_WAKE_WORD {
  HEY_RING_BUDDY = 'Hey Ring Buddy',
}

export const CUSTOM_WAKE_WORD_MODELS = [
  {
    publicPath: `${process.env.PUBLIC_URL}/models/Hey-Ring-Buddy_en_wasm_v3_0_0.ppn`,
    label: 'Hey Ring Buddy',
  },
]

export const WAKE_WORD_ACCESS_TOKEN = 'S/13zub9e8igLgB3XYEsCCYjNhGBh+Px2uR9nwQ04tZfxRYvhEpmcg=='; // windows
// export const WAKE_WORD_ACCESS_TOKEN = 'EQrqvHg8Yy8PJbGg3p4K+rpgmyYQiwujuKbsPRaVcI+qCw2kLuGQJw=='; // mac
