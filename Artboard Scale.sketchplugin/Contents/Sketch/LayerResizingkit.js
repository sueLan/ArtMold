/**
 * Created by rongyanzry on 16/4/7.
 */


function resizingLayer(layer, sizeMask, hScale, vScale) {

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
}

// 放大或缩小视图
function resizingLayerWithMask(layer, sizeMask, hScale, vScale) {

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
}



function loopThrough(layerLoop, hScale, vScale, callback) {

    var layer;
    while (layer = layerLoop.nextObject()) {

        if (isLayerClass(layer, "MSLayerGroup") || isLayerClass(layer, "MSShapeGroup")) {

            // 组调高宽,sketch自动调节组内元素的高宽,但是高宽,不能改变
            scaleFrame(layer, hScale, vScale);
            //var layers = layer.layers().array(),
            //layersInsideLoop = layers.objectEnumerator();
            //loopThrough(layersInsideLoop, hScale, vScale, hasParentGroup, callback);
        } else {

            //if (hasParentGroup && !isLayerClass(layer, "MSTextLayer")) return;
            //if (hasParentGroup && isLayerClass(layer, "MSTextLayer")) {
            //
            //    log("555777"+layer + layer.frame());
            //    callback(layer);
            //    log("5557778"+layer + layer.frame());

            //} else {
            log("777"+layer + layer.frame());
            callback(layer);
            log("7778"+layer + layer.frame());
            //}
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
