/**
 * Tools
 */

function clone(source) {
  return JSON.parse(JSON.stringify(source));
}

function defaults(target, source) {
  return Object.keys(source).reduce(function (acc, key) {
    if (!target.hasOwnProperty(key)) {
      target[key] = source[key];
    } else if (typeof target[key] === 'object' && !Array.isArray(target[key])) {
      defaults(target[key], source[key]);
    }

    return target;
  }, target);
}

function forEach(arr, fn) {
  Array.prototype.slice.call(arr || []).forEach(fn);
}

function removeNode(node) {
  node.parentNode.removeChild(node);
}

function removeDocumentMeta() {
  forEach(document.querySelectorAll('head [data-rdm]'), removeNode);
}


module.exports = {
  clone              : clone,
  defaults           : defaults,
  forEach            : forEach,
  removeDocumentMeta : removeDocumentMeta
};
