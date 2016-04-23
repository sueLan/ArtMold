/**
 * Created by rongyanzry on 16/3/18.
 */
@import "Exporter.js"
@import "Tweaker.js"
@import "Util.js"
@import "LayerResizingManager.js"
@import "PreprocessArtBoard.js"

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
        dScale = calArtboardScale(dWidth);
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

    var maxXLeftW = getMaxLeftWidth(artboards);
    var x = maxXLeftW[0] + maxXLeftW[1];
    var y = getTop(selectedArtboard);

    for (var i = 0; i < tSizes.length; i++) {

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
        log("222"+tSizes[i][1]);
        log("222"+tSizes[i][2]);
        log("222"+tSizes[i][3]);
        //var targetSize = [tSizes[i][1], tSizes[i][2],tSizes[i][3]];
        var scaleRatio = dScale / tSizes[i][3];
        //log("22" + targetSize);

        var artboard = createTargetArtboard([x, y], hScale, vScale, i, tSizes[i][0]);

        var layerEnumerator = artboard.layers().array().objectEnumerator();
        // 处理符号
        var version = getSketchVersion();
        log("version="+version);
        if (version >= 350 && version < 370) {

            unregisterSymbol(layerEnumerator);
        }

        // sketch特性:改变MSLayerGroup的frame,其子图层也会发生改变
        var layers = artboard.layers().array();
        for (var j = 0; j < layers.count(); j++) {

            log("j" + j);
            scaleFrame(layers[j], hScale, vScale);
        }
        //log("1111size"+tSizes[i]); print undefined
        //var textRatio = caleTextScaleRatio([dWidth, dHeight, dScale], targetSize);

        processLayer(layerEnumerator, hScale, vScale, scaleRatio);
    }
};


var setFixedMasks = function (context) {

    initContext(context);

    // 数组每个元素对应FixedSizeMask中的六个状态
    var status = [0, 0, 0, 0, 0, 0];
    var isAllBitmap = 1;

    // 遍历选中的图层,对六个状态的值单独累加
    var count = selection.count();
    if (count == 0) {
        doc.showMessage("请先选择图层");
        return;
    }
    for (var i = 0; i < count; i++) {

        log(selection[i]);
        if (!isLayerClass(selection[i], "MSBitmapLayer")) isAllBitmap = 0;

        var masks = getAutoresizingConstrains (selection[i]);
        log("masks:" + masks);
        for (var j = 0; j < 6; j++) {
            var mask = (masks & (FixedSizeMask.kLeftMargin << j)) ? 1 : 0;
            if (i == 0)
            {
                status[j] = mask;
            }
            else if (status[j] != mask)
            {
                status[j] = -1;
            }
        }
    }

    log("status:"+status);

    // 位图默认以宽度为基准缩放
    if (isAllBitmap) {

        if (status[4] && status[5]) {

            status[5] = -2;
        }
    }
    // 弹出选择框
    // debug
    //status = runTweaker(-3, -3, -3, -3, -3, -3);

    status = runTweaker(status[0], status[1], status[2], status[3], status[4], status[5]);

    log("user choose status :" + status);
    for (var i = 0; i < count; i++) {

        var masks = getAutoresizingConstrains(selection[i]);
        for (var j = 0; j < 6; j++) {

            if (status[j] > 0) {
                masks |= (FixedSizeMask.kLeftMargin << j);
            }
            else if (status[j] == 0) {
                masks &= ~(FixedSizeMask.kLeftMargin << j);
            }
        }
        log(selection[i] + " setMask :" + masks);
        setAutoresizingConstrains(selection[i], masks);
    };
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



