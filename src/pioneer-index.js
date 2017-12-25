(function(window) {
    var pioneer = window.pioneer;
    var slice = Array.prototype.slice;
    window.PR = PR;

    // PR
    function PR(options) {
        this.$options = options || {};
        this.$data = options.data || {};
        this.$el = options.el || document.body;
        this.$methods = options.methods || {};
        observeFactory(this.$data);
        this.$compile = new Compile(this.$el, this);
    }

    // Observer
    function observeFactory(value) {
        if (!pioneer.isObject(value)) {
            return;
        }
        return new Observer(value);
    }
    function Observer(data) {
        this.data = data;
        this.walk(data);
    }
    Observer.prototype.walk = function(data) {
        var self = this;
        Object.keys(data).forEach(function(key) {
            self.convert(key, data[key]);
        });
    };
    Observer.prototype.convert = function(key, val) {
        this.defineReactive(this.data, key, val);
    };
    Observer.prototype.defineReactive = function(data, key, val) {
        var dep = new Dep();
        observeFactory(val);
        Object.defineProperty(data, key, {
            "enumerable": true,
            "configurable": false,
            "get": function() {
                if (Dep.target) {
                    dep.depend();
                }
                return val;
            },
            "set": function(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                observeFactory(newVal);
                dep.notify();
            }
        });
    };

    // Dep
    var uid = 0;
    function Dep() {
        this.id = uid++;
        this.subs = [];
    }
    Dep.target = null;
    Dep.prototype.addSub = function(sub) {
        this.subs.push(sub);
    };
    Dep.prototype.depend = function() {
        Dep.target.addDep(this);
    };
    Dep.prototype.notify = function() {
        this.subs.forEach(function(sub) {
            sub.update();
        });
    };

    // Compile
    // 指令处理集合
    var compileUtil = {
        "text": function(node, pr, exp) {
            this.bind(node, pr, exp, "text");
        },
        "model": function(node, pr, exp) {
            this.bind(node, pr, exp, "model");
            var self = this,
                val = this._getPRVal(pr, exp),
                cpLock = false,
                listener = function(e) {
                    var newValue = e.target.value;
                    if (val === newValue) {
                        return;
                    }
                    self._setPRVal(pr, exp, newValue);
                    val = newValue;
                };
            node.addEventListener("input", function(e) {
                !cpLock && listener(e);
            });
            node.addEventListener("compositionstart", function() {
                cpLock = true;
            });
            node.addEventListener("compositionend", function(e) {
                cpLock = false;
                listener(e);
            });
            node.addEventListener("keyup", function(e) {
                if (46 === e.keyCode || 8 === e.keyCode) {
                    listener(e);
                }
            });
        },
        "bind": function(node, pr, exp, dir) {
            var updaterFn = updater[dir + "Updater"];
            updaterFn && updaterFn(node, this._getPRVal(pr, exp));
            new Watcher(pr, exp, function(value, oldValue) {
                updaterFn && updaterFn(node, value, oldValue);
            });
        },
        "eventHandler": function(node, pr, exp, dir) {
            var args = [],
                fn = this._getPRMethod(pr, args, exp, this);
            if (dir && fn) {
                node.addEventListener(dir, function() {
                    fn.apply(pr, args);
                });
            }
        },
        "_getPRVal": function(pr, exp) {
            var val = pr.$data;
            exp = exp.split(".");
            exp.forEach(function(k) {
                val = val[k];
            });
            return val;
        },
        "_setPRVal": function(pr, exp, value) {
            var val = pr.$data;
            exp = exp.split(".");
            exp.forEach(function(k, i) {
                if (i < exp.length - 1) {
                    val = val[k];
                } else {
                    val[k] = value;
                }
            });
        },
        "_getPRMethod": function(pr, args, exp, self) {
            var methods = pr.$methods || {},
                index = exp.indexOf("("),
                length = exp.length;
            if (length - 1 !== exp.indexOf(")") || -1 === index) {
                return methods[exp];
            }
            var key = exp.slice(0, index),
                values = exp.slice(index + 1, length - 1).split(",");
            values.forEach(function(v) {
                if (v[0] === "'") {
                    args.push(v.slice(1, v.length - 1));
                } else {
                    args.push(self._getPRVal(pr, pioneer.trim(v)));
                }
            });
            return methods[key];
        }
    };
    var updater = {
        "textUpdater": function(node, value) {
            node.textContent = pioneer.isUndefined(value) ? "" : value;
        },
        "modelUpdater": function(node, value) {
            node.value = pioneer.isUndefined(value) ? "" : value;
        }
    };
    function Compile(el, pr) {
        this.$pr = pr;
        this.$el = pioneer.isElementNode(el) ? el : document.querySelector(el);
        if (this.$el) {
            this.$fragment = this.node2Fragment(this.$el);
            this._init();
            this.$el.appendChild(this.$fragment);
        }
    }
    Compile.prototype.node2Fragment = function(el) {
        var fragment = document.createDocumentFragment(),
            child;
        while ((child = el.firstChild)) {
            fragment.appendChild(child);
        }
        return fragment;
    };
    Compile.prototype._init = function() {
        this.compileElement(this.$fragment);
    };
    Compile.prototype.compileElement = function(el) {
        var childNodes = el.childNodes,
            self = this;
        slice.call(childNodes).forEach(function(node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/;
            if (pioneer.isElementNode(node)) {
                self.compile(node);
            } else if (pioneer.isTextNode(node) && reg.test(text)) {
                self.compileText(node, RegExp.$1);
            }
            if (node.childNodes && node.childNodes.length) {
                self.compileElement(node);
            }
        });
    };
    Compile.prototype.compile = function(node) {
        var nodeAttrs = node.attributes,
            self = this;
        slice.call(nodeAttrs).forEach(function(attr) {
            var attrName = attr.name;
            if (pioneer.isDirective(attrName)) {
                var exp = attr.value;
                var dir = "";
                if (pioneer.isEventDirective(attrName)) {
                    // (click)="click()"
                    dir = attrName.slice(1, attrName.length - 1);
                    compileUtil.eventHandler(node, self.$pr, exp, dir);
                } else if (pioneer.isAttrDirective(attrName)) {
                    // [value]="value"
                    dir = attrName.slice(1, attrName.length - 1);
                    compileUtil[dir] && compileUtil[dir](node, self.$pr, exp);
                } else if (pioneer.isModelDirective(attrName)) {
                    // [(value)]="value"
                    compileUtil.model(node, self.$pr, exp);
                } else {
                    dir = attrName.slice(2);
                    compileUtil[dir] && compileUtil[dir](node, self.$pr, exp);
                }
                node.removeAttribute(attrName);
            }
        });
    };
    Compile.prototype.compileText = function(node, exp) {
        compileUtil.text(node, this.$pr, exp);
    };

    // Watcher
    function Watcher(pr, expOrFn, cb) {
        this.cb = cb;
        this.pr = pr;
        this.expOrFn = expOrFn;
        this.depIds = {};
        if (pioneer.isFunction(expOrFn)) {
            this.getter = expOrFn;
        } else {
            this.getter = this.parseGetter(expOrFn);
        }
        this.value = this.get();
    }
    Watcher.prototype.update = function() {
        this.run();
    };
    Watcher.prototype.run = function() {
        var value = this.get();
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.cb.call(this.pr, value, oldVal);
        }
    };
    Watcher.prototype.addDep = function(dep) {
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    };
    Watcher.prototype.get = function() {
        Dep.target = this;
        var value = this.getter.call(this.pr, this.pr);
        Dep.target = null;
        return value;
    };
    Watcher.prototype.parseGetter = function(exp) {
        if (/[^\w.$]/.test(exp)) return;
        var expAry = exp.split(".");
        return function(obj) {
            obj = obj.$data;
            for (var i = 0, len = expAry.length; i < len; i++) {
                if (!obj) return;
                obj = obj[expAry[i]];
            }
            return obj;
        };
    };
})(window);
