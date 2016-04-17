/**
 * Created by rongyanzry on 16/4/7.
 */

//
//function processLayer(layer, hScale, vScale, textRatio) {
//
//    if (layer == undefined) return;
//    var fixedMasks = getAutoresizingConstrains(layer);
//
//    if (fixedMasks == 0 || fixedMasks == undefined || fixedMasks == null) {
//
//        scaleFrame(layer, hScale, vScale);
//    } else {
//
//        resizingLayerWithMask(layer, fixedMasks, hScale, vScale);
//    }
//}

// 放大或缩小视图
function resizingLayerWithMask(layer, sizeMask, hScale, vScale) {

    if (layer == undefined) return;
    if (sizeMask == 0 || sizeMask == undefined || sizeMask == null) return;

    // 1 求水平固定不变的宽度
    var fixedW = 0;
    if ((sizeMask & FixedSizeMask.kLeftMargin)) fixedW += getLeft(layer);
    if ((sizeMask & FixedSizeMask.kWidth)) fixedW += getWidth(layer);
    if ((sizeMask & FixedSizeMask.kRightMargin)) fixedW += getRight(layer);
    fixedW = Math.round(fixedW / parseFloat(hScale));
    // 2 水平缩放的比例 = oldSize / targetSize
    var hflexibleRatio = (getParentOldWidth(layer, hScale) - fixedW) / (getParentWidth(layer) - fixedW);
    // 3 求水平自动改变尺寸的宽度
    if ((sizeMask & FixedSizeMask.kLeftMargin) == 0) {

        setLeft(layer, getOldLeft(layer, hScale) / hflexibleRatio);
    } else {

        setLeft(layer, getOldLeft(layer, hScale));
    }

    // 4 resize frame
    if ((sizeMask & FixedSizeMask.kWidth) == 0) {

        setWidth(layer, getOldWidth(layer) / hflexibleRatio);
    } else {

        setWidth(layer, getOldWidth(layer, hScale));
    }

    //
    fixedW = 0;
    if ((sizeMask & FixedSizeMask.kTopMargin)) fixedW += getTop(layer);
    if (sizeMask & FixedSizeMask.kHeight) fixedW += getHeight(layer);
    if (sizeMask & FixedSizeMask.kBottomMargin) fixedW += getBottom(layer);
    fixedW = Math.round(fixedW / parseFloat(vScale));

    var vflexibleRatio = (getParentOldHeight(layer, vScale) - fixedW) / (getParentHeight(layer) - fixedW);

    if ((sizeMask & FixedSizeMask.kTopMargin) == 0) {

        setTop(layer, getOldTop(layer, vScale) / vflexibleRatio);
    } else {

        setTop(layer, getOldTop(layer, vScale));
    }

    if ((sizeMask & FixedSizeMask.kHeight) == 0) {

        setHeight(layer, getOldHeight(layer, vScale) / vflexibleRatio);
    } else {

        setHeight(layer, getOldHeight(layer, vScale));
    }
    return [hflexibleRatio, vflexibleRatio];
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

function unregisterSymbol(layerLoop) {

    var layer = undefined;
    while (layer = layerLoop.nextObject()) {

        if (isLayerClass(layer, "MSLayerGroup")) {

            if (layer.isSymbol()) {

                layer.unregisterAsSymbolIfNecessary();
            }
            var layers = layer.layers().array(),
                layersInsideLoop = layers.objectEnumerator();
            unregisterSymbol(layersInsideLoop);
            // loopThrough后面引用layer,为null
        }
    }
}

function processLayer(layerLoop, hScale, vScale, scaleRatio) {

    var layer = undefined;

    while (layer = layerLoop.nextObject()) {

        if (isLayerClass(layer, "MSLayerGroup")) {

            var layers = layer.layers().array(),
                layersInsideLoop = layers.objectEnumerator();
                processLayer(layersInsideLoop, hScale, vScale, scaleRatio);
        } else {

            var fixedMasks = getAutoresizingConstrains(layer);
            var scales = [hScale, vScale];   // layer实际缩放比例
            if (fixedMasks != undefined && fixedMasks != null && fixedMasks > 0) {

                scales = resizingLayerWithMask(layer, fixedMasks, hScale, vScale);
            }
            log("scale"+scales);
            // 文本字体需要手动放大
            if (isLayerClass(layer, "MSTextLayer")) {

                log("layer-fontSize,before:" + layer.fontSize());
                var hRatio = scales[0] * scaleRatio;
                var vRatio = scales[1] * scaleRatio;
                var ratio = hRatio > vRatio ? hRatio : vRatio;
                var s = layer.fontSize() * parseFloat(ratio);
                layer.fontSize = Math.floor(s);
                log("layer-fontSize:" + layer.fontSize());
            }
        }
    }
}
