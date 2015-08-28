var React = require('react');
var createSideEffect = require('react-side-effect');
var Children = React.Children;
var PropTypes = React.PropTypes;

var utils = require('./utils');
var clone = utils.clone;
var defaults = utils.defaults;
var forEach = utils.forEach;

function getProps(propsList) {

  var props = {};

  var extend = true;

  for (var i = propsList.length - 1; extend && i >= 0; i--) {

    var _props = clone(propsList[i]);

    if (_props.description) {
      defaults(_props, {meta : {name : {description : _props.description}}});
    }
    if (_props.canonical) {
      defaults(_props, {link : {rel : {canonical : _props.canonical}}});
    }


    defaults(props, _props);
    extend = _props.hasOwnProperty('extend');

  }

  if (props.auto) {
    autoProps(props);
  }

  return props;

}

function autoProps(props) {
  if (props.auto.ograph === true) {
    ograph(props);
  }

  return props;
}

function ograph(p) {

  if (!p.meta) {
    p.meta = {};
  }
  if (!p.meta.property) {
    p.meta.property = {};
  }

  var group = p.meta.property;
  if (group) {

    if (p.title && !group['og:title']) {
      group['og:title'] = p.title;
    }
    if (p.description && !group['og:description']) {
      group['og:description'] = p.description;
    }
    if (p.canonical && !group['og:url']) {
      group['og:url'] = p.canonical;
    }

  }
  return p;

}

function parseTags(tagName, props) {

  props = props || {};
  var tags = [];
  var contentKey = tagName === 'link' ? 'href' : 'content';
  Object.keys(props).forEach(function (groupKey) {

    var group = props[groupKey];
    if (typeof group === 'string') {
      var tag = {
        tagName : tagName
      };
      tag[groupKey] = group;

      tags.push(tag);

      return;
    }
    Object.keys(group).forEach(function (key) {
      var values = Array.isArray(group[key]) ? group[key] : [group[key]];
      values.forEach(function (value) {

        var tag = {
          tagName : tagName
        };
        tag[groupKey] = key;
        tag[contentKey] = value;

        tags.push(tag);
      });
    });

  });
  return tags;

}

function getTags(_props) {
  return [].concat(parseTags('meta', _props.meta), parseTags('link', _props.link));
}


function removeNode(node) {
  node.parentNode.removeChild(node);
}

function removeDocumentMeta() {
  forEach(document.querySelectorAll('head [data-rdm]'), removeNode);
}

function insertDocumentMetaNode(entry) {

  var tagName = entry.tagName;

  var attr = Object.assign({}, entry);
  delete attr.tagName;

  var newNode = document.createElement(tagName);
  for (var prop in attr) {
    if (entry.hasOwnProperty(prop)) {
      newNode.setAttribute(prop, entry[prop]);
    }
  }
  newNode.setAttribute('data-rdm', '');
  document.getElementsByTagName('head')[0].appendChild(newNode);

}

function insertDocumentMeta(props) {
  removeDocumentMeta();

  forEach(getTags(props), insertDocumentMetaNode);
}

function mapStateOnServer(meta) {

  var i = 0;
  var tags = [];

  function renderTag(entry) {

    var tagName = entry.tagName;

    var attr = Object.assign({}, entry);
    delete attr.tagName;

    if (tagName === 'meta') {
      return (React.DOM.meta(Object.assign({}, attr, {key : i++, dataRdm : true})));
    } else if (tagName === 'link') {
      return (React.DOM.link(Object.assign({}, attr, {key : i++, dataRdm : true})));
    }

    return null;

  }

  if (meta.title) {
    tags.push(React.DOM.title({key : i++}, meta.title));
  }

  getTags(meta).reduce(function (acc, entry) {
    tags.push(renderTag(entry));
    return tags;
  }, tags);


  return React.renderToStaticMarkup(React.DOM.div(null, tags)).replace(/(^<div>|<\/div>$)/g, '');

}


function handleStateChangeOnClient(meta) {

  if (meta.title) {
    document.title = meta.title || '';
  }
  insertDocumentMeta(meta);

}


var DocumentMeta = React.createClass({
  displayName : 'DocumentMeta',
  propTypes   : {
    children    : PropTypes.node,
    title       : PropTypes.string,
    description : PropTypes.string,
    canonical   : PropTypes.string,
    meta        : PropTypes.objectOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.objectOf(PropTypes.string)
      ])
    ),
    link        : PropTypes.objectOf(
      PropTypes.objectOf(
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.arrayOf(PropTypes.string)
        ])
      )
    ),
    auto        : PropTypes.objectOf(PropTypes.bool)
  },
  render      : function render() {
    return null;
  }
});

module.exports = createSideEffect(getProps, handleStateChangeOnClient, mapStateOnServer)(DocumentMeta);

