/**
 * Created by rongyanzry on 16/3/18.
 */
@import "Exporter.js"
@import "Tweaker.js"
@import "Util.js"

// var kScale = 1.5,
var kAutoresizingMask = "kAutoresizingMask";

var FixedSizeMask = {
    kLeftMargin: 1,   // margin left 固定长度
    kRightMargin: 1 << 1,
    kTopMargin: 1 << 2,
    kBottomMargin: 1 << 3,
    kWidth: 1 << 4,
    kHeight: 1 << 5
};

//--------------------------------------//
//               artboard               //
//--------------------------------------//
var onRun = function (context) {

    initContext(context);

    // 当前选择的画板
    page.deselectAllLayers();
    selectedArtboard.setIsSelected(true);

    // 默认选择当前画板的尺寸
    var dWidth = getWidth(selectedArtboard),
        dHeight = getHeight(selectedArtboard),
        dScale = 2;
    if (dWidth == 0 || dHeight == 0) return;
    // 获取目标画板的参数 
    var tSizes = runExporter(dWidth, dHeight, dScale);
    tSizes.reverse();
    var x = getLeft(selectedArtboard);
    var y = getTop(selectedArtboard);

    for (var i in tSizes) {
        x += 200;
        x += (i > 0 ? tSizes[i-1][1] : dWidth);

        if (tSizes[i][1] == dWidth && tSizes[i][2] == dHeight && tSizes[i][3] == dScale) return;
        if (tSizes[i][1] == 0 || tSizes[i][2] == 0) return;

        var hScale = i > 0 ? (tSizes[i][1] / tSizes[i - 1][1]) : (tSizes[i][1] / dWidth);
        var vScale = i > 0 ? (tSizes[i][2] / tSizes[i - 1][2]) : (tSizes[i][2] / dHeight);

        createTargetArtboards([x, y], hScale, vScale);
    }
};


/**
 * 生成新画版
 * @param origin   画板的origin坐标
 * @param hScale  hScale 水平缩放比例: 目标画板尺寸 / 原始画板尺寸
 * @param vScale  vScale 垂直缩放比例: 目标画板尺寸 / 原始画板尺寸
 */
var createTargetArtboards = function (origin, hScale, vScale) {

    // MSCanvasActions
    var action = doc.actionsController().actionWithName("MSCanvasActions");
    // 默认复制artboards中最后一个画板
    action.duplicate(nil);

    // 复制后,当前页面有新增的画板
    artboards = page.artboards();
    artboard = artboards.count() > 0 ? artboards[artboards.count() - 1] : undefined;

    // place and scale the new artboard
    setLeft(artboard, origin[0]);
    setTop(artboard, origin[1]);
    var w = getWidth(artboard) * hScale;
    var h = getHeight(artboard) * vScale;
    setWidth(artboard, w);
    setHeight(artboard, h);

    var layerEnumerator = artboard.layers().array().objectEnumerator();
    loopThrough(layerEnumerator, hScale, vScale, function (layer) {

        var fixedMasks = getAutoresizingConstrains(layer);
        resizingLayer(layer, fixedMasks, hScale, vScale);
    });
};

var setFixedMasks = function (context) {

    initContext(context);

    // 数组每个元素对应FixedSizeMask中的六个状态
    var status = [0, 0, 0, 0, 0, 0];

    // 遍历选中的图层,对六个状态的值单独累加
    var count = selection.count();
    for (var i = 0; i < count; i++) {

        log(selection[i]);
        var masks = getAutoresizingConstrains (selection[i]);
        log("masks:" + masks);
        for (var j = 0; j < 6; j++) {

            status[j] += masks & (FixedSizeMask.kLeftMargin << j);
        }
    }

    // 判断六个状态
    for (var j = 0; j < 6; j++) {

        status[j] = status[j] == 0 ? 0 : (status[j] / count == (FixedSizeMask.kLeftMargin << j)) ? 1 : -1;
    }
    log("status:"+status);

    // 弹出选择框
    status = runTweaker(status[0], status[1], status[2], status[3], status[4], status[5]);

    log("user choose status :" + status);
    for (var i = 0; i < count; i++) {

        var m = 0;
        for (var j = 0; j < 6; j++) {

            if (status[j] == 1) {

                m |= (FixedSizeMask.kLeftMargin << j);
            }
        }
        log(selection[i] + " setMask :" + m);
        setAutoresizingConstrains(selection[i], m);
    };
};

//--------------------------------------//
//              Layer Resizing          //
//--------------------------------------//
var resizingLayer = function (layer, sizeMask, hScale, vScale) {

    if (layer == undefined) return;

    // 全部缩放
    if (sizeMask == 0 || sizeMask == undefined || sizeMask == null) {

        scaleFrame(layer, hScale, vScale);
    } else {

        resizingLayerWithMask(layer, sizeMask, hScale, vScale);
    }

    // 文本字体需要手动放大
    if (isLayerClass(layer, "MSTextLayer")) {
        var s = layer.fontSize() * (hScale > vScale ? vScale : hScale);
        layer.fontSize = Math.floor(s);
    }
};

// 放大或缩小视图
var resizingLayerWithMask = function (layer, sizeMask, hScale, vScale) {

    if (layer == undefined) return;
    if (sizeMask == 0 || sizeMask == undefined || sizeMask == null) return;

    // 1 求水平固定不变的宽度
    var fixedW = 0;
    if ((sizeMask & FixedSizeMask.kLeftMargin)) fixedW += getLeft(layer);
    if ((sizeMask & FixedSizeMask.kWidth)) fixedW += getWidth(layer);
    if ((sizeMask & FixedSizeMask.kRightMargin)) fixedW += getOldRight(layer, hScale);

    // 2 水平缩放的比例
    var flexibleRatio = (getParentOldWidth(layer, hScale) - fixedW) / (getParentWidth(layer) - fixedW);
    // 3 求水平自动改变尺寸的宽度
    if ((sizeMask & FixedSizeMask.kLeftMargin) == 0) {

        setLeft(layer, getLeft(layer) / flexibleRatio);
    }

    // 4 resize frame
    if ((sizeMask & FixedSizeMask.kWidth) == 0) {

        setWidth(layer, getWidth(layer) / flexibleRatio);
    }

    //
    fixedW = 0;
    if ((sizeMask & FixedSizeMask.kTopMargin)) fixedW += getTop(layer);
    if (sizeMask & FixedSizeMask.kHeight) fixedW += getHeight(layer);
    if (sizeMask & FixedSizeMask.kBottomMargin) fixedW += getOldBottom(layer, vScale);

    flexibleRatio = (getParentOldHeight(layer, vScale) - fixedW) / (getParentHeight(layer) - fixedW);

    if ((sizeMask & FixedSizeMask.kTopMargin) == 0) {

        setTop(layer, getTop(layer) / flexibleRatio);
    }

    if ((sizeMask & FixedSizeMask.kHeight) == 0) {

        setHeight(layer, getHeight(layer) / flexibleRatio);
    }
};



//--------------------------------------//
//                Layers                //
//--------------------------------------//
function loopThrough(layerLoop, hScale, vScale, callback) {

    while (layer = layerLoop.nextObject()) {

        //if (isLayerClass(layer, "MSShapeGroup") || isLayerClass(layer, "MSLayerGroup")) {
        if (isLayerClass(layer, "MSLayerGroup")) {
            // MSLayerGroup组的区域根据子视图适配,只调origin位置,不调高宽;
            scaleOrigin(layer, hScale, vScale);
            var layers = layer.layers().array(),
                layersInsideLoop = layers.objectEnumerator();
            loopThrough(layersInsideLoop, hScale, vScale, callback);
            // loopThrough后面引用layer,为null
        } else {
            callback(layer)
        }
    }
}

function maxSizeOfSubLayer(layers) {

    var layersInsideLoop = layers.objectEnumerator(),
        maxX = 0,
        maxY = 0,
        maxWidth = 0,
        maxHeight = 0;
    while (sublayer = layersInsideLoop.nextObject()) {
        maxX = maxX > getLeft(sublayer) ? maxX : getLeft(sublayer);
        maxY = maxY > getTop(sublayer) ? maxY : getTop(sublayer);
        maxWidth = maxWidth > getWidth(sublayer) ? maxWidth : getWidth(sublayer);
        maxHeight = maxHeight > getHeight(sublayer) ? maxHeight : getHeight(sublayer);
    }
    return [maxX, maxY, maxWidth, maxHeight];
}

var isLayerClass = function (layer, className) {

    return Boolean(layer.className() == className);
};


// 将mask存在layer中
var setAutoresizingConstrains = function (currentLayer, sizeMask) {

    if (currentLayer == undefined || currentLayer == null) return;
    command.setValue_forKey_onLayer(sizeMask, kAutoresizingMask, currentLayer);
};

//
var getAutoresizingConstrains = function (currentLayer) {

    if (currentLayer == undefined || currentLayer == null) return;
    var v = command.valueForKey_onLayer(kAutoresizingMask, currentLayer);
    return v ? v : 0;
};

//--------------------------------------//
//               Context                //
//--------------------------------------//
var app = NSApplication.sharedApplication(),
    doc,             // MSDocument object,
    selection,       // an NSArray of the layer(s) that are selected in the current document
    plugin,
    command,
    page,            // the current page in the current document
    artboards,       // artboards and slices on the current page
    selectedArtboard;

function initContext(context) {

    doc = context.document,
        selection = context.selection,
        plugin = context.plugin,
        command = context.command,
        page = doc.currentPage(),
        artboards = page.artboards(),
        selectedArtboard = page.currentArtboard(),
        currentLayer = (selection.count() > 0) ? selection[0] : undefined;  // 当前画板默认是用户选择的第一个画板
    //log("------------initContext-----------");
    //log(doc);
    //log(selection);
    //log(page);
    //log(artboards);
    //log(artboards.count());
    //log(selectedArtboard);
    //log(currentLayer);
}



