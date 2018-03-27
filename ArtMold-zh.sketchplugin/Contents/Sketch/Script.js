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

//
var kAlignment = "kAlignment";

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
    var sWidth = getWidth(selectedArtboard),
        sHeight = getHeight(selectedArtboard),
        sScale = calArtboardScale(sWidth);
    if (sWidth == 0 || sHeight == 0)
    {
        doc.showMessage("请选择有效画板");
        return;
    }

    // 获取目标画板的参数 
    var tArtboardSizes = runExporter(sWidth, sHeight, sScale);
    tArtboardSizes.reverse();
    if (tArtboardSizes.length <= 0)
    {
        doc.showMessage("请选择缩放的目标尺寸");
        return;
    }

    var maxXLeftW = getMaxLeftWidth(artboards);
    var x = maxXLeftW[0] + maxXLeftW[1];
    var y = getTop(selectedArtboard);

    for (var i = 0; i < tArtboardSizes.length; i++) {

        x += 200;
        x += (i > 0 ? tArtboardSizes[i-1][1] : 0);

        if (tArtboardSizes[i][1] == sWidth && tArtboardSizes[i][2] == sHeight && tArtboardSizes[i][3] == sScale)
        {
            doc.showMessage("目标尺寸与当前尺寸相同");
            continue;
        }

        if (tArtboardSizes[i][1] == 0 || tArtboardSizes[i][2] == 0)
        {
            doc.showMessage("目标尺寸的高度或者宽度不能为0");
            continue;
        }

        /**计算比例因子**/
        //var hScale = i > 0 ? (tSizes[i][1] / tSizes[i - 1][1]) : (tSizes[i][1] / dWidth);
        // 设计稿垂直缩放比例
        var heightScale = i > 0 ? (tArtboardSizes[i][2] / tArtboardSizes[i - 1][2]) : (tArtboardSizes[i][2] / sHeight);
        // 设计稿水平缩放比例
        var widthScale = calcSizeScaleRatio(i > 0 ? tArtboardSizes[i - 1][1] : sWidth, tArtboardSizes[i][1], i > 0? tArtboardSizes[i - 1][3] : sScale, tArtboardSizes[i][3]);
        // 屏幕尺寸比例
        var screenSizeRatio = calcLogicSizeScaleRatio(i > 0 ? tArtboardSizes[i - 1][1] : sWidth, tArtboardSizes[i][1], i > 0? tArtboardSizes[i - 1][3] : sScale, tArtboardSizes[i][3])
        // 设备屏幕scale因子
        var scaleFactorRatio = i > 0 ? tArtboardSizes[i][3] / tArtboardSizes[i-1][3] : tArtboardSizes[i][3] / sScale;

        log("111hScale = " + widthScale);
        log("111vScale = " + heightScale);
        log("222 width:"+tArtboardSizes[i][1]);
        log("222 height:"+tArtboardSizes[i][2]);
        log("222 scale:"+tArtboardSizes[i][3]);
        log("logicRatio:"+screenSizeRatio);
        log("selectedArtboard "+ selectedArtboard);

        var shouldArtBoardAccurateHeight = command.valueForKey_onLayer(kShouldArtBoardAccurateHeight, selectedArtboard);
        log("shouldArtBoardAccurateHeight = "+ shouldArtBoardAccurateHeight);
        heightScale = shouldArtBoardAccurateHeight && shouldArtBoardAccurateHeight != 0 ? heightScale : widthScale;

        /**生成目标画板**/
        var artboard = createTargetArtboard([x, y], widthScale, heightScale, i, tArtboardSizes[i][0]);

        var shouldAutoReizingVertically = command.valueForKey_onLayer(kShouldAutoReizingVertically, selectedArtboard);
        log("kShouldAutoReizingVertically = "+ shouldAutoReizingVertically);
        heightScale = shouldAutoReizingVertically && shouldAutoReizingVertically != 0 ? widthScale : scaleFactorRatio;
        log("vscale = " +  heightScale);

        /**预处理**/
        preProcessLayers(artboard);

        /**一般规则处理**/
        processLayerGenerally(artboard, widthScale, heightScale);

        /**根据用户定义的图层属性处理**/
        processLayers(artboard, screenSizeRatio, scaleFactorRatio, widthScale, heightScale);
    }
};


var setFixedMasks = function (context) {

    initContext(context);

    var status = getSelectedLayersState();
    doc.showMessage("before" + status);
    // 弹出选择框
    status = runTweaker(status[0], status[1], status[2], status[3], status[4], status[5], status[6], status[7]);

    //doc.showMessage("after" + status);
    //
    setSelectionLayersStatus(status);
};

var setBizRules = function (context) {

    initContext(context);
    if (!selectedArtboard) {
        doc.showMessage("请选择画板");
    }
    var kVertically = command.valueForKey_onLayer(kShouldAutoReizingVertically, selectedArtboard);
    //kVertically = kVertically ? kVertically : 0;
    var kScaleText = command.valueForKey_onLayer(kShouldScaleText, selectedArtboard);
    //kScaleText = kScaleText ? kVertically : 0;
    var kHeight = command.valueForKey_onLayer(kShouldArtBoardAccurateHeight, selectedArtboard);
    //kHeight = kHeight ? kHeight : 0;

    var ret = showBizRules(kVertically, kScaleText, kHeight);

    command.setValue_forKey_onLayer(ret[0], kShouldAutoReizingVertically, selectedArtboard);
    command.setValue_forKey_onLayer(ret[1], kShouldScaleText, selectedArtboard);
    command.setValue_forKey_onLayer(ret[2], kShouldArtBoardAccurateHeight, selectedArtboard);

    //doc.showMessage("bizRules = "+ ret);
};

/**
 * 从一系列的图层中取出mask, 和图层类型
 * @returns {number[]}
 */
function getSelectedLayersState() {

    // 遍历选中的图层,对六个状态的值单独累加
    var count = selection.count();
    if (count == 0) {
        doc.showMessage("请先选择图层");
        return;
    }

    // 数组每个元素对应FixedSizeMask中的六个状态, 以及图层类型, 对齐居中方向
    var status = [0, 0, 0, 0, 0, 0, 0, 0];
    var layerType;
    var masks;
    var hAlign;
    for (var i = 0; i < count; i++) {

        // mask
        masks = getLayerMasks(selection[i]);
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

        // 图层类型
        layerType = command.valueForKey_onLayer(kLayerType, selection[i]);
        hAlign = command.valueForKey_onLayer(kAlignment, selection[i]);
        if (i == 0)
        {
            status[6] = layerType;
            status[7] = hAlign;
        }
        else if (status[6] != layerType)
        {
            status[6] = -1;
        }
        else if (status[7] != hAlign)
        {
            status[7] = -1;
        }
    }
    return status;
}

/**
 * 从Layer中取出mask
 * @param currentLayer
 * @returns {*}
 */
function getLayerMasks(currentLayer) {

    if (currentLayer == undefined || currentLayer == null) return;
    var state = [];
    var leftMargin = command.valueForKey_onLayer(kLeftMargin, currentLayer);
    state[0] = leftMargin ? leftMargin : 0;
    var rightMargin = command.valueForKey_onLayer(kRightMargin, currentLayer);
    state[1] = rightMargin ? rightMargin : 0;
    var topMargin = command.valueForKey_onLayer(kTopMargin, currentLayer);
    state[2] = topMargin ? topMargin : 0;
    var bottomMargin = command.valueForKey_onLayer(kBottomMargin, currentLayer);
    state[3] = bottomMargin ? bottomMargin : 0;
    var width = command.valueForKey_onLayer(kWidth, currentLayer);
    state[4] = width ? width : 0;
    var height = command.valueForKey_onLayer(kHeight, currentLayer);
    state[5] = height ? height : 0;
    //doc.showMessage("state-layer"+state);
    return state;
}

/**
 * 存储一个数组的图层的mask 和 状态
 * @param status
 */
function setSelectionLayersStatus(status) {

    log("user choose status : " + status);

    var count = selection.count();
    for (var i = 0; i < count; i++) {

        var masks = getLayerMasks(selection[i]);
        for (var j = 0; j < 6; j++) {

            if (status[j] >= 0) {
                masks[j] = status[j];
            }
        }
        //log(selection[i] + " setMask :" + masks);
        doc.showMessage("mask:" + masks);
        // 存储
        setLayerMasks(selection[i], masks);
        command.setValue_forKey_onLayer(status[6], kLayerType, selection[i]);
        command.setValue_forKey_onLayer(status[7], kAlignment, selection[i]);
    }
}

/**
 * 存储 mask
 * @param currentLayer
 * @param state
 */
function setLayerMasks(currentLayer, state) {

    if (!currentLayer) return;
    if (!state || state.length < 6) return;
    command.setValue_forKey_onLayer(state[0], kLeftMargin, currentLayer);
    command.setValue_forKey_onLayer(state[1], kRightMargin, currentLayer);
    command.setValue_forKey_onLayer(state[2], kTopMargin, currentLayer);
    command.setValue_forKey_onLayer(state[3], kBottomMargin, currentLayer);
    command.setValue_forKey_onLayer(state[4], kWidth, currentLayer);
    command.setValue_forKey_onLayer(state[5], kHeight, currentLayer);
}
