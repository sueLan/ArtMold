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

var app = NSApplication.sharedApplication(),
    doc,             // MSDocument object,
    selection,       // an NSArray of the layer(s) that are selected in the current document
    plugin,
    command,
    page,            // the current page in the current document
    artboards,       // artboards and slices on the current page
    selectedArtboard;


var onRun = function (context) {

    initContext(context);

    // 当前选择的画板
    page.deselectAllLayers();
    selectedArtboard.setIsSelected(true);

    // 默认选择当前画板的尺寸
    var dWidth = getWidth(selectedArtboard),
        dHeight = getHeight(selectedArtboard),
        dScale = 2;
    if (dWidth == 0 || dHeight == 0) {

        doc.showMessage("请选择有效画板");
        return;
    }

    // 获取目标画板的参数 
    var tSizes = runExporter(dWidth, dHeight, dScale);
    tSizes.reverse();
    if (tSizes.length <= 0) {

        doc.showMessage("请选择缩放的目标尺寸");
        return;
    }

    var maxXLeftW = getMaxLeftWidth();
    var x = maxXLeftW[0] + maxXLeftW[1];
    var y = getTop(selectedArtboard);

    for (var i in tSizes) {
        x += 200;
        x += (i > 0 ? tSizes[i-1][1] : 0);

        if (tSizes[i][1] == dWidth && tSizes[i][2] == dHeight && tSizes[i][3] == dScale) {

            doc.showMessage("目标尺寸与当前尺寸相同");
            continue;
        }

        if (tSizes[i][1] == 0 || tSizes[i][2] == 0) {

            doc.showMessage("目标尺寸的高度或者宽度不能为0");
            continue;
        }

        var hScale = i > 0 ? (tSizes[i][1] / tSizes[i - 1][1]) : (tSizes[i][1] / dWidth);
        var vScale = i > 0 ? (tSizes[i][2] / tSizes[i - 1][2]) : (tSizes[i][2] / dHeight);
        log("111hScale = " + hScale);
        log("111vScale = " + vScale);

        createTargetArtboards([x, y], hScale, vScale, i, tSizes[i][0]);
    }
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
    if ((sizeMask & FixedSizeMask.kRightMargin)) fixedW += getRightInRecursion(layer, hScale);

    // 2 水平缩放的比例
    var flexibleRatio = (getParentWidthInrecursion(layer, hScale) - fixedW) / (getParentWidth(layer) - fixedW);
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
    if (sizeMask & FixedSizeMask.kBottomMargin) fixedW += getBottomInrecursion(layer, vScale);

    flexibleRatio = (getParentHeightInrecursion(layer, vScale) - fixedW) / (getParentHeight(layer) - fixedW);

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

    var layer;
    while (layer = layerLoop.nextObject()) {

        if (isLayerClass(layer, "MSLayerGroup") || isLayerClass(layer, "MSShapeGroup")) {

            // 组调高宽,sketch自动调节组内元素的高宽,但是高宽,不能改变
            scaleFrame(layer, hScale, vScale);
            //var layers = layer.layers().array(),
                //layersInsideLoop = layers.objectEnumerator();
            //loopThrough(layersInsideLoop, hScale, vScale, callback);
        } else {

            log("777"+layer + layer.frame());
            callback(layer);
            log("7778"+layer + layer.frame());
        }
    }

    //var layers = artboard.children();
    //log ("bbb" + layers);
    //
    //for (var i = 0; i < layers.count(); i++) {
    //    var layer = layers[i];
    //    log("bbb" + layer);
    //    if (hasGroupAncestry(layer) && !isLayerClass(layer, "MSTextLayer")) return;
    //
    //    if (isLayerClass(layer, "MSLayerGroup") || isLayerClass(layer, "MSShapeGroup")) {
    //
    //        // 组调高宽,sketch自动调节组内元素的高宽,但是高宽,不能改变文本子元素
    //        log("666777"+layer + layer.frame());
    //        scaleFrame(layer, hScale, vScale);
    //        log("6667778"+layer + layer.frame());
    //
    //        //var layers = layer.layers().array(),
    //        //layersInsideLoop = layers.objectEnumerator();
    //        //loopThrough(layersInsideLoop, hScale, vScale, callback);
    //    } else {
    //
    //        log("777"+layer + layer.frame());
    //        callback(layer);
    //        log("7778"+layer + layer.frame());
    //    }
    //}
}

var isLayerClass = function (layer, className) {

    return Boolean(layer.className() == className);
};

//
var hasGroupAncestry = function (layer) {

    var parent = layer.parentGroup();
    while (parent) {

        if (isLayerClass(parent, "MSLayerGroup") || isLayerClass(parent, "MSShapeGroup")) return true;
        parent = parent.parentGroup();
    }
   return false;
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
