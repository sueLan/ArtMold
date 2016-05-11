/**
 * Created by rongyanzry on 16/4/7.
 */


/**
 * 生成新画版,放置新画板,并缩放画板以及其图层
 * @param origin   画板的origin坐标
 * @param hScale  hScale 水平缩放比例: 目标画板尺寸 / 原始画板尺寸
 * @param vScale  vScale 垂直缩放比例: 目标画板尺寸 / 原始画板尺寸
 * @param index   index 目标画板序数
 */
function createTargetArtboard(origin, hScale, vScale, index, name) {

    var action = doc.actionsController().actionWithName("MSCanvasActions");
    action.duplicate(nil);

    // 复制后,当前页面有新增的画板,我们需要把新增画板放在所有的画板的右边,
    // duplicate命令新增画板,被insert到artboards数组中selectedArtboard画板的后面
    artboards = page.artboards();

    var artboard = getNewArtboard(index, name);
    if (artboard == null || artboard == undefined) return;
    setLeft(artboard, origin[0]);
    setTop(artboard, origin[1]);
    var w = getWidth(artboard) * hScale;
    var h = getHeight(artboard) * vScale;
    setWidth(artboard, w);
    setHeight(artboard, h);

    return artboard;
};

/**
 * 用户找到复制后的画板
 * @param index  新画板,在用户勾选的目标画板数组的下标
 * @param name  新画板的名字
 * @returns {*}
 */
function getNewArtboard(index, name) {

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
}

/**
 * 设计页面上所有画板中位置最右边的画板的原点x轴坐标和宽度
 * @returns {*[]}
 */
function getMaxLeftWidth(artboards) {

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
}

// todo
function calArtboardScale (width) {

    if (width === 320) return 1;
    if (width === 640 || width === 750) return 2;
    return 3;
}
//
//function caleTextScaleRatio (sourceSize, targetSize) {
//
//    log("sourceSize" + sourceSize);
//    log("targetSize" + targetSize)
//    var sPointWidth = sourceSize[0] / sourceSize[2];
//    var sPointHeight =  sourceSize[1] / sourceSize[2];
//
//    var tPointWidth = targetSize[0] / targetSize[2];
//    var tPointHeight = targetSize[1] / targetSize[2];
//
//    var hRatio = tPointWidth / sPointWidth;
//    var vRatio = tPointHeight / sPointHeight;
//    log("textH Ratio:" + hRatio);
//    log("textW Ratio:" + vRatio);
//    return (hRatio > vRatio) ? hRatio : vRatio;
//}
