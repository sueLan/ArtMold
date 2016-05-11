/**
 * Created by rongyanzry on 16/3/18.
 */
@import "Exporter.js"
@import "Tweaker.js"
@import "Util.js"
@import "LayerResizingManager.js"
@import "PreprocessArtBoard.js"
@import "BizRulesUI.js"


// 属性
var kLeftMargin ="kLeftMargin",
    kRightMargin = "kRightMargin",
    kTopMargin = "kTopMargin",
    kBottomMargin = "kBottomMargin",
    kWidth = "kWidth",
    kHeight = "kHeight";
// 屏幕的scale因子比例
var kScaleRatio = "kScaleRatio";
// 缩放比例
var kWidthSizeScaleRatio = "kWidthSizeScaleRatio";
var kHeightSizeScaleRatio = "kHeightSizeScaleRatio";

// 屏幕尺寸比例
var kScreenSizeRatio = "kScreenSizeRatio";
// 是否缩放文本
var kShouldScaleText = "kShouldScaleText",
    kShouldAutoReizingVertically =  "kShouldAutoReizingVertically";
var kShouldArtBoardAccurateHeight = "kShouldArtBoardAccurateHeight";
// 用户定义的元素类型
var kLayerType = "kLayerType";
var LayerType = {
    kNone: 0,
    kText: 1,   // margin left 固定长度
    kIcon: 2,
    kNavigation: 3,
    kCell: 4,
    kBanner: 5
};


var app = NSApplication.sharedApplication(),
    doc,             // MSDocument object,
    selection,       // an NSArray of the layer(s) that are selected in the current document
    plugin,
    command,
    page,            // the current page in the current document
    artboards,       // artboards and slices on the current page
    selectedArtboard;


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


var onRun = function (context) {

    initContext(context);

    // 当前选择的画板
    page.deselectAllLayers();
    selectedArtboard.setIsSelected(true);

    // 默认选择当前画板的尺寸
    var dWidth = getWidth(selectedArtboard),
        dHeight = getHeight(selectedArtboard),
        dScale = calArtboardScale(dWidth);
    if (dWidth == 0 || dHeight == 0)
    {
        doc.showMessage("请选择有效画板");
        return;
    }

    // 获取目标画板的参数 
    var tSizes = runExporter(dWidth, dHeight, dScale);
    tSizes.reverse();
    if (tSizes.length <= 0)
    {
        doc.showMessage("请选择缩放的目标尺寸");
        return;
    }

    var maxXLeftW = getMaxLeftWidth(artboards);
    var x = maxXLeftW[0] + maxXLeftW[1];
    var y = getTop(selectedArtboard);

    for (var i = 0; i < tSizes.length; i++) {

        x += 200;
        x += (i > 0 ? tSizes[i-1][1] : 0);

        if (tSizes[i][1] == dWidth && tSizes[i][2] == dHeight && tSizes[i][3] == dScale)
        {
            doc.showMessage("目标尺寸与当前尺寸相同");
            continue;
        }

        if (tSizes[i][1] == 0 || tSizes[i][2] == 0)
        {
            doc.showMessage("目标尺寸的高度或者宽度不能为0");
            continue;
        }

        //var hScale = i > 0 ? (tSizes[i][1] / tSizes[i - 1][1]) : (tSizes[i][1] / dWidth);
        // 设计稿垂直缩放比例
        var vScale = i > 0 ? (tSizes[i][2] / tSizes[i - 1][2]) : (tSizes[i][2] / dHeight);
        // 设计稿水平缩放比例
        var hScale = calcSizeScaleRatio(i > 0 ? tSizes[i - 1][1] : dWidth, tSizes[i][1], i > 0? tSizes[i - 1][3] : dScale, tSizes[i][3]);
        // 屏幕尺寸比例
        var logicRatio = calcLogicSizeScaleRatio(i > 0 ? tSizes[i - 1][1] : dWidth, tSizes[i][1], i > 0? tSizes[i - 1][3] : dScale, tSizes[i][3])
        // 设备屏幕scale因子
        var scaleFactorRatio = i > 0 ? tSizes[i][3] / tSizes[i-1][3] : tSizes[i][3] / dScale;

        log("111hScale = " + hScale);
        log("111vScale = " + vScale);
        log("222 width:"+tSizes[i][1]);
        log("222 height:"+tSizes[i][2]);
        log("222 scale:"+tSizes[i][3]);
        log("logicRatio:"+logicRatio);
        log("selectedArtboard "+ selectedArtboard);
        var shouldArtBoardAccurateHeight = command.valueForKey_onLayer(kShouldArtBoardAccurateHeight, selectedArtboard);
        log("shouldArtBoardAccurateHeight = "+ shouldArtBoardAccurateHeight);
        vScale = shouldArtBoardAccurateHeight && shouldArtBoardAccurateHeight != 0 ? vScale : hScale;

        // 目标画板
        var artboard = createTargetArtboard([x, y], hScale, vScale, i, tSizes[i][0]);

        preProcessLayers(artboard);

        var shouldAutoReizingVertically = command.valueForKey_onLayer(kShouldAutoReizingVertically, selectedArtboard);
        log("kShouldAutoReizingVertically = "+ shouldAutoReizingVertically);
        vScale = shouldAutoReizingVertically && shouldAutoReizingVertically != 0 ? hScale : scaleFactorRatio;
        log("vscale = " +  vScale);

        // sketch特性:改变MSLayerGroup的frame,其子图层也会发生改变
        var layers = artboard.layers().array();
        for (var j = 0; j < layers.count(); j++) {

            scaleFrame(layers[j], hScale, vScale);
        }

        var shouldScaleText = command.valueForKey_onLayer(kShouldScaleText, selectedArtboard);
        var layerEnumerator = artboard.layers().array().objectEnumerator();

        var textScaleRatio = shouldScaleText && shouldScaleText != 0 ? hScale : scaleFactorRatio;
        processTextLayer(layerEnumerator, textScaleRatio);

        //
        command.setValue_forKey_onLayer(scaleFactorRatio, kScaleRatio, artboard);
        command.setValue_forKey_onLayer(hScale, kWidthSizeScaleRatio, artboard);
        command.setValue_forKey_onLayer(logicRatio,kScreenSizeRatio, artboard);
        command.setValue_forKey_onLayer(vScale, kHeightSizeScaleRatio, artboard);
    }
};


var setFixedMasks = function (context) {

    initContext(context);

    var status = getSelectedLayersMask();

    // 弹出选择框
    status = runTweaker(status[0], status[1], status[2], status[3], status[4], status[5], LayerType.kNone);

    //
    setSelectionLayersMasks(status);
};

var setBizRules = function (context) {

    initContext(context);
    if (!selectedArtboard) {
        doc.showMessage("请选择画板");
    }
    var ret = showBizRules();

    command.setValue_forKey_onLayer(ret[0], kShouldAutoReizingVertically, selectedArtboard);
    command.setValue_forKey_onLayer(ret[1], kShouldScaleText, selectedArtboard);
    command.setValue_forKey_onLayer(ret[2], kShouldArtBoardAccurateHeight, selectedArtboard);

    print("bizRules = "+ ret);
};

function getSelectedLayersMask() {

    // 遍历选中的图层,对六个状态的值单独累加
    var count = selection.count();
    if (count == 0) {
        doc.showMessage("请先选择图层");
        return;
    }

    // 数组每个元素对应FixedSizeMask中的六个状态
    var status = [0, 0, 0, 0, 0, 0];

    for (var i = 0; i < count; i++) {

        var masks = getLayerMasks(selection[i]);
        for (var j = 0; j < 6; j++)
        {
            if (i == 0)
            {
                status[j] = masks[j];
            }
            else if (status[j] != masks[j])
            {
                status[j] = -1;
            }
        }
    }
    return status;
}

//
function getLayerMasks(currentLayer) {

    if (currentLayer == undefined || currentLayer == null) return;
    var state = [];
    var topMargin = command.valueForKey_onLayer(kTopMargin, currentLayer);
    state[0] = topMargin ? topMargin : 0;
    var rightMargin = command.valueForKey_onLayer(kRightMargin, currentLayer);
    state[1] = rightMargin ? rightMargin : 0;
    var bottomMargin = command.valueForKey_onLayer(kBottomMargin, currentLayer);
    state[2] = bottomMargin ? bottomMargin : 0;
    var leftMargin = command.valueForKey_onLayer(kLeftMargin, currentLayer);
    state[3] = leftMargin ? leftMargin : 0;
    var width = command.valueForKey_onLayer(kWidth, currentLayer);
    state[4] = width ? width : 0;
    var height = command.valueForKey_onLayer(kHeight, currentLayer);
    state[5] = height ? height : 0;
    return state;
}

//
function setSelectionLayersMasks(status) {

    var widthScaleRatio = command.valueForKey_onLayer(kWidthSizeScaleRatio, selectedArtboard);
    var heightScaleRatio = command.valueForKey_onLayer(kHeightSizeScaleRatio, selectedArtboard);
    var screenRatio = command.valueForKey_onLayer(kScreenSizeRatio, selectedArtboard);
    var scaleFactorRatio = command.valueForKey_onLayer(kScaleRatio, selectedArtboard);
    log("scaleRatio : " + widthScaleRatio);
    log("scaleRatio : " + kHeightSizeScaleRatio);
    log("artboardScale : "+screenRatio);
    log("user choose status : " + status);

    var count = selection.count();
    for (var i = 0; i < count; i++) {

        var masks = getLayerMasks(selection[i]);
        for (var j = 0; j < 6; j++) {

            if (status[j] >= 0) {
                masks[j] = status[j];
            }
        }
        log(selection[i] + " setMask :" + masks);
        setLayerMasks(selection[i], masks);
        resizingLayer(selection[i], status[6], screenRatio, scaleFactorRatio, widthScaleRatio, heightScaleRatio);
    }
}

function setLayerMasks(currentLayer, state) {

    if (!currentLayer) return;
    if (!state || state.length < 6) return;
    command.setValue_forKey_onLayer(state[0], kTopMargin, currentLayer);
    command.setValue_forKey_onLayer(state[1], kRightMargin, currentLayer);
    command.setValue_forKey_onLayer(state[2], kBottomMargin, currentLayer);
    command.setValue_forKey_onLayer(state[3], kLeftMargin, currentLayer);
    command.setValue_forKey_onLayer(state[4], kWidth, currentLayer);
    command.setValue_forKey_onLayer(state[5], kHeight, currentLayer);
}
