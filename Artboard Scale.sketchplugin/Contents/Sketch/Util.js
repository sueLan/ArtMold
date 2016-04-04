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

var scaleBitmap = function (layer, x, y, w, h) {
    if (!isLayerClass(layer, "MSBitmapLayer")) return;
    var rawImage, parent, newLayer,
        sketchVersion = getSketchVersion();

    rawImage = (sketchVersion >= 340) ? [layer NSImage] : [[layer image] image];
    parent = [layer parentGroup];
    newLayer = (sketchVersion >= 330) ? [parent addLayerOfType: 'rectangle'] : [[parent addLayerOfType: 'rectangle'] embedInShapeGroup];
    [newLayer setName:[layer name]];

    setLeft(newLayer, x);
    setTop(newLayer, y);
    setWidth(newLayer, w);
    setHeight(newLayer, h);

    log("newLayer +" +newLayer +newLayer.frame());
    //setBitmapFill(newLayer, rawImage);
    //[parent removeLayer: layer];

    [[doc currentPage] deselectAllLayers];
    [newLayer select:true byExpandingSelection:true];
};

var resizeImage = function (layer, w, y) {
    if (!isLayerClass(layer, "MSBitmapLayer")) return;
    var sourceImage, sketchVersion = getSketchVersion();
    sourceImage = (sketchVersion >= 340) ? [layer NSImage] : [[layer image] image];
    var newSize = NSMakeSize(w, y);
    [sourceImage setScalesWhenResized:1];
    var newImage = [[NSImage alloc] initWithSize: newSize];
    [newImage lockFocus];
    [sourceImage setSize: newSize];
    [[NSGraphicsContext currentContext] setImageInterpolation:NSImageInterpolationHigh];
    [sourceImage drawAtPoint:NSZeroPoint fromRect:CGRectMake(0, 0, newSize.width, newSize.height) operation:NSCompositeCopy fraction:1.0];
    [newImage unlockFocus];
    //setBitmapFill(layer, newImage);

    log("layer.image + " + layer.image);
    var imageData = [[MSImageData alloc] initWithImage:newImage convertColorSpace:1];
    [layer setImage:imageData];
    //layer.image = imageData;
    log("layer.image + " + layer.image);
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
var  getSketchVersion = function () {
    const version = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
    var versionNumber = version.stringByReplacingOccurrencesOfString_withString(".", "") + "";
    while(versionNumber.length != 3) {
        versionNumber += "0";
    }
    return parseInt(versionNumber)
};

//--------------------------------------//
//               ArtBoard               //
//--------------------------------------//

/**
 * 生成新画版,放置新画板,并缩放画板以及其图层
 * @param origin   画板的origin坐标
 * @param hScale  hScale 水平缩放比例: 目标画板尺寸 / 原始画板尺寸
 * @param vScale  vScale 垂直缩放比例: 目标画板尺寸 / 原始画板尺寸
 * @param index   index 目标画板序数
 */
var createTargetArtboards = function (origin, hScale, vScale, index, name) {

    var action = doc.actionsController().actionWithName("MSCanvasActions");
    action.duplicate(nil);

    // 复制后,当前页面有新增的画板,我们需要把新增画板放在所有的画板的右边,
    // duplicate命令新增画板,被insert到artboards数组中selectedArtboard画板的后面
    artboards = page.artboards();

    // place and scale the new artboard
    var artboard = getNewArtboard(index, name);
    if (artboard == null || artboard == undefined) return;
    setLeft(artboard, origin[0]);
    setTop(artboard, origin[1]);
    var w = getWidth(artboard) * hScale;
    var h = getHeight(artboard) * vScale;
    setWidth(artboard, w);
    setHeight(artboard, h);

    // 递归缩放所有的group和layer
    var layerEnumerator = artboard.layers().array().objectEnumerator();
    loopThrough(layerEnumerator, hScale, vScale, function (layer) {

        var fixedMasks = getAutoresizingConstrains(layer);
        resizingLayer(layer, fixedMasks, hScale, vScale);
    });
};

/**
 * 用户找到复制后的画板
 * @param index  新画板,在用户勾选的目标画板数组的下标
 * @param name  新画板的名字
 * @returns {*}
 */
var getNewArtboard = function (index, name) {

    // 新复制的画板在artboards的位置
    var idx = 0;
    log(artboards);
    for (var i = 0; i < artboards.count(); i++) {
        log("555"+artboards[i]);
        log("555"+selectedArtboard);
        if (artboards[i] == selectedArtboard) {

            log("idx=i:"+i);
            idx = i;
            break;
        }
    }
    idx++;
    idx += parseInt(index);  // idx  +=  index; ? :加号变成字符串累加
    log("index:" + index +"idx:" + idx);
    log("artboards idx: " + idx +"count: " + artboards.count());
    if (idx >= artboards.count()) {

        doc.showMessage("出现异常,请重新尝试");
        return null;
    }

    // 新增的画板
    var artboard = artboards[idx];
    if (name) { artboard.setName(name);}
    log("9999" + artboard + " name: "+name + artboard.frame());

    return artboard;
};

/**
 * 设计页面上所有画板中位置最右边的画板的原点x轴坐标和宽度
 * @returns {*[]}
 */
var getMaxLeftWidth = function () {

    // 找到最右边的画板
    var maxX = getLeft(artboards[0]), w = getWidth(artboards[0]);
    for (var j = 0; j < artboards.count(); j++) {

        var x = getLeft(artboards[j]);
        if (x > maxX) {

            maxX = x;
            w = getWidth(artboards[j]);
        }
    }

    log("maxX:" +maxX);
    log("w:" +w);
    return [Math.round(maxX), w];
};