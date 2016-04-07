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

    return Math.round(layer.parentGroup().frame().width() / parseFloat(scale));
};

var getParentOldHeight = function (layer, scale) {

    return Math.round(layer.parentGroup().frame().height() / parseFloat(scale));
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

// 获取layer在父节点中的右边距
var getRightInRecursion = function(layer, hScale) {

    //if (isLayerClass(layer.parentGroup(), "MSArtboardGroup")) {
    //
    //    return getParentWidth(layer) - getLeft(layer) - getWidth(layer);
    //}

    // 父节点视图或者组元素,在递归遍历的时候,都已经放大过
    return getParentOldWidth(layer, hScale) -  getLeft(layer) - getWidth(layer);
};

// 获取layer在父亲节点中的下边距
var getBottomInrecursion = function(layer, vScale) {

    //if (isLayerClass(layer.parentGroup(), "MSArtboardGroup")) {
    //
    //    return getParentHeight(layer) - getTop(layer) - getHeight(layer);
    //}

    // 父节点视图或者组元素,在递归遍历的时候,都已经放大过
    return getParentOldHeight(layer, vScale) - getTop(layer) - getHeight(layer);
};

var getParentWidthInrecursion = function (layer, hScale) {

    //if (isLayerClass(layer.parentGroup(), "MSArtboardGroup")) {
    //
    //    return getParentWidth(layer);
    //}

    return getParentOldWidth(layer, hScale);
};

var getParentHeightInrecursion = function (layer, vScale) {

    //if (isLayerClass(layer.parentGroup(), "MSArtboardGroup")) {
    //
    //    return getParentHeight(layer);
    //}

    return getParentOldWidth(layer, vScale);
};

/**
 * 设置图层尺寸的系列函数
 */
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
    log("scaleFrame-layer"+layer+layer.frame());
    log("scaleFrame-hScale" + hScale);
    log("scaleFrame-vScale" + vScale);
    var x = Math.round(getLeft(layer) * parseFloat(hScale));
    var y = Math.round(getTop(layer) * parseFloat(vScale));
    var w = Math.round(getWidth(layer) * parseFloat(hScale));
    var h = Math.round(getHeight(layer) * parseFloat(vScale));
    log(" "+x +" " +y + " " + w + " " + h);

    setLeft(layer, x);
    setTop(layer, y);
    setSize(layer, w, h);
    log("afterScale" + layer.frame());

    if (isLayerClass(layer, "MSBitmapLayer")) {

        //scaleBitmap (layer, x, y, w, h);
        log("8888bitmap  "+layer);
        //resizeImage (layer, w, h);
        //log("layer" + hScale);
        //return;
        return;
    }
};

var scaleOrigin = function (layer, hScale, vScale) {

    var x = getLeft(layer) * hScale;
    var y = getTop(layer) * vScale;
    setLeft(layer, x);
    setTop(layer, y);
};



//--------------------------------------//
//               Context                //
//--------------------------------------//

/**
 * 初始化插件的运行上下文
 * @param context
 */
function initContext(context) {

    doc = context.document,
        selection = context.selection,
        plugin = context.plugin,
        command = context.command,
        page = doc.currentPage(),
        artboards = page.artboards(),   // 只读
        selectedArtboard = page.currentArtboard(),
        currentLayer = (selection.count() > 0) ? selection[0] : undefined;  // 当前画板默认是用户选择的第一个画板
}

/**
 * sketch版本信息
 * @returns {Number}
 */
var getSketchVersion = function () {
    const version = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
    var versionNumber = version.stringByReplacingOccurrencesOfString_withString(".", "") + "";
    while(versionNumber.length != 3) {
        versionNumber += "0";
    }
    return parseInt(versionNumber)
};


