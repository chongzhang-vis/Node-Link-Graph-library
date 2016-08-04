/**
 * Change context
 *
 * @param obj
 * @param fn
 *
 * @returns {Function}
 *
 * @private
 */
function bind(obj, fn){
  var slice = [].slice;

  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = [].slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
}

/**
 * Check if two objects are deeply equal
 *
 * @param obj1
 * @param obj2
 * @returns {boolean}
 */
function objectEquals(obj1, obj2) {
    for (var i in obj1) {
        if (obj1.hasOwnProperty(i)) {
            if (!obj2.hasOwnProperty(i)) return false;
            if (obj1[i] != obj2[i]) return false;
        }
    }
    for (var i in obj2) {
        if (obj2.hasOwnProperty(i)) {
            if (!obj1.hasOwnProperty(i)) return false;
            if (obj1[i] != obj2[i]) return false;
        }
    }
    return true;
}





/**
 * Deep copy object
 *
 * @param obj, could be an array or object
 * @returns {*}
 *
 * could do better
 * Only effective in the below structure
 * [obj1, obj2, ...], where obji could be like:
 * {a1: a1val, a2: [{}, {}, ...], a3: {a3key1: a3key1val, a3key2: a3key2val, ...}...}
 *
 * Note: Date type is not supported
 */
function deepCopyArrayBoundData(obj){
    var copy;

    if(obj == null || typeof obj != "object") return obj;

    if (obj instanceof Array) {

        copy = [];

        for (var i = 0, len = obj.length; i < len; ++i) {
            copy[i] = deepCopyArrayBoundData(obj[i]);
        }

        return copy;
    }

    if(obj instanceof Object){
        copy = {};
        for (var attr in obj){
            if(obj.hasOwnProperty(attr)) copy[attr] = deepCopyArrayBoundData(obj[attr]);
        }

        return copy;
    }
}

/**
 * Set the Transformation Matrix of an SVG element
 *
 * @param el
 * @param m
 *
 * @private
 */
var setTransMatirx = function (el, m) {
  return element.transform.baseVal.initialize(element.ownerSVGElement.createSVGTransformFromMatrix(m));

};

/**
 * Find the point P that divides a line from src to tgt into a particular ratio
 * @param src
 * @param tgt
 * @param ratio
 * @returns {*[]}
 */
var getCoordFromLineWithRatio = function (src, tgt, ratio){
  if (ratio < 0 || ratio > 1) return [];
  return [src[0] + ratio * (tgt[0] - src[0]), src[1] + ratio * (tgt[1] - src[1])];

};
