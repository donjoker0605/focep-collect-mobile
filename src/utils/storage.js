// src/utils/storage.js
import { Platform } from 'react-native';

// Fonction pour vérifier si nous sommes dans un environnement SSR
const isSSR = () => typeof window === 'undefined';

// Stockage local pour le web en mode SSR
const memoryStorage = {
  _data: {},
  getItem: (key) => {
    return Promise.resolve(memoryStorage._data[key] || null);
  },
  setItem: (key, value) => {
    memoryStorage._data[key] = value;
    return Promise.resolve();
  },
  removeItem: (key) => {
    delete memoryStorage._data[key];
    return Promise.resolve();
  },
  clear: () => {
    memoryStorage._data = {};
    return Promise.resolve();
  },
  getAllKeys: () => {
    return Promise.resolve(Object.keys(memoryStorage._data));
  },
  multiGet: (keys) => {
    const values = keys.map(key => [key, memoryStorage._data[key] || null]);
    return Promise.resolve(values);
  },
  multiSet: (keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => {
      memoryStorage._data[key] = value;
    });
    return Promise.resolve();
  },
  multiRemove: (keys) => {
    keys.forEach(key => delete memoryStorage._data[key]);
    return Promise.resolve();
  }
};

// Utiliser AsyncStorage réel uniquement en environnement non-SSR
const AsyncStorage = !isSSR()
  ? require('@react-native-async-storage/async-storage').default
  : memoryStorage;

export default AsyncStorage;