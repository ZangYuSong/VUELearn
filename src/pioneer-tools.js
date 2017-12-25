(function(window) {
    var pioneer = window.pioneer || (window.pioneer = {});
    var toString = Object.prototype.toString;
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

    function each(obj, fn, context) {
        var i = 0,
            length,
            value;
        if (isArray(obj)) {
            for (length = obj.length; i < length; i++) {
                value = fn.call(context, obj[i], i, obj);
                if (value === false) {
                    break;
                }
            }
        } else {
            var keys = Object.keys(obj);
            for (length = keys.length; i < length; i++) {
                value = fn.call(context, obj[keys[i]], keys[i], obj);
                if (value === false) {
                    break;
                }
            }
        }
    }

    function baseExtend(args, deep) {
        var length = args.length;
        if (0 === length) return null;
        if (1 === length) return args[0];
        var target = args[0],
            i,
            source,
            keys,
            key,
            j,
            jj;
        for (i = 1; i < length; i += 1) {
            source = args[i];
            keys = Object.keys(source);
            jj = keys.length;
            for (j = 0; j < jj; j += 1) {
                key = keys[j];
                if (deep) {
                    if (isObject(source[key])) {
                        !isObject(target[key]) && (target[key] = {});
                        baseExtend([target[key], source[key]], true);
                    } else if (isArray(source[key])) {
                        !isArray(target[key]) && (target[key] = []);
                        baseExtend([target[key], source[key]], true);
                    } else {
                        target[key] = source[key];
                    }
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    function extend() {
        return baseExtend(arguments, false);
    }

    function merge() {
        return baseExtend(arguments, true);
    }

    function clone(obj) {
        if (isObject(obj)) {
            return merge({}, obj);
        }
        if (isArray(obj)) {
            return obj.slice();
        }
        return obj;
    }

    function isObject(obj) {
        return "[object Object]" === toString.call(obj);
    }

    function isFunction(obj) {
        return "[object Function]" === toString.call(obj);
    }

    function isDate(obj) {
        return "[object Date]" === toString.call(obj);
    }

    function isRegExp(obj) {
        return "[object RegExp]" === toString.call(obj);
    }

    function isElementNode(node) {
        return !!(node && 1 === node.nodeType);
    }

    function isTextNode(node) {
        return !!(node && 3 === node.nodeType);
    }

    function isArray(obj) {
        return "[object Array]" === toString.call(obj);
    }

    function isArrayLike(collection) {
        var length = null !== collection && collection.length;
        return isNumber(length) && length >= 0 && length <= MAX_ARRAY_INDEX;
    }

    function isArguments(obj) {
        return "[object Arguments]" === toString.call(obj);
    }

    function isString(obj) {
        return "[object String]" === toString.call(obj);
    }

    function isNumber(obj) {
        return "[object Number]" === toString.call(obj);
    }

    function isError(obj) {
        return "[object Error]" === toString.call(obj);
    }

    function isFile(obj) {
        return "[object File]" === toString.call(obj);
    }

    function isFormData(obj) {
        return "[object FormData]" === toString.call(obj);
    }

    function isBlob(obj) {
        return "[object Blob]" === toString.call(obj);
    }

    function isBoolean(obj) {
        return "[object Boolean]" === toString.call(obj);
    }

    function isWindow(obj) {
        return "[object Window]" === toString.call(obj);
    }

    function isUndefined(obj) {
        return "[object Undefined]" === toString.call(obj);
    }

    function isEmpty(obj) {
        if (null === obj) {
            return true;
        }
        if (
            isArrayLike(obj) &&
            (isArray(obj) || isString(obj) || isArguments(obj))
        ) {
            return 0 === obj.length;
        }
        return 0 === Object.keys(obj).length;
    }

    function isDirective(attr) {
        return (
            0 === attr.indexOf("[") ||
            0 === attr.indexOf("[(") ||
            0 === attr.indexOf("(") ||
            0 === attr.indexOf("p-")
        );
    }

    function isAttrDirective(attr) {
        return 0 === attr.indexOf("[") && -1 === attr.indexOf("[(");
    }

    function isEventDirective(attr) {
        return 0 === attr.indexOf("(");
    }

    function isModelDirective(attr) {
        return 0 === attr.indexOf("[(");
    }

    function trim(text, exp) {
        exp = exp || "\\s";
        return null === text ?
            "" :
            (text + "").replace(
                new RegExp(
                    "^" + exp + "+|((?:^|[^\\\\])(?:\\\\.)*)" + exp + "+$",
                    "g"
                ),
                ""
            );
    }

    extend(pioneer, {
        "each": each,
        "extend": extend,
        "merge": merge,
        "clone": clone,
        "isObject": isObject,
        "isFunction": isFunction,
        "isDate": isDate,
        "isRegExp": isRegExp,
        "isElementNode": isElementNode,
        "isTextNode": isTextNode,
        "isArray": isArray,
        "isArrayLike": isArrayLike,
        "isArguments": isArguments,
        "isString": isString,
        "isNumber": isNumber,
        "isError": isError,
        "isFile": isFile,
        "isFormData": isFormData,
        "isBlob": isBlob,
        "isBoolean": isBoolean,
        "isWindow": isWindow,
        "isUndefined": isUndefined,
        "isEmpty": isEmpty,
        "isAttrDirective": isAttrDirective,
        "isEventDirective": isEventDirective,
        "isModelDirective": isModelDirective,
        "isDirective": isDirective,
        "trim": trim
    });
})(window);
