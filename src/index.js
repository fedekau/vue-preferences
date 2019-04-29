export const DEFAULT_STORAGE_PREFIX = 'vp';

function buildKey(name, prefix = DEFAULT_STORAGE_PREFIX) {
  return `${prefix}:${name}`;
}

function normalizeMap(map) {
  return Array.isArray(map)
    ? map.map(name => ({ name, options: {} }))
    : Object.keys(map).map(name => ({ name, options: map[name] }));
}

function mergeOptionsFor(name, globalOptions, specificOptions) {
  let options = specificOptions;

  if (typeof globalOptions === 'object') {
    options = { ...globalOptions[name], ...specificOptions };
  }

  return options;
}

function getPreference(key, options) {
  const value = window.localStorage.getItem(key);

  if (value === null) {
    return options.defaultValue;
  }

  try {
    return JSON.parse(value);
  } catch (e) {
    return value === '' ? value : value || options.defaultValue;
  }
}

function setPreference(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));

  return value;
}

function getTrackingProperty(component, key) {
  return component['vp:tracked'][key];
}

function setTrackingProperty(component, key, value) {
  const trackingObject = component['vp:tracked'];

  component.$set(trackingObject, key, value);
}

export function preference(name, opts = {}) {
  const key = buildKey(name);

  return {
    get() {
      const component = this;
      const options = mergeOptionsFor(name, component.$preferences, opts);
      const initialValue = getPreference(key, options);
      const trackedValue = getTrackingProperty(component, key);

      return trackedValue || initialValue;
    },

    set(value) {
      const component = this;

      setTrackingProperty(component, key, value);

      return setPreference(key, value);
    },
  };
}

export function mapPreferences(preferences) {
  const res = {};

  normalizeMap(preferences).forEach(({ name, options }) => {
    res[name] = preference(name, options);
  });

  return res;
}

function install(Vue) {
  Vue.prototype.$preferences = {};

  Vue.mixin({
    data() {
      return {
        'vp:tracked': {},
      };
    },
  });
}

export default { install };
