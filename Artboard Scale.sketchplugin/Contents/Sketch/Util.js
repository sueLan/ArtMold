/**
 * Created by rongyanzry on 16/3/24.
 */

// getter
var getParentOldWidth = function (layer, scale) {

    return Math.round(layer.parentGroup().frame().width() / scale);
};

var getParentOldHeight = function (layer, scale) {

    return Math.round(layer.parentGroup().frame().height() / scale);
};


var getParentWidth = function (layer) {

    return layer.parentGroup().frame().width();
};

var getParentHeight = function (layer) {

    return layer.parentGroup().frame().height();
};

var getWidth = function (layer) {

    return layer.frame().width();
};

var getHeight = function (layer) {

    return layer.frame().height();
};

var getLeft = function (layer) {

    return layer.frame().x();
};

var getTop = function (layer) {

    return layer.frame().y();
};

var getOldRight = function (layer, scale) {

    return getParentOldWidth(layer, scale) - getLeft(layer) - getWidth(layer);
};


var getOldBottom = function (layer, scale) {

    return getParentOldHeight(layer, scale) - getTop(layer) - getHeight(layer);
};


// setter
var setWidth = function (layer, width) {

    layer.frame().setWidth(Math.round(width));
};

var setHeight = function (layer, height) {

    layer.frame().setHeight(Math.round(height));
};

var setLeft = function (layer, x) {

    layer.frame().setX(Math.round(x));
};

var setTop = function (layer, y) {

    layer.frame().setY(Math.round(y));
};

var setFrame = function (layer, sizes) {

    if (sizes == null || sizes == undefined || sizes.length != 4) return;
    var left = getLeft(layer);
    var top = getTop(layer);
    var width = getWidth(layer);
    var height = getHeight(layer);

    sizes[0] > left ? setLeft(layer, sizes[0]) : log(left);
    sizes[1] > top ? setTop(layer, sizes[1]) : log(top);
    sizes[2] > width ? setWidth(layer, sizes[2]) : log(width);
    sizes[3] > height ? setHeight(layer, sizes[3]) : log(height);
};


// scale
var scaleFrame = function (layer, hScale, vScale) {

    // MSBitmapLayer的frame这样计算错误很大,js用浮点数表示
    //setWidth(layer, getWidth(layer)* hScale);
    //setHeight(layer,  getHeight(layer) * vScale);
    var x = getLeft(layer) * hScale;
    var y = getTop(layer) * vScale;
    var w = getWidth(layer) * hScale;
    var h = getHeight(layer) * vScale;

    if (isLayerClass(layer, "MSBitmapLayer")) {

        log("8888bitmap");
        log(layer.frame());
        log("layer-width" + getWidth(layer));
        log("layer" + hScale);
        log("bitmap" + w);
    }
    
    setLeft(layer, x);
    setTop(layer, y);
    setWidth(layer, w);
    setHeight(layer, h);
};

var scaleOrigin = function (layer, hScale, vScale) {

    var x = getLeft(layer) * hScale;
    var y = getTop(layer) * vScale;
    setLeft(layer, x);
    setTop(layer, y);
};
