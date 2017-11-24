"use strict"
var ZCanvas = function (canvas) {
    this._init(canvas);
    this._classInit();
}

ZCanvas.prototype = {
    _init: function (canvas) {
        this._canvas = canvas;
        this._canvasWidth = canvas.width;
        this._canvasHeight = canvas.height;
        this._context = canvas.getContext('2d');
        this._cacheCanvas = document.createElement('canvas');
        this._cacheContext = this._cacheCanvas.getContext('2d');
        // this._canvas.style.background = "#def";
        this._cacheCanvas.width = this._canvasWidth;
        this._cacheCanvas.height = this._canvasHeight;
        this._framing = false;
    },
    _classInit: function () {
        this._classObj = {};
        this._idObj = {};
        this._nodeTypeObj = {};
        this._nodeArray = [];
        this._canvasNodeArray = [];
    },
    _addClass: function (node) {
        if (!this._classObj[node.class]) {
            this._classObj[node.class] = [];
        }
        this._classObj[node.class].push(node);
        node._classIndex = this._classObj[node.class].length - 1;
    },
    _addId: function (node) {
        if (this._idObj[node.id]) {
            console.warn('the id has already existed');
            return;
        }
        this._idObj[node.id] = node;
    },
    _addNodeType:function(node){
        if(!this._nodeTypeObj[node.nType]){
            this._nodeTypeObj[node.nType] = [];
        }
        this._nodeTypeObj[node.nType].push(node);
        node._nodeTypeIndex = this._nodeTypeObj[node.nType].length-1;
    },
    addNode: function (node) {
        if (!node._nodeType || node._nodeType !== 'node') {
            return;
        }
        this._nodeArray.push(node);
        node._nodeIndex = this._nodeArray.length - 1;
        node._inCanvas = true;
        this._addNodeType(node);
        if (node.class && node.class !== '') {
            this._addClass(node);
        }
        if (node.id && node.id !== '') {
            this._addId(node);
        }
    },
    addNodes: function (nodeArray) {
        for (var i = 0; i < nodeArray.length; i++) {
            var node = nodeArray[i];
            if (!node._nodeType || node._nodeType !== 'node') {
                return;
            }
            this.addNode(node);
        }
    },
    animate: function () {
        var hasAnimating = false;
        for (var i = 0; i < this._canvasNodeArray.length; i++) {
            var node = this._canvasNodeArray[i];
            if (node._animating) {
                hasAnimating = true;
                switch (node.nType) {
                    default:
                        node.__animateFrame(node);
                        break;
                }
            }
        }
        if (hasAnimating) {
            this._framing = true;
            this.refresh();
            requestAnimationFrame(this.animate.bind(this));
        } else {
            this._framing = false;
        }
    },
    clearCanvas: function () {
        this._context.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
        this._cacheContext.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
    },
    draw: function () {
        if (this._canvasNodeArray.length < 1) {
            return;
        }
        for (var i = 0; i < this._canvasNodeArray.length; i++) {
            var node = this._canvasNodeArray[i];
            if (node._rendered) {
                node.__draw();
            } else {
                continue;
            }
        }
        this._context.drawImage(this._cacheCanvas, 0, 0, this._canvasWidth, this._canvasHeight);
    },
    deRenderNode: function (node, config, options, callback) {
        var that = this;
        if (!node._inCanvas) {
            console.warn('You must add the node first');
            return;
        }
        if (!config || config.time === 0) {
            node.curAttr = node.attr;
            node._rendered = false;
            this._canvasNodeArray.splice(node._canvasIndex, 1);
            node._canvasIndex = -1;
            this.resetArray(this._canvasNodeArray, '_canvasIndex');
        } else {
            node.animate(config, options, function () {
                if (callback) {
                    node._rendered = false;
                    that._canvasNodeArray.splice(node._canvasIndex, 1);
                    node._canvasIndex = -1;
                    that.resetArray(that._canvasNodeArray, '_canvasIndex');
                    callback();
                }
            });
        }
        this.refresh();
    },
    deRenderNodes: function (nodeArray, config, options, callback) {
        for (var i = 0; i < nodeArray.length; i++) {
            var node = nodeArray[i];
            if (i < (nodeArray.length - 1)) {
                this.deRenderNode(node, config, options);
            } else {
                this.deRenderNode(node, config, options, callback);
            }
        }
    },
    findClass:function(className){
        return this._classObj[className];
    },
    findId:function(idName){
        return this._idObj[idName];
    },
    findNode:function(nodeType){
        return this._nodeTypeObj[nodeType];
    },
    getCanvas: function () {
        return this._cacheCanvas;
    },
    getContext: function () {
        return this._cacheContext;
    },
    getCanvasSize: function () {
        return {
            width: ZCanvas._canvasWidth,
            height: ZCanvas._canvasHeight
        }
    },
    refresh: function () {
        this.clearCanvas();
        this.draw();
    },
    removeNode: function (node) {
        if (node._rendered) {
            console.warn('You must derender the node first');
            return;
        };
        var nodeTypeObj = this._nodeTypeObj[node.nType];
        nodeTypeObj.splice(node._nodeTypeIndex,1);
        node._nodeTypeIndex = -1;
        if (nodeTypeObj.length < 1) {
            delete this._classObj[node._nodeTypeIndex];
        } else {
            this.resetArray(nodeTypeObj, '_nodeTypeIndex');
        }
        if (node.class && node.class !== '') {
            var classObj = this._classObj[node.class];
            classObj.splice(node._classIndex, 1);
            node._classIndex = -1;
            if (classObj.length < 1) {
                delete this._classObj[node.class];
            } else {
                this.resetArray(classObj, '_classIndex');
            }
        }
        if (node.id && node.id !== '') {
            delete this._idObj[node.id];
        }
        this._nodeArray.splice(node._nodeIndex, 1);
        node._nodeIndex = -1;

        this.resetArray(this._nodeArray, '_nodeIndex');
        node = null;
        this.refresh();

    },
    removeNodes: function (nodeArray) {
        for (var i = 0; i < nodeArray.length; i++) {
            var node = nodeArray[i];
            this.removeNode.call(this,node);
        }

    },
    resetArray: function (array, arrayindex) {
        for (var i = 0; i < array.length; i++) {
            var node = array[i];
            node[arrayindex] = i;
        }
    },
    renderNode: function (node, config, options, callback) {
        if (!node._inCanvas) {
            console.warn('You must add the node first');
            return;
        }
        node._rendered = true;
        this._canvasNodeArray.push(node);
        node._canvasIndex = this._canvasNodeArray.length - 1;
        if (!config || config.time === 0) {
            node.curAttr = node.attr;
            this.refresh();
        } else {
            node.animate(config, options, callback);
        }
    },
    renderNodes: function (nodeArray, config, options, callback) {
        for (var i = 0; i < nodeArray.length; i++) {
            var node = nodeArray[i];
            if (!node._inCanvas) {
                console.warn('You must add the node first');
                return;
            }
            node._rendered = true;
            this._canvasNodeArray.push(node);
            node._canvasIndex = this._canvasNodeArray.length - 1;
            if (!config || config.time === 0) {
                node.curAttr = node.attr;
                this.refresh();
            } else {
                if (i < nodeArray.length - 1) {
                    node.__animateInit(config, options);
                } else {
                    node.__animateInit(config, options, callback);
                }
            }
        }
        if (!this._framing) {
            this._framing = true;
            this.animate();
        }
    },
}
ZCanvas.prototype.Node = function (options) {
    var node = new ZCanvas.Node(options, this._cacheContext);
    return node;
}
ZCanvas.prototype.Rect = function (options) {
    var rect = new ZCanvas.Rect(options, this._cacheContext);
    var that = this;
    rect.animate = function (config, options, callback) {
        rect.__animateInit(config, options, callback);
        if (!that._framing) {
            that._framing = true;
            that.animate();
        }
    };
    return rect;
}
ZCanvas.prototype.Line = function (options) {
    var line = new ZCanvas.Line(options, this._cacheContext);
    var that = this;
    line.animate = function (config, options, callback) {
        line.__animateInit(config, options, callback);
        if (!that._framing) {
            that._framing = true;
            that.animate();
        }
    };
    return line;
}
ZCanvas.prototype.CurveLine = function (options) {
    var curveline = new ZCanvas.CurveLine(options, this._cacheContext);
    var that = this;
    curveline.animate = function (config, options, callback) {
        curveline.__animateInit(config, options, callback);
        if (!that._framing) {
            that._framing = true;
            that.animate();
        }
    };
    return curveline;
}
ZCanvas.prototype.Text = function (options) {
    var text = new ZCanvas.Text(options, this._cacheContext);
    var that = this;
    text.animate = function (config, options, callback) {
        text.__animateInit(config, options, callback);
        if (!that._framing) {
            that._framing = true;
            that.animate();
        }
    };
    return text;
}
ZCanvas.prototype.Circle = function (options) {
    var circle = new ZCanvas.Circle(options, this._cacheContext);
    var that = this;
    circle.animate = function (config, options, callback) {
        circle.__animateInit(config, options, callback);
        if (!that._framing) {
            that._framing = true;
            that.animate();
        }
    };
    return circle;
}
ZCanvas.prototype.Dot = function (options) {
    var dot = new ZCanvas.Dot(options, this._cacheContext);
    var that = this;
    dot.animate = function (config, options, callback) {
        dot.__animateInit(config, options, callback);
        if (!that._framing) {
            that._framing = true;
            that.animate();
        }
    };
    return dot;
}
ZCanvas.prototype.ArcShape = function (options) {
    var arcshape = new ZCanvas.ArcShape(options, this._cacheContext);
    var that = this;
    arcshape.animate = function (config, options, callback) {
        arcshape.__animateInit(config, options, callback);
        if (!that._framing) {
            that._framing = true;
            that.animate();
        }
    };
    return arcshape;
}

ZCanvas.prototype.Util = function () {
}
ZCanvas.prototype.Util.prototype = {

}

// ==================================================ZCanvas.prototype=====================================================





ZCanvas.Node = function (options, cacheCtx) {
    this._inCanvas = false;
    this._rendered = false;
    this._nodeType = "node";
    this._cacheCtx = cacheCtx;
    this._animating = false;
    this.attr = {};
    this.animAttr = {};
    this.curAttr = {};
    this.class = options.class || '';
    this.id = options.id || '';
}
ZCanvas.Node.prototype = {
    getNodeAttr: function (attr) {
        if (!this.curAttr[attr]) {
            console.warn('node' + this._nodeIndex + ' has no attr called ' + attr);
            return;
        }
        return this.curAttr[attr];
    },
    setNodeAttr: function (attr, value) {
        if (!this.curAttr[attr]) {
            console.warn('node' + this._nodeIndex + ' has no attr called ' + attr);
            return;
        }
        this.curAttr[attr] = value;
    },
    __animateInit: function (config, options, callback) {
        if (this._animating) {
            console.warn('This node is animatimg now');
            return;
        }
        if (!config.time) {
            console.warn('Duration is must');
            return;
        }
        if (config.time === 0) {
            return;
        }
        this.animAttr.startTime = config.delay || 0;
        this.animAttr.totalTime = config.time + this.animAttr.startTime;
        this.animAttr.passTime = 0;
        this.animAttr.duration = config.time;
        this.animAttr.type = config.type || 'linear';
        this._animating = true;
        this.animAttr.startAttr = {};
        for (var k in this.attr) {
            this.animAttr.startAttr[k] = this.attr[k];
        }
        for (var k in options) {
            this.attr[k] = options[k];
        }
        if (callback) {
            this.animAttr.callback = callback;
        }
    },
    __animateFrame: function (node) {
        if (node.animAttr.passTime === 0) {
            node.curAttr = ZCanvas.Util.clone(node.animAttr.startAttr);
            if (node.curAttr.curvePointX && node.curAttr.curvePointY) {
                var x0 = node.curAttr.curvePointX[0];
                var y0 = node.curAttr.curvePointY[0];
                node.curAttr.curvePointX = (node.curveQuar === 2 ? [x0, x0, x0] : [x0, x0, x0, x0]);
                node.curAttr.curvePointY = (node.curveQuar === 2 ? [y0, y0, y0] : [y0, y0, y0, y0]);
            }
        }
        if (node.animAttr.passTime <= node.animAttr.startTime) {
            node.animAttr.passTime++;
            return;
        }
        for (var k in node.attr) {
            switch (k) {
                case 'shadowColor':
                case 'strokeStyle':
                case 'fillStyle':
                case 'lineCap':
                case 'dashes':
                case 'fontWeight':
                case 'fontFamily':
                case 'fontVariant':
                case 'fontStyle':
                    node.curAttr[k] = node.attr[k];
                    break;
                case 'rotate':
                    node.curAttr[k] = this.__animateCal(node.animAttr.type, node.animAttr.startAttr[k], node.attr[k], node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, false);
                    break;
                case 'curvePointX':
                    if (!node.lineLaunch) {
                        for (var i = 0; i < node.curAttr[k].length; i++) {
                            node.curAttr[k][i] = this.__animateCal(node.animAttr.type, node.animAttr.startAttr[k][i], node.attr[k][i], node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                        }
                        return;
                    } else {
                        switch (node.curveQuar) {
                            case 2:
                                var q0 = node.attr[k][0];
                                var q1 = node.attr[k][1];
                                var q2 = node.attr[k][2];
                                var q01 = this.__animateCal('linear', q0, q1, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                var q12 = this.__animateCal('linear', q1, q2, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                node.curAttr[k][0] = q0;
                                node.curAttr[k][1] = this.__animateCal('linear', q0, q1, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                node.curAttr[k][2] = this.__animateCal('curve2', node.animAttr.startAttr[k], 0, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                break;
                            case 3:
                                var q0 = node.attr[k][0];
                                var q1 = node.attr[k][1];
                                var q2 = node.attr[k][2];
                                var q3 = node.attr[k][3];
                                var q01 = this.__animateCal('linear', q0, q1, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                var q12 = this.__animateCal('linear', q1, q2, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                node.curAttr[k][0] = q0;
                                node.curAttr[k][1] = q01;
                                node.curAttr[k][2] = this.__animateCal('linear', q01, q12, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                node.curAttr[k][3] = this.__animateCal('curve3', node.animAttr.startAttr[k], 0, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                break;
                            default:
                                break;
                        }
                    }
                    break;
                case 'curvePointY':
                    if (!node.lineLaunch) {
                        for (var i = 0; i < node.curAttr[k].length; i++) {
                            node.curAttr[k][i] = this.__animateCal(node.animAttr.type, node.animAttr.startAttr[k][i], node.attr[k][i], node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                        }
                        return;
                    } else {
                        switch (node.curveQuar) {
                            case 2:
                                var q0 = node.attr[k][0];
                                var q1 = node.attr[k][1];
                                var q2 = node.attr[k][2];
                                node.curAttr[k][0] = q0;
                                node.curAttr[k][1] = this.__animateCal('linear', q0, q1, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                node.curAttr[k][2] = this.__animateCal('curve2', node.animAttr.startAttr[k], 0, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                break;
                            case 3:
                                var q0 = node.attr[k][0];
                                var q1 = node.attr[k][1];
                                var q2 = node.attr[k][2];
                                var q3 = node.attr[k][3];
                                var q01 = this.__animateCal('linear', q0, q1, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                var q12 = this.__animateCal('linear', q1, q2, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                node.curAttr[k][0] = q0;
                                node.curAttr[k][1] = q01;
                                node.curAttr[k][2] = this.__animateCal('linear', q01, q12, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                node.curAttr[k][3] = this.__animateCal('curve3', node.animAttr.startAttr[k], 0, node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                                break;
                            default:
                                break;
                        }
                    }
                    break;
                default:
                    node.curAttr[k] = this.__animateCal(node.animAttr.type, node.animAttr.startAttr[k], node.attr[k], node.animAttr.duration, node.animAttr.startTime, node.animAttr.passTime, true);
                    break;
            }
        }
        if (node.animAttr.passTime >= node.animAttr.totalTime) {
            var callback = node.animAttr.callback || null;
            node._animating = false;
            node.animAttr = {};
            if (callback) {
                callback();
            }
        } else {
            node.animAttr.passTime++;
        }
    },
    __animateCal: function (type, start, end, duration, startTime, pass, frace) {
        var value;
        var animatepass = pass - startTime;
        switch (type) {
            case 'linear':
                value = start + (end - start) / duration * animatepass;
                if (frace) {
                    return (Math.abs(value) < 10) ? value.toFixed(2) * 1 : Math.floor(value);
                } else {
                    return value;
                }
                break;
            case 'curve2':
                value = ZCanvas.Util.getCurvePos(2, animatepass, duration, [start[0], start[1], start[2]]);
                return value;
                break;
            case 'curve3':
                value = ZCanvas.Util.getCurvePos(3, animatepass, duration, [start[0], start[1], start[2], start[3]]);
                return value;
                break;
            default:
                break;
        }
    }
}
ZCanvas.Rect = function (options, cacheCtx) {
    this.__init(options, cacheCtx);
}
ZCanvas.Rect.prototype = Object.create(ZCanvas.Node.prototype);    //Object.create():创建一个空对象，并且这个对象的原型指向它的参数  //这样子我们可以在访问Student.prototype的时候可以向上查找到Person.prototype,又可以在不影响Person的情况下，创建自己的方法
ZCanvas.Rect.prototype.constructor = ZCanvas.Node;
ZCanvas.Rect.prototype.__init = function (options, cacheCtx) {
    ZCanvas.Node.call(this, options, cacheCtx);
    this.nType = "rect";
    this.attr.width = options.width || 0;
    this.attr.height = options.height || 0;
    this.attr.x = options.x || 0;
    this.attr.y = options.y || 0;
    this.attr.orignX = options.orignX || 0;
    this.attr.orignY = options.orignY || 0;
    this.fill = options.fill || false;
    this.attr.fillStyle = options.fillStyle || '#000';
    this.shadow = options.shadow || false;
    this.attr.shadowBlur = options.shadowBlur || 1;
    this.attr.shadowColor = options.shadowColor || '#000';
    this.attr.shadowOffsetX = options.shadowOffsetX || 0;
    this.attr.shadowOffsetY = options.shadowOffsetY || 0;
    this.stroke = options.stroke || false;
    this.attr.strokeStyle = options.strokeStyle || '#000';
    this.attr.strokeWidth = options.strokeWidth || 1;
    this.attr.rotate = options.rotate || 0;
    this.attr.scaleX = options.scaleX || 1;
    this.attr.scaleY = options.scaleY || 1;
    this.attr.opacity = (options.opacity || options.opacity === 0) ? options.opacity : 1;
};
ZCanvas.Rect.prototype.__draw = function () {
    this._cacheCtx.save();
    this._cacheCtx.beginPath();
    this._cacheCtx.translate(this.curAttr.x, this.curAttr.y);
    if (this.curAttr.scaleX !== 1 && this.curAttr.scaleY !== 1) {
        this._cacheCtx.scale(this.curAttr.scaleX, this.curAttr.scaleY);
    }
    if (this.curAttr.rotate !== 0) {
        this._cacheCtx.rotate(this.curAttr.rotate);
    }
    if (this.curAttr.opacity !== 1) {
        this._cacheCtx.globalAlpha = this.curAttr.opacity;
    }
    if (this.shadow) {
        this._cacheCtx.shadowColor = this.curAttr.shadowColor;
        this._cacheCtx.shadowBlur = this.curAttr.shadowBlur;
        this._cacheCtx.shadowOffsetX = this.curAttr.shadowOffsetX;
        this._cacheCtx.shadowOffsetY = this.curAttr.shadowOffsetY;
    }
    if (this.stroke) {
        this._cacheCtx.strokeStyle = this.curAttr.strokeStyle;
        this._cacheCtx.lineWidth = this.curAttr.strokeWidth;
        this._cacheCtx.strokeRect(-this.curAttr.orignX, -this.curAttr.orignY, this.curAttr.width, this.curAttr.height);
    }
    if (this.fill) {
        this._cacheCtx.fillStyle = this.curAttr.fillStyle;
        this._cacheCtx.fillRect(-this.curAttr.orignX, -this.curAttr.orignY, this.curAttr.width, this.curAttr.height);
    }
    this._cacheCtx.closePath();
    this._cacheCtx.restore();
}

ZCanvas.Line = function (options, cacheCtx) {
    this.__init(options, cacheCtx);
}
ZCanvas.Line.prototype = Object.create(ZCanvas.Node.prototype);    //Object.create():创建一个空对象，并且这个对象的原型指向它的参数  //这样子我们可以在访问Student.prototype的时候可以向上查找到Person.prototype,又可以在不影响Person的情况下，创建自己的方法
ZCanvas.Line.prototype.constructor = ZCanvas.Node;
ZCanvas.Line.prototype.__init = function (options, cacheCtx) {
    ZCanvas.Node.call(this, options, cacheCtx);
    this.nType = "line";
    this.attr.x1 = options.x1 || 0;
    this.attr.y1 = options.y1 || 0;
    this.attr.x2 = options.x2 || 0;
    this.attr.y2 = options.y2 || 0;
    this.attr.lineWidth = options.lineWidth || 1;
    this.attr.lineCap = options.lineCap || 'butt';
    this.shadow = options.shadow || false;
    this.dash = options.dash || false;
    this.attr.dashes = options.dashes || 5;
    this.attr.shadowBlur = options.shadowBlur || 0;
    this.attr.shadowColor = options.shadowColor || '#000';
    this.attr.shadowOffsetX = options.shadowOffsetX || 0;
    this.attr.shadowOffsetY = options.shadowOffsetY || 0;
    this.attr.strokeStyle = options.strokeStyle || '#000';
    this.attr.scaleX = options.scaleX || 1;
    this.attr.scaleY = options.scaleY || 1;
    this.attr.opacity = (options.opacity || options.opacity === 0) ? options.opacity : 1;
};
ZCanvas.Line.prototype.__dashLine = function () {
    var dashes = this.curAttr.dashes;
    var w = this.curAttr.x2 - this.curAttr.x1;
    var h = this.curAttr.y2 - this.curAttr.y1;
    var piw = w / dashes;
    var pih = h / dashes;
    //利用正切获取斜边的长度除以虚线长度，得到要分为多少段;
    for (var i = 0; i < dashes; i++) {
        var sx = (this.curAttr.x1 + i * piw + piw * 0.2).toFixed(1);
        var sy = (this.curAttr.y1 + i * pih + pih * 0.2).toFixed(1);
        var ex = (this.curAttr.x1 + i * piw + piw * 0.8).toFixed(1);
        var ey = (this.curAttr.y1 + i * pih + pih * 0.8).toFixed(1);
        this._cacheCtx.moveTo(sx, sy);
        this._cacheCtx.lineTo(ex, ey);
    }
}
ZCanvas.Line.prototype.__draw = function () {
    this._cacheCtx.save();
    this._cacheCtx.beginPath();
    this._cacheCtx.translate(this.curAttr.x, this.curAttr.y);
    if (this.curAttr.scaleX !== 1 && this.curAttr.scaleY !== 1) {
        this._cacheCtx.scale(this.curAttr.scaleX, this.curAttr.scaleY);
    }
    if (this.curAttr.opacity !== 1) {
        this._cacheCtx.globalAlpha = this.curAttr.opacity;
    }
    if (this.shadow) {
        this._cacheCtx.shadowColor = this.curAttr.shadowColor;
        this._cacheCtx.shadowBlur = this.curAttr.shadowBlur;
        this._cacheCtx.shadowOffsetX = this.curAttr.shadowOffsetX;
        this._cacheCtx.shadowOffsetY = this.curAttr.shadowOffsetY;
    }
    if (this.curAttr.strokeStyle !== '#000') {
        this._cacheCtx.strokeStyle = this.curAttr.strokeStyle;
    }
    if (this.curAttr.lineWidth !== 1) {
        this._cacheCtx.lineWidth = this.curAttr.lineWidth;
    }
    if (this.curAttr.lineCap !== "butt") {
        this._cacheCtx.lineCap = this.curAttr.lineCap;
    }
    if (this.dash) {
        this.__dashLine();
    } else {
        this._cacheCtx.moveTo(this.curAttr.x1, this.curAttr.y1);
        this._cacheCtx.lineTo(this.curAttr.x2, this.curAttr.y2);
    }
    this._cacheCtx.stroke();
    this._cacheCtx.closePath();
    this._cacheCtx.restore();
}

ZCanvas.CurveLine = function (options, cacheCtx) {
    this.__init(options, cacheCtx);
}
ZCanvas.CurveLine.prototype = Object.create(ZCanvas.Node.prototype);    //Object.create():创建一个空对象，并且这个对象的原型指向它的参数  //这样子我们可以在访问Student.prototype的时候可以向上查找到Person.prototype,又可以在不影响Person的情况下，创建自己的方法
ZCanvas.CurveLine.prototype.constructor = ZCanvas.Node;
ZCanvas.CurveLine.prototype.__init = function (options, cacheCtx) {
    ZCanvas.Node.call(this, options, cacheCtx);
    this.nType = "curveline";
    this.curveQuar = options.curveQuar || 2;
    this.attr.curvePointX = options.curvePointX || (this.curveQuar === 2 ? [0, 0, 0] : [0, 0, 0, 0]);
    this.attr.curvePointY = options.curvePointY || (this.curveQuar === 2 ? [0, 0, 0] : [0, 0, 0, 0]);
    this.lineLaunch = options.lineLaunch || false;
    this.attr.lineWidth = options.lineWidth || 1;
    this.attr.lineCap = options.lineCap || 'butt';
    this.shadow = options.shadow || false;
    this.attr.shadowBlur = options.shadowBlur || 1;
    this.attr.shadowColor = options.shadowColor || '#000';
    this.attr.shadowOffsetX = options.shadowOffsetX || 0;
    this.attr.shadowOffsetY = options.shadowOffsetY || 0;
    this.stroke = options.stroke || false;
    this.attr.strokeStyle = options.strokeStyle || '#000';
    this.attr.scaleX = options.scaleX || 1;
    this.attr.scaleY = options.scaleY || 1;
    this.attr.opacity = (options.opacity || options.opacity === 0) ? options.opacity : 1;
};
ZCanvas.CurveLine.prototype.__draw = function () {
    this._cacheCtx.save();
    this._cacheCtx.beginPath();
    if (this.curAttr.scaleX !== 1 && this.curAttr.scaleY !== 1) {
        this._cacheCtx.scale(this.curAttr.scaleX, this.curAttr.scaleY);
    }
    if (this.curAttr.opacity !== 1) {
        this._cacheCtx.globalAlpha = this.curAttr.opacity;
    }
    if (this.shadow) {
        this._cacheCtx.shadowColor = this.curAttr.shadowColor;
        this._cacheCtx.shadowBlur = this.curAttr.shadowBlur;
        this._cacheCtx.shadowOffsetX = this.curAttr.shadowOffsetX;
        this._cacheCtx.shadowOffsetY = this.curAttr.shadowOffsetY;
    }
    this._cacheCtx.strokeStyle = this.curAttr.strokeStyle;
    this._cacheCtx.lineWidth = this.curAttr.lineWidth;
    switch (this.curveQuar) {
        case 2:
            this._cacheCtx.moveTo(this.curAttr.curvePointX[0], this.curAttr.curvePointY[0]);
            this._cacheCtx.quadraticCurveTo(this.curAttr.curvePointX[1], this.curAttr.curvePointY[1], this.curAttr.curvePointX[2], this.curAttr.curvePointY[2]);
            break;
        case 3:
            this._cacheCtx.moveTo(this.curAttr.curvePointX[0], this.curAttr.curvePointY[0]);
            this._cacheCtx.bezierCurveTo(this.curAttr.curvePointX[1], this.curAttr.curvePointY[1], this.curAttr.curvePointX[2], this.curAttr.curvePointY[2], this.curAttr.curvePointX[3], this.curAttr.curvePointY[3]);
            break;
        default:
            console.warn("The curveQuar should be 2 or 3");
            break;
    }
    this._cacheCtx.stroke();
    this._cacheCtx.closePath();
    this._cacheCtx.restore();
}

ZCanvas.Text = function (options, cacheCtx) {
    this.__init(options, cacheCtx);
}
ZCanvas.Text.prototype = Object.create(ZCanvas.Node.prototype);    //Object.create():创建一个空对象，并且这个对象的原型指向它的参数  //这样子我们可以在访问Student.prototype的时候可以向上查找到Person.prototype,又可以在不影响Person的情况下，创建自己的方法
ZCanvas.Text.prototype.constructor = ZCanvas.Node;
ZCanvas.Text.prototype.__init = function (options, cacheCtx) {
    ZCanvas.Node.call(this, options, cacheCtx);
    this.nType = "text";
    this.attr.x = options.x || 0;
    this.attr.y = options.y || 0;
    this.text = options.text || '';
    this.attr.fontStyle = options.fontStyle || "normal";
    this.attr.fontVariant = options.fontVariant || "normal";
    this.attr.fontWeight = options.fontWeight || 500;
    this.attr.fontSize= options.fontSize || '20px';
    this.attr.fontFamily = options.fontFamily || "Arial";
    this.fill = options.fill || false;
    this.attr.fillStyle = options.fillStyle || "#000";
    this.shadow = options.shadow || false;
    this.attr.shadowBlur = options.shadowBlur || 1;
    this.attr.shadowColor = options.shadowColor || '#000';
    this.attr.shadowOffsetX = options.shadowOffsetX || 0;
    this.attr.shadowOffsetY = options.shadowOffsetY || 0;
    this.stroke = options.stroke || false;
    this.attr.strokeStyle = options.strokeStyle || '#000';
    this.attr.strokeWidth = options.strokeWidth || 1;
    this.attr.scaleX = options.scaleX || 1;
    this.attr.scaleY = options.scaleY || 1;
    this.attr.opacity = (options.opacity || options.opacity === 0) ? options.opacity : 1;
};
ZCanvas.Text.prototype.__draw = function () {
    this._cacheCtx.save();
    this._cacheCtx.beginPath();
    this._cacheCtx.translate(this.curAttr.x, this.curAttr.y);
    var font = '';
    if (this.curAttr.scaleX !== 1 && this.curAttr.scaleY !== 1) {
        this._cacheCtx.scale(this.curAttr.scaleX, this.curAttr.scaleY);
    }
    if (this.curAttr.opacity !== 1) {
        this._cacheCtx.globalAlpha = this.curAttr.opacity;
    }
    if (this.shadow) {
        this._cacheCtx.shadowColor = this.curAttr.shadowColor;
        this._cacheCtx.shadowBlur = this.curAttr.shadowBlur;
        this._cacheCtx.shadowOffsetX = this.curAttr.shadowOffsetX;
        this._cacheCtx.shadowOffsetY = this.curAttr.shadowOffsetY;
    }
    font += this.curAttr.fontStyle + ' ';
    font +=this.curAttr.fontVariant + ' ';
    font +=this.curAttr.fontWeight + ' ';
    font += (this.curAttr.fontSize.toString().indexOf('px')!==-1)?this.curAttr.fontSize:(this.curAttr.fontSize+"px ");
    font += this.curAttr.fontFamily;
    this._cacheCtx.font = font;
    if (this.fill) {
        this._cacheCtx.fillStyle = this.curAttr.fillStyle;
        this._cacheCtx.fillText(this.text, 0, 20);
    }
    if(this.stroke){
        this._cacheCtx.strokeStyle = this.curAttr.strokeStyle;
        this._cacheCtx.strokeWidth = this.curAttr.strokeWidth;
        this._cacheCtx.strokeText(this.text,this.curAttr.x,this.curAttr.y);
    }
    this._cacheCtx.closePath();
    this._cacheCtx.restore();
}

ZCanvas.Circle = function (options, cacheCtx) {
    this.__init(options, cacheCtx);
}
ZCanvas.Circle.prototype = Object.create(ZCanvas.Node.prototype);    //Object.create():创建一个空对象，并且这个对象的原型指向它的参数  //这样子我们可以在访问Student.prototype的时候可以向上查找到Person.prototype,又可以在不影响Person的情况下，创建自己的方法
ZCanvas.Circle.prototype.constructor = ZCanvas.Node;
ZCanvas.Circle.prototype.__init = function (options, cacheCtx) {
    ZCanvas.Node.call(this, options, cacheCtx);
    this.nType = "circle";
    this.attr.x = options.x || 0;
    this.attr.y = options.y || 0;
    this.attr.radius = options.radius || 0;
    this.fill = options.fill || false;
    this.attr.fillStyle = options.fillStyle || "#000";
    this.shadow = options.shadow || false;
    this.attr.shadowBlur = options.shadowBlur || 1;
    this.attr.shadowColor = options.shadowColor || '#000';
    this.attr.shadowOffsetX = options.shadowOffsetX || 0;
    this.attr.shadowOffsetY = options.shadowOffsetY || 0;
    this.stroke = options.stroke || false;
    this.attr.strokeStyle = options.strokeStyle || '#000';
    this.attr.strokeWidth = options.strokeWidth || 1;
    this.attr.scaleX = options.scaleX || 1;
    this.attr.scaleY = options.scaleY || 1;
    this.attr.opacity = (options.opacity || options.opacity === 0) ? options.opacity : 1;
};
ZCanvas.Circle.prototype.__draw = function () {
    this._cacheCtx.save();
    this._cacheCtx.beginPath();
    this._cacheCtx.translate(this.curAttr.x, this.curAttr.y);
    if (this.curAttr.scaleX !== 1 && this.curAttr.scaleY !== 1) {
        this._cacheCtx.scale(this.curAttr.scaleX, this.curAttr.scaleY);
    }
    if (this.curAttr.opacity !== 1) {
        this._cacheCtx.globalAlpha = this.curAttr.opacity;
    }
    if (this.shadow) {
        this._cacheCtx.shadowColor = this.curAttr.shadowColor;
        this._cacheCtx.shadowBlur = this.curAttr.shadowBlur;
        this._cacheCtx.shadowOffsetX = this.curAttr.shadowOffsetX;
        this._cacheCtx.shadowOffsetY = this.curAttr.shadowOffsetY;
    }
    this._cacheCtx.arc(0, 0, this.curAttr.radius, 0, 2 * Math.PI);
    if (this.fill) {
        this._cacheCtx.fillStyle = this.curAttr.fillStyle;
        this._cacheCtx.fill();
    }
    if (this.stroke) {
        this._cacheCtx.strokeStyle = this.curAttr.strokeStyle;
        this._cacheCtx.lineWidth = this.curAttr.strokeWidth;
        this._cacheCtx.stroke();
    }
    this._cacheCtx.closePath();
    this._cacheCtx.restore();
}

ZCanvas.Dot = function (options, cacheCtx) {
    this.__init(options, cacheCtx);
}
ZCanvas.Dot.prototype = Object.create(ZCanvas.Node.prototype);    //Object.create():创建一个空对象，并且这个对象的原型指向它的参数  //这样子我们可以在访问Student.prototype的时候可以向上查找到Person.prototype,又可以在不影响Person的情况下，创建自己的方法
ZCanvas.Dot.prototype.constructor = ZCanvas.Node;
ZCanvas.Dot.prototype.__init = function (options, cacheCtx) {
    ZCanvas.Node.call(this, options, cacheCtx);
    this.nType = "dot";
    this.dotType = options.dotType || "rect";
    this.cent = options.cent || false;
    this.attr.x = options.x || 0;
    this.attr.y = options.y || 0;
    this.attr.centX = options.centX || 0;
    this.attr.centY = options.centY || 0;
    this.attr.radius = options.radius || 0;
    this.attr.centRotate = options.centRotate || 0;
    this.attr.centRadius = options.centRadius || 0;
    this.fill = options.fill || false;
    this.attr.fillStyle = options.fillStyle || "#000";
    this.shadow = options.shadow || false;
    this.attr.shadowBlur = options.shadowBlur || 1;
    this.attr.shadowColor = options.shadowColor || '#000';
    this.attr.shadowOffsetX = options.shadowOffsetX || 0;
    this.attr.shadowOffsetY = options.shadowOffsetY || 0;
    this.stroke = options.stroke || false;
    this.attr.strokeStyle = options.strokeStyle || '#000';
    this.attr.strokeWidth = options.strokeWidth || 1;
    this.attr.scaleX = options.scaleX || 1;
    this.attr.scaleY = options.scaleY || 1;
    this.attr.opacity = (options.opacity || options.opacity === 0) ? options.opacity : 1;
};
ZCanvas.Dot.prototype.__draw = function () {
    this._cacheCtx.save();
    this._cacheCtx.beginPath();
    if (this.cent) {
        this._cacheCtx.translate(this.curAttr.centX, this.curAttr.centY);
    } else {
        this._cacheCtx.translate(this.curAttr.x, this.curAttr.y);
    }
    if (this.curAttr.scaleX !== 1 && this.curAttr.scaleY !== 1) {
        this._cacheCtx.scale(this.curAttr.scaleX, this.curAttr.scaleY);
    }
    if (this.curAttr.opacity !== 1) {
        this._cacheCtx.globalAlpha = this.curAttr.opacity;
    }
    if (this.shadow) {
        this._cacheCtx.shadowColor = this.curAttr.shadowColor;
        this._cacheCtx.shadowBlur = this.curAttr.shadowBlur;
        this._cacheCtx.shadowOffsetX = this.curAttr.shadowOffsetX;
        this._cacheCtx.shadowOffsetY = this.curAttr.shadowOffsetY;
    }
    switch (this.dotType) {
        case 'rect':
            if (this.cent) {
                var x = (this.curAttr.centRadius * Math.cos(this.curAttr.centRotate)).toFixed(1);
                var y = (this.curAttr.centRadius * Math.sin(this.curAttr.centRotate)).toFixed(1);
                this._cacheCtx.rect(x - this.curAttr.radius, y - this.curAttr.radius, 2 * this.curAttr.radius, 2 * this.curAttr.radius);
            } else {
                this._cacheCtx.rect(-this.curAttr.radius, -this.curAttr.radius, 2 * this.curAttr.radius, 2 * this.curAttr.radius);
            }
            break;
        case 'round':
            if (this.cent) {
                var x = (this.curAttr.centRadius * Math.cos(this.curAttr.centRotate)).toFixed(1);
                var y = (this.curAttr.centRadius * Math.sin(this.curAttr.centRotate)).toFixed(1);
                this._cacheCtx.arc(x, y, this.curAttr.radius, 0, 2 * Math.PI);
            } else {
                this._cacheCtx.arc(0, 0, this.curAttr.radius, 0, 2 * Math.PI);
            }
            break;
        default:
            break;
    }
    if (this.fill) {
        this._cacheCtx.fillStyle = this.curAttr.fillStyle;
        this._cacheCtx.fill();
    }
    if (this.stroke) {
        this._cacheCtx.strokeStyle = this.curAttr.strokeStyle;
        this._cacheCtx.lineWidth = this.curAttr.strokeWidth;
        this._cacheCtx.stroke();
    }
    this._cacheCtx.closePath();
    this._cacheCtx.restore();
}


ZCanvas.ArcShape = function (options, cacheCtx) {
    this.__init(options, cacheCtx);
}
ZCanvas.ArcShape.prototype = Object.create(ZCanvas.Node.prototype);    //Object.create():创建一个空对象，并且这个对象的原型指向它的参数  //这样子我们可以在访问Student.prototype的时候可以向上查找到Person.prototype,又可以在不影响Person的情况下，创建自己的方法
ZCanvas.ArcShape.prototype.constructor = ZCanvas.Node;
ZCanvas.ArcShape.prototype.__init = function (options, cacheCtx) {
    ZCanvas.Node.call(this, options, cacheCtx);
    this.nType = "arcshape";
    this.attr.x = options.x || 0;
    this.attr.y = options.y || 0;
    this.attr.radius = options.radius || 0;
    this.attr.startAngle = options.startAngle || 0;
    this.attr.endAngle = options.endAngle || 0;
    this.attr.lineWidth = options.lineWidth || 1;
    this.attr.lineCap = options.lineCap || 'butt';
    this.arcLine = options.arcLine || false;
    this.fill = options.fill || false;
    this.attr.fillStyle = options.fillStyle || "#000";
    this.shadow = options.shadow || false;
    this.attr.shadowBlur = options.shadowBlur || 1;
    this.attr.shadowColor = options.shadowColor || '#000';
    this.attr.shadowOffsetX = options.shadowOffsetX || 0;
    this.attr.shadowOffsetY = options.shadowOffsetY || 0;
    this.stroke = options.stroke || false;
    this.attr.strokeStyle = options.strokeStyle || '#000';
    this.attr.scaleX = options.scaleX || 1;
    this.attr.scaleY = options.scaleY || 1;
    this.attr.opacity = (options.opacity || options.opacity === 0) ? options.opacity : 1;
};
ZCanvas.ArcShape.prototype.__draw = function () {
    this._cacheCtx.save();
    this._cacheCtx.beginPath();
    this._cacheCtx.translate(this.curAttr.x, this.curAttr.y);
    if (this.curAttr.scaleX !== 1 && this.curAttr.scaleY !== 1) {
        this._cacheCtx.scale(this.curAttr.scaleX, this.curAttr.scaleY);
    }
    if (this.curAttr.opacity !== 1) {
        this._cacheCtx.globalAlpha = this.curAttr.opacity;
    }
    if (this.shadow) {
        this._cacheCtx.shadowColor = this.curAttr.shadowColor;
        this._cacheCtx.shadowBlur = this.curAttr.shadowBlur;
        this._cacheCtx.shadowOffsetX = this.curAttr.shadowOffsetX;
        this._cacheCtx.shadowOffsetY = this.curAttr.shadowOffsetY;
    }
    if (this.arcLine) {
        this._cacheCtx.arc(0, 0, this.curAttr.radius, this.curAttr.startAngle, this.curAttr.endAngle);
    } else {
        var startX = (this.curAttr.radius * Math.cos(this.curAttr.startAngle)).toFixed(1);
        var startY = (this.curAttr.radius * Math.sin(this.curAttr.startAngle)).toFixed(1);
        var endX = (this.curAttr.radius * Math.cos(this.curAttr.endAngle)).toFixed(1);
        var endY = (this.curAttr.radius * Math.sin(this.curAttr.endAngle)).toFixed(1);
        this._cacheCtx.moveTo(0, 0);
        this._cacheCtx.lineTo(startX, startY);
        this._cacheCtx.arc(0, 0, this.curAttr.radius, this.curAttr.startAngle, this.curAttr.endAngle);
        this._cacheCtx.lineTo(0, 0);
        if (this.fill) {
            this._cacheCtx.fillStyle = this.curAttr.fillStyle;
            this._cacheCtx.fill();
        }
    }
    if (this.stroke) {
        this._cacheCtx.strokeStyle = this.curAttr.strokeStyle;
        this._cacheCtx.lineCap = this.curAttr.lineCap;
        this._cacheCtx.lineWidth = this.curAttr.lineWidth;
        this._cacheCtx.stroke();
    }
    this._cacheCtx.closePath();
    this._cacheCtx.restore();
}

// =========================================================ZCanvas.Class======================================================

ZCanvas.Util = {
    getCurvePos: function (curveQuar, curtime, totaltime, ctrlPoses) {
        var sp = ctrlPoses[0];
        var ep = ctrlPoses[ctrlPoses.length - 1];
        var t = curtime / totaltime;
        var np;
        switch (curveQuar) {
            case 2:
                var cp = ctrlPoses[1];
                np = Math.pow((1 - t), 2) * sp + 2 * (1 - t) * t * cp + Math.pow(t, 2) * ep;
                break;
            case 3:
                var cp1 = ctrlPoses[1];
                var cp2 = ctrlPoses[2];
                np = Math.pow((1 - t), 3) * sp + 3 * Math.pow((1 - t), 2) * t * cp1 + 3 * (1 - t) * Math.pow(t, 2) * cp2 + Math.pow(t, 3) * ep;;
                break;
            default:
                console.warn('Param curveQuar is must');
        }
        return np.toFixed(2) * 1;
    },
    clone: function (Obj) {
        function clone(Obj) {
            var buf;
            if (Obj instanceof Array) {
                buf = [];  // 创建一个空的数组
                var i = Obj.length;
                while (i--) {
                    buf[i] = clone(Obj[i]);
                }
                return buf;
            } else if (Obj instanceof Object) {
                buf = {};  // 创建一个空对象
                for (var k in Obj) {  // 为这个对象添加新的属性
                    buf[k] = clone(Obj[k]);
                }
                return buf;
            } else {
                return Obj;
            }
        }
        return clone(Obj);
    }
}

// =========================================================ZCanvas.Util======================================================
window.ZCanvas = ZCanvas;