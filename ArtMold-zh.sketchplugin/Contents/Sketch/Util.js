/**
 * Created by rongyanzry on 16/3/24.
 */


//--------------------------------------//
//               Size                   //
//--------------------------------------//

/**
 * 获取图层尺寸的系列函数
 */
var getParentOldWidth = function (layer, scale) {

    //return Math.round(layer.parentGroup().frame().width() / parseFloat(scale));
    return layer.parentGroup().frame().width() / parseFloat(scale);
};

var getParentOldHeight = function (layer, scale) {

    //return Math.round(layer.parentGroup().frame().height() / parseFloat(scale));
    return layer.parentGroup().frame().height() / parseFloat(scale);
};

var getOldWidth = function (layer, scale) {

    //return Math.round(layer.frame().width() / parseFloat(scale));
    return layer.frame().width() / parseFloat(scale);
};

var getOldHeight = function (layer, scale) {

    //return Math.round(layer.frame().height() / parseFloat(scale));
    return layer.frame().height() / parseFloat(scale);
};

var getOldLeft = function (layer, scale) {

    return layer.frame().x() / parseFloat(scale);
};

var getOldTop = function (layer, scale) {

    //return Math.round(layer.frame().y() / parseFloat(scale));
    return layer.frame().y() / parseFloat(scale);
};

var getOldRight = function (layer, scale) {

    return (getParentWidth(layer) - getLeft(layer) - getWidth(layer)) / parseFloat(scale);
};

var getOldBottom = function (layer, scale) {

    return (getParentHeight(layer) - getTop(layer) - getHeight(layer))  / parseFloat(scale);
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

var getRight = function (layer) {

    return  getParentWidth(layer) - getLeft(layer) - getWidth(layer);
};

var getBottom = function (layer) {

    return getParentHeight(layer) - getTop(layer) - getHeight(layer);
};

/**
 * 设置图层尺寸的系列函数
 */
var setWidth = function (layer, width) {

    //layer.frame().setWidth(Math.round(width));
    layer.frame().setWidth(width);

};

var setHeight = function (layer, height) {

    //layer.frame().setHeight(Math.round(height));
    layer.frame().setHeight(height);

};

var setLeft = function (layer, x) {

    //layer.frame().setX(Math.round(x));
    layer.frame().setX(x);
};

var setTop = function (layer, y) {

    //layer.frame().setY(Math.round(y));
    layer.frame().setY(y);
};


var setSize = function (layer, w, h) {

    var size = NSMakeSize (Math.round(w), Math.round(h));
    layer.frame().setSize(size);
};

/**
 * 缩放图层的尺寸
 * @param layer
 * @param hScale 水平方向缩放的比例 : 目标画板尺寸 / 原始画板尺寸
 * @param vScale 垂直方向缩放的比例 : 目标画板尺寸 / 原始画板尺寸
 */
var scaleFrame = function (layer, hScale, vScale) {

    // MSBitmapLayer的frame这样计算错误很大,js用浮点数表示
    //setWidth(layer, getWidth(layer)* hScale);
    //setHeight(layer,  getHeight(layer) * vScale);
    log("scaleFrame-layer ="+layer+layer.frame());
    log("scaleFrame-hScale =" + hScale);
    log("scaleFrame-vScale =" + vScale);
    var x = Math.round(getLeft(layer) * parseFloat(hScale));
    var y = Math.round(getTop(layer) * parseFloat(vScale));
    var w = Math.round(getWidth(layer) * parseFloat(hScale));
    var h = Math.round(getHeight(layer) * parseFloat(vScale));

    setLeft(layer, x);
    setTop(layer, y);
    //setSize(layer, w, h);
    setWidth(layer, w);
    setHeight(layer, h);
    log("afterScale" + layer+layer.frame());

    //if (isLayerClass(layer, "MSBitmapLayer")) {

        //scaleBitmap (layer, x, y, w, h);
        //log("8888bitmap  "+layer);
        //resizeImage (layer, w, h);
        //log("layer" + hScale);
        //return;
        //return;
    //}
    //if (getSketchVersion() >= 370) {
    //
    //    scalesymbolIinstance(layer);
    //}
};

var scaleSize = function (layer, hScale, vScale) {

    var w = Math.round(getWidth(layer) * parseFloat(hScale));
    var h = Math.round(getHeight(layer) * parseFloat(vScale));
    setSize(layer, w, h);
};

var scaleOrigin = function (layer, hScale, vScale) {

    var x = getLeft(layer) * hScale;
    var y = getTop(layer) * vScale;
    setLeft(layer, x);
    setTop(layer, y);
};

/**
 * sketch版本信息
 * @returns {Number}
 */
function getSketchVersion() {

    const version = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
    var versionNumber = version.stringByReplacingOccurrencesOfString_withString(".", "") + "";
    while(versionNumber.length != 3) {
        versionNumber += "0";
    }
    return parseInt(versionNumber)
}

// 屏幕虚拟坐标宽度比例: 用像素尺寸跟屏幕scale值计算
function calcLogicSizeScaleRatio(oldPixelSide, newPiexlSide, oldScale, newScale) {

    var ratio = newPiexlSide / newScale  / (oldPixelSide / oldScale);
    return parseFloat(ratio, 4);
}

/**
 *
 * @param oldPixelSide
 * @param newPixelSide
 * @param oldScale
 * @param newScale
 * @returns {number} 屏幕宽度一样: 缩放比例 = newScale / oldScale ; 屏幕宽度不一样:缩放比例 = 屏幕宽度比 * scale比值
 */
function calcSizeScaleRatio(oldPixelSide, newPixelSide, oldScale, newScale) {

    var oldPointSize = parseInt(oldPixelSide / oldScale);
    var newPointSize = parseInt(newPixelSide / newScale);

    if (oldPointSize == newPointSize) return newPixelSide / oldPixelSide;

    return newPointSize / oldPointSize * (newScale / oldScale);
}