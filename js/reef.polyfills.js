/*!
 * reef v0.2.2: A lightweight helper function for creating reactive, state-based components and UI
 * (c) 2018 Chris Ferdinandi
 * MIT License
 * http://github.com/cferdinandi/reef
 */

/**
 * Array.prototype.find() polyfill
 * Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
 * @author Chris Ferdinandi
 * @license MIT
 */
if (!Array.prototype.find) {
	Array.prototype.find = function (callback) {
		// 1. Let O be ? ToObject(this value).
		if (this === null) {
			throw new TypeError('"this" is null or not defined');
		}

		var o = Object(this);

		// 2. Let len be ? ToLength(? Get(O, "length")).
		var len = o.length >>> 0;

		// 3. If IsCallable(callback) is false, throw a TypeError exception.
		if (typeof callback !== 'function') {
			throw new TypeError('callback must be a function');
		}

		// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
		var thisArg = arguments[1];

		// 5. Let k be 0.
		var k = 0;

		// 6. Repeat, while k < len
		while (k < len) {
			// a. Let Pk be ! ToString(k).
			// b. Let kValue be ? Get(O, Pk).
			// c. Let testResult be ToBoolean(? Call(callback, T, « kValue, k, O »)).
			// d. If testResult is true, return kValue.
			var kValue = o[k];
			if (callback.call(thisArg, kValue, k, o)) {
				return kValue;
			}
			// e. Increase k by 1.
			k++;
		}

		// 7. Return undefined.
		return undefined;
	};
}
/**
 * Array.from() polyfill
 */
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from) {
	Array.from = (function () {
		var toStr = Object.prototype.toString;
		var isCallable = function (fn) {
			return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
		};
		var toInteger = function (value) {
			var number = Number(value);
			if (isNaN(number)) { return 0; }
			if (number === 0 || !isFinite(number)) { return number; }
			return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
		};
		var maxSafeInteger = Math.pow(2, 53) - 1;
		var toLength = function (value) {
			var len = toInteger(value);
			return Math.min(Math.max(len, 0), maxSafeInteger);
		};

		// The length property of the from method is 1.
		return function from(arrayLike/*, mapFn, thisArg */) {
			// 1. Let C be the this value.
			var C = this;

			// 2. Let items be ToObject(arrayLike).
			var items = Object(arrayLike);

			// 3. ReturnIfAbrupt(items).
			if (arrayLike === null) {
				throw new TypeError('Array.from requires an array-like object - not null or undefined');
			}

			// 4. If mapfn is undefined, then let mapping be false.
			var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
			var T;
			if (typeof mapFn !== 'undefined') {
				// 5. else
				// 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
				if (!isCallable(mapFn)) {
					throw new TypeError('Array.from: when provided, the second argument must be a function');
				}

				// 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
				if (arguments.length > 2) {
					T = arguments[2];
				}
			}

			// 10. Let lenValue be Get(items, "length").
			// 11. Let len be ToLength(lenValue).
			var len = toLength(items.length);

			// 13. If IsConstructor(C) is true, then
			// 13. a. Let A be the result of calling the [[Construct]] internal method
			// of C with an argument list containing the single item len.
			// 14. a. Else, Let A be ArrayCreate(len).
			var A = isCallable(C) ? Object(new C(len)) : new Array(len);

			// 16. Let k be 0.
			var k = 0;
			// 17. Repeat, while k < len… (also steps a - h)
			var kValue;
			while (k < len) {
				kValue = items[k];
				if (mapFn) {
					A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
				} else {
					A[k] = kValue;
				}
				k += 1;
			}
			// 18. Let putStatus be Put(A, "length", len, true).
			A.length = len;
			// 20. Return A.
			return A;
		};
	}());
}
/**
 * ChildNode.remove() polyfill
 * https://gomakethings.com/removing-an-element-from-the-dom-the-es6-way/
 * @author Chris Ferdinandi
 * @license MIT
 */
(function (elem) {
	for (var i = 0; i < elem.length; i++) {
		if (!window[elem[i]] || 'remove' in window[elem[i]].prototype) continue;
		window[elem[i]].prototype.remove = function () {
			this.parentNode.removeChild(this);
		};
	}
})(['Element', 'CharacterData', 'DocumentType']);
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], (function () {
			return factory(root);
		}));
	} else if (typeof exports === 'object') {
		module.exports = factory(root);
	} else {
		root.Reef = factory(root);
	}
})(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this, (function (window) {

	'use strict';

	//
	// Variables
	//

	// Attribute exceptions for use with setAttribute()
	var attributeExceptions = ['for'];

	// Setup parser variable
	var parser;


	//
	// Methods
	//

	/**
	 * Check feature support
	 */
	var supports = function () {
		if (!Array.from || !window.DOMParser) return false;
		parser = parser || new DOMParser();
		try {
			parser.parseFromString('x', 'text/html');
		} catch(err) {
			return false;
		}
		return true;
	};

	/**
	 * More accurately check the type of a JavaScript object
	 * @param  {Object} obj The object
	 * @return {String}     The object type
	 */
	var trueTypeOf = function (obj) {
		return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
	};

	/**
	 * Return a clone of an object or array
	 * @param  {Object|Array} obj The object or array to clone
	 * @return {Object|Array}     An exact copy of the object or array
	 */
	var clone = function (obj) {
		if (!obj) return;
		return JSON.parse(JSON.stringify(obj));
	};

	/**
	 * Create the Component object
	 * @param {String|Node} elem    The element to make into a component
	 * @param {Object}      options The component options
	 */
	var Component = function (elem, options) {

		// Check browser support
		if (!supports()) throw new Error('Reef.js is not supported by this browser.');

		// Make sure an element is provided
		if (!elem && (!options || !options.lagoon)) throw new Error('Reef.js: You did not provide an element to make into a component.');

		// Make sure a template is provided
		if (!options || !options.template && (!options || !options.lagoon)) throw new Error('Reef.js: You did not provide a template for this component.');

		// Set the component properties
		this.elem = elem;
		this.data = options.data;
		this.template = options.template;
		this.attached = [];
		this.lagoon = options.lagoon;

		// Attach linked components
		if (options.attachTo) {
			var _this = this;
			options.attachTo.forEach((function (coral) {
				if ('attach' in coral) {
					coral.attach(_this);
				}
			}));
		}

	};

	/**
	 * Check if setAttribute() should be used for this attribute
	 * @param  {String} att The attribute type
	 * @return {Boolean}    Returns true if setAttribute() should be used
	 */
	var useSetAttribute = function (att) {
		return att.slice(0, 5) === 'data-' || attributeExceptions.indexOf(att) > -1;
	};

	/**
	 * Add attributes to an element
	 * @param {Node}  elem The element
	 * @param {Array} atts The attributes to add
	 */
	var addAttributes = function (elem, atts) {
		atts.forEach((function (attribute) {
			// If the attribute is a class, use className
			// Else if it starts with `data-`, use setAttribute()
			// Otherwise, set is as a property of the element
			if (attribute.att === 'class') {
				elem.className = attribute.value;
			} else if (useSetAttribute(attribute.att)) {
				elem.setAttribute(attribute.att, attribute.value);
			} else {
				elem[attribute.att] = attribute.value;
			}
		}));
	};

	/**
	 * Remove attributes from an element
	 * @param {Node}  elem The element
	 * @param {Array} atts The attributes to remove
	 */
	var removeAttributes = function (elem, atts) {
		atts.forEach((function (attribute) {
			// If the attribute is a class, use className
			// Otherwise, use removeAttribute()
			if (attribute.att === 'class') {
				elem.className = '';
			} else {
				elem.removeAttribute(attribute.att);
			}
		}));
	};

	/**
	 * Create an array of the attributes on an element
	 * @param  {NamedNodeMap} attributes The attributes on an element
	 * @return {Array}                   The attributes on an element as an array of key/value pairs
	 */
	var getAttributes = function (attributes) {
		return Array.from(attributes).map((function (attribute) {
			return {
				att: attribute.name,
				value: attribute.value
			};
		}));
	};

	/**
	 * Make an HTML element
	 * @param  {Object} elem The element details
	 * @return {Node}        The HTML element
	 */
	var makeElem = function (elem) {

		// Create the element
		var node = elem.type === 'text' ? document.createTextNode(elem.content) : document.createElement(elem.type);

		// Add attributes
		addAttributes(node, elem.atts);

		// If the element has child nodes, create them
		// Otherwise, add textContent
		if (elem.children.length > 0) {
			elem.children.forEach((function (childElem) {
				node.appendChild(makeElem(childElem));
			}));
		} else if (elem.type !== 'text') {
			node.textContent = elem.content;
		}

		return node;

	};

	/**
	 * Diff the attributes on an existing element versus the template
	 * @param  {Object} template The new template
	 * @param  {Object} existing The existing DOM node
	 */
	var diffAtts = function (template, existing) {

		// Get attributes to remove
		var remove = existing.atts.filter((function (att) {
			var getAtt = template.atts.find((function (newAtt) {
				return att.att === newAtt.att;
			}));
			return getAtt === undefined;
		}));

		// Get attributes to change
		var change = template.atts.filter((function (att) {
			var getAtt = existing.atts.find((function (existingAtt) {
				return att.att === existingAtt.att;
			}));
			return getAtt === undefined || getAtt.value !== att.value;
		}));

		// Add/remove any required attributes
		addAttributes(existing.node, change);
		removeAttributes(existing.node, remove);

	};

	/**
	 * Diff the existing DOM node versus the template
	 * @param  {Array} templateMap A DOM tree map of the template content
	 * @param  {Array} domMap      A DOM tree map of the existing DOM node
	 * @param  {Node}  elem        The element to render content into
	 * @param  {Array} polyps      Attached components for this element
	 */
	var diff = function (templateMap, domMap, elem, polyps) {

		// If extra elements in domMap, remove them
		var count = domMap.length - templateMap.length;
		if (count > 0) {
			for (; count > 0; count--) {
				domMap[domMap.length - count].node.remove();
			}
		}

		// Diff each item in the templateMap
		templateMap.forEach((function (node, index) {

			// If element doesn't exist, create it
			if (!domMap[index]) {
				elem.appendChild(makeElem(templateMap[index]));
				return;
			}

			// If element is not the same type, replace it with new element
			if (templateMap[index].type !== domMap[index].type) {
				domMap[index].node.parentNode.replaceChild(makeElem(templateMap[index]), domMap[index].node);
				return;
			}

			// If attributes are different, update them
			diffAtts(templateMap[index], domMap[index], domMap[index].node);

			// If element is an attached component, skip it
			var isPolyp = polyps.filter((function (polyp) {
				return node.node.nodeType !== 3 && node.node.matches(polyp);
			}));
			if (isPolyp.length > 0) return;

			// If content is different, update it
			if (templateMap[index].content !== domMap[index].content) {
				domMap[index].node.textContent = templateMap[index].content;
			}

			// Repeat for child elements
			if (node.children.length > 0) {
				diff(node.children, domMap[index].children || [], domMap[index].node, polyps);
			}

		}));

	};

	/**
	 * Create a DOM Tree Map for an element
	 * @param  {Node}   element The element to map
	 * @return {Array}          A DOM tree map
	 */
	var createDOMMap = function (element) {
		var map = [];
		Array.from(element.childNodes).forEach((function (node) {
			map.push({
				content: node.childNodes && node.childNodes.length > 0 ? null : node.textContent,
				atts: node.nodeType === 3 ? [] : getAttributes(node.attributes),
				type: node.nodeType === 3 ? 'text' : node.tagName.toLowerCase(),
				children: createDOMMap(node),
				node: node
			});

		}));
		return map;
	};

	/**
	 * Convert a template string into HTML DOM nodes
	 * @param  {String} str The template string
	 * @return {Node}       The template HTML
	 */
	var stringToHTML = function (str) {
		parser = parser || new DOMParser();
		var doc = parser.parseFromString(str, 'text/html');
		return doc.body;
	};

	/**
	 * If there are linked Reefs, render them, too
	 * @param  {Array} polyps Attached Reef components
	 */
	var renderPolyps = function (polyps, reef) {
		if (!polyps) return;
		polyps.forEach((function (coral) {
			if (coral.attached.indexOf(reef) > -1) throw new Error('ReefJS: ' + reef.elem + ' has attached nodes that it is also attached to, creating an infinite loop.');
			if ('render' in coral) coral.render();
		}));
	};

	/**
	 * Render a template into the DOM
	 * @return {Node}  The element
	 */
	Component.prototype.render = function () {

		// If this is used only for data, render attached and bail
		if (this.lagoon) {
			renderPolyps(this.attached, this);
			return;
		}

		// Make sure there's a template
		if (!this.template) throw new Error('Reef.js: No template was provided.');

		// If elem is an element, use it.
		// If it's a selector, get it.
		var elem = typeof this.elem === 'string' ? document.querySelector(this.elem) : this.elem;

		if (!elem) throw new Error('Reef.js: The DOM element to render your template into was not found.');

		// Get the template
		var template = (typeof this.template === 'function' ? this.template(clone(this.data)) : this.template);
		if (['string', 'number'].indexOf(typeof template) === -1) return;

		// Create DOM maps of the template and target element
		var templateMap = createDOMMap(stringToHTML(template), polyps);
		var domMap = createDOMMap(elem, polyps);

		// Diff and update the DOM
		var polyps = this.attached.map((function (polyp) { return polyp.elem; }));
		diff(templateMap, domMap, elem, polyps);

		// Dispatch a render event
		if (typeof window.CustomEvent === 'function') {
			var event = new CustomEvent('render', {
				bubbles: true
			});
			elem.dispatchEvent(event);
		}

		// If there are linked Reefs, render them, too
		renderPolyps(this.attached, this);

		// Return the elem for use elsewhere
		return elem;

	};

	/**
	 * Get a clone of the Component.data property
	 * @return {Object} A clone of the Component.data property
	 */
	Component.prototype.getData = function () {
		return clone(this.data);
	};

	/**
	 * Update the data property and re-render
	 * @param {Object} obj The data to merge into the existing state
	 */
	Component.prototype.setData = function (obj) {
		if (trueTypeOf(obj) !== 'object') throw new Error('ReefJS: The provided data is not an object.');
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				this.data[key] = obj[key];
			}
		}
		this.render();
	};

	/**
	 * Add attribute exceptions
	 * @param {String|Array} att The attribute(s) to add
	 */
	Component.addAttributes = function (atts) {
		if (trueTypeOf(atts) === 'array') {
			Array.prototype.push.apply(attributeExceptions, atts);
		} else {
			attributeExceptions.push(atts);
		}
	};

	/**
	 * Remove attribute exceptions
	 * @param {String|Array} att The attribute(s) to remove
	 */
	Component.removeAttributes = function (atts) {
		var isArray = trueTypeOf(atts) === 'array';
		attributeExceptions = attributeExceptions.filter((function (att) {
			if (isArray) {
				return atts.indexOf(att) === -1;
			} else {
				return att !== atts;
			}
		}));
	};

	/**
	 * Attach a component to this one
	 * @param  {Function|Array} coral The component(s) to attach
	 */
	Component.prototype.attach = function (coral) {
		if (trueTypeOf(coral) === 'array') {
			Array.prototype.push.apply(this.attached, coral);
		} else {
			this.attached.push(coral);
		}
	};

	/**
	 * Detach a linked component to this one
	 * @param  {Function|Array} coral The linked component(s) to detach
	 */
	Component.prototype.detach = function (coral) {
		var isArray = trueTypeOf(coral) === 'array';
		this.attached = this.attached.filter((function (polyp) {
			if (isArray) {
				return coral.indexOf(polyp) === -1;
			} else {
				return polyp !== coral;
			}
		}));
	};


	//
	// Export public methods
	//

	return Component;

}));