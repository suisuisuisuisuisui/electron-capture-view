const cache = new WeakMap();

exports.set = function(window, path) {
    cache.set(window, path);
};

exports.get = function(window) {
    return cache.get(window);
};
