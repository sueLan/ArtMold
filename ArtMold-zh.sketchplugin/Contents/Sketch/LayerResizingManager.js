/**
 * Created by rongyanzry on 16/4/7.
 */

@import "Script.js"

/**
 *
 * @param layer
 * @param screenRatio 屏幕尺寸比例
 * @param scaleFactorRatio 屏幕scale比例
 * @param widthScale 宽度缩放比例因子
 * @param heightScale 高度缩放比例因子
 */
function resizingLayer (layer, screenRatio, scaleFactorRatio, widthScale, heightScale) {

    var LayerType = command.valueForKey_onLayer(kLayerType, layer);

    resizingLayerWithMask(layer, screenRatio, scaleFactorRatio, widthScale, heightScale);

    //switch (layerType)
    //{
    //    case LayerType.kNone :
    //    case LayerType.kBanner:
    //    case LayerType.kCell:
    //    case LayerType.kIcon:
    //        break;
    //    case LayerType.kNavigation:
    //        updateNavigationBar(layer, screenRatio, widthScale);
    //        break;
    //    case LayerType.kText:
    //        break;
    //}
    var align = command.valueForKey_onLayer(kAlignment, layer);
    if (align == AlignmentType.AlignmentHorizontalCenter) {

        setLeft(layer, (getParentWidth(layer) - getWidth(layer)) / 2)
    } else if (align == AlignmentType.AlignmentVerticalCenter) {

        setTop(layer, (getParentHeight(layer) - getHeight(layer)) / 2)
    }
}

// 放大或缩小视图
function resizingLayerWithMask(layer, screenRatio, scaleFactorRatio, widthScale, heightScale) {

    if (layer == undefined) return;

    var masks = getLayerMasks(layer);

    var oldLeft = getOldLeft(layer, widthScale);
    var oldWidth = getOldWidth(layer, widthScale);
    var oldRight = getParentOldWidth(layer, widthScale) - oldLeft - oldWidth;

    // 1 求水平固定不变的宽度
    var fixedW = 0;
    if (masks[0] == 1) fixedW += getLeft(layer);
    if (masks[4] == 1) fixedW += getWidth(layer);
    if (masks[1] == 1) fixedW += getRight(layer);
    fixedW = Math.round(fixedW / parseFloat(widthScale, 2));
    // 2 水平缩放的比例 = oldSize / targetSize
    var hflexibleRatio = (getParentOldWidth(layer, widthScale) - fixedW) / (getParentWidth(layer) - fixedW);
    // 3 求水平自动改变尺寸的左边距和宽度
    if (masks[0] == 0) {
        // left: flexible
        setLeft(layer, oldLeft / hflexibleRatio);
        log("layeroldLeft2" + layer + "oldLeft:" + oldLeft + "ratio:"+hflexibleRatio + "oldLeft:" + getLeft(layer));
    } else if (masks[0] == 1) {
        // left: fix
        setLeft(layer, oldLeft * scaleFactorRatio);
    }

    if (!isLayerClass(layer, "MSTextLayer")) {

        if (masks[4] == 0) {
            // width:flexible
            setWidth(layer, oldWidth / hflexibleRatio);
            log("layerWidth2" + layer + "oldWidth:" + oldWidth + "ratio:"+hflexibleRatio + "width:" + getWidth(layer));
        } else if (masks[4] == 1) {

            setWidth(layer, oldWidth * scaleFactorRatio);
        }
    }

    if (masks[1] == 1) {
        // 右边固定
        var x = getParentWidth(layer) - oldRight * scaleFactorRatio - getWidth(layer);
        setLeft(layer, x);
    }
    log("fixedW1:" + layer.frame());

    //
    fixedW = 0;
    if (masks[2] == 1) fixedW += getTop(layer);
    if (masks[5] == 1) fixedW += getHeight(layer);
    if (masks[3] == 1) fixedW += getBottom(layer);
    fixedW = Math.round(fixedW / parseFloat(heightScale, 2));

    var oldTop = getOldTop(layer, heightScale);
    var oldHeight = getOldHeight(layer, heightScale);
    var oldBottom = getParentOldHeight(layer) - oldTop - oldHeight;

    var vflexibleRatio = (getParentOldHeight(layer, heightScale) - fixedW) / (getParentHeight(layer) - fixedW);

    if (masks[2] == 0) {

        setTop(layer, oldTop / vflexibleRatio);
    } else if (masks[2] == 1) {

        setTop(layer, oldTop * scaleFactorRatio);
    }

    if (!isLayerClass(layer, "MSTextLayer")) {
        if (masks[5] == 0) {

            setHeight(layer, oldHeight / vflexibleRatio);
        } else if (masks[5] == 1) {

            setHeight(layer, oldHeight * scaleFactorRatio);
        }
    }

    if (masks[3] == 1) {

        var y = getParentHeight(layer) - oldBottom * scaleFactorRatio - getHeight(layer);
        setTop(layer, y);
    }
    log("fixedW2:" + layer.frame());
}

function isLayerClass(layer, className) {

    return Boolean(layer.className() == className);
}

/**
 * 判断layer是否有祖先
 * @param layer
 * @returns {boolean}
 */
function ancestryIsGroup(layer) {

    var parent = layer.parentGroup();
    while (parent) {

        if (isLayerClass(parent, "MSLayerGroup") || isLayerClass(parent, "MSShapeGroup")) return true;
        parent = parent.parentGroup();
    }
    return false;
}

/**
 * 预处理会影响缩放的图层特性
 * @param artboard
 */
function preProcessLayers(artboard) {

    var version = getSketchVersion();
    log("version="+version);

    var childLayers = artboard.children();
    var count = childLayers.count();
    for (var i = 0; i < count; i++) {

        var layer = childLayers[i];

        // 取消group的锁定因素
        if (isLayerClass(layer, "MSLayerGroup")) {

            layer.setConstrainProportions(0);
            continue;
        }

        // 处理符号,否则,改变符号的样式会在所有画板和page中起作用
        if (version >= 350 && version < 370) {

            if (layer.isSymbol()) {

                layer.unregisterAsSymbolIfNecessary();
            }
        } else if (version >= 370) {

            if (isLayerClass(layer, "MSSymbolInstance")) {

                layer.detachByReplacingWithGroup();
            }
        }
    }
}

function processLayerGenerally(artboard, widthScale, heightScale) {

    // sketch特性:改变MSLayerGroup的frame,其子图层也会发生改变
    // 改变画板第一层MSLayerGroup的frame
    var layers = artboard.layers().array();
    for (var j = 0; j < layers.count(); j++)
    {
        scaleFrame(layers[j], widthScale, heightScale);
    }
}

function processLayers(artboard, screenRatio, scaleFactorRatio, widthScaleRatio, heightScaleRatio) {

    var childLayers = artboard.children();
    for (var i = 0; i < childLayers.count(); i++) {

        var layer = childLayers[i];

        scaleTextLayer(artboard, layer, scaleFactorRatio, widthScaleRatio);

        resizingLayer(layer, screenRatio, scaleFactorRatio, widthScaleRatio, heightScaleRatio);
    }
}

function scaleTextLayer(artboard, layer, scaleFactorRatio, widthScaleRatio) {

    if (!isLayerClass(layer, "MSTextLayer")) return;
    // TextLayer
    var shouldScaleText = command.valueForKey_onLayer(kShouldScaleText, artboard);
    var scale = shouldScaleText && shouldScaleText != 0 ? widthScaleRatio : scaleFactorRatio;

    //var x = getLeft(layer);
    //var y = getTop(layer);
    log("layer-fontSize,before:" + layer.fontSize());
    var s = layer.fontSize() * parseFloat(scale);
    layer.fontSize = Math.floor(s);
    log("layer-fontSize:" + layer.fontSize());

    // sketch中默认的行高与开发的行高不一致;用公式换算 .
    layer.lineHeight = 2 * Math.ceil(layer.fontSize() / 10) + layer.fontSize();
    //setLeft(layer, x);
    //setTop(layer, y);
}

function processTextLayer(layerLoop, scale) {

    var layer;

    while (layer = layerLoop.nextObject()) {

        if (isLayerClass(layer, "MSLayerGroup")) {
            log("enableAutomaticScaling = " + layer.enableAutomaticScaling());
            var layers = layer.layers().array(),
                layersInsideLoop = layers.objectEnumerator();
                processTextLayer(layersInsideLoop, scale);
        } else {

            log("text scale=" +scale);
            scaleTextLayer(layer, scale);
        }
    }
}


function updateLayout() {

    var scaleRatio = command.valueForKey_onLayer(kScale, selectedArtboard);
    print("scaleRatio" + ratio);
    var group = createGroup();
    for (var key in group) {

        var layers = group.key;
    }
}

// 选中的图层根据父亲节点分组
function createGroup() {

    var count = selection.count();
    var group = [[NSMutableDictionary alloc] init];
    for (var i = 0; i < count; i++)
    {
        var parentName = selection[i].parentGroup().name();
        var layers = group.parentName;
        if (!layers) {
            layers = [[NSMutableArray alloc] init];
        } else {
            [layers addObject:selection[i]];
        }
        [group setObject:layers forKey:parentName];
    }
    log(group);
    return group;
}

function updateNavigationBar(layer, logicalScaleRatio, pixelScaleRatio) {

    var layers = layer.children();
    var count = layers.count();
    log("updateNavigationBar:" + layers);
    for (var i = 0; i < count; i++) {

        if (i == count - 2) return; // children()返回的数组里包括自己
        if (isLayerClass(layers[i], "MSLayerGroup")) {

            //setLeft(layers[i], getOldLeft(layers[i], pixelScaleRatio) * logicalScaleRatio);
            setWidth(layers[i], getOldWidth(layers[i], pixelScaleRatio) * logicalScaleRatio);
            continue;
        }
        scaleTextLayer(layers[i], logicalScaleRatio);
    }

}

