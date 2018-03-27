@import "Script.js"

var LayerType = {
    kNone: 0,
    kText: 1,   // margin left 固定长度
    kIcon: 2,
    kNavigation: 3,
    kCell: 4,
    kBanner: 5
};

var AlignmentType = {
    AlignmentVerticalCenter: 1,
    AlignmentHorizontalCenter: 2
};


// 参数：图层类型和六项状态，0 = Flexible, 1 = Fixed, -1 = Mixed; 对于wState和hState还有 2 = apsectRatioFix,宽高比固定
// 返回：设定的六项状态数组和图层类型，0 = Flexible, 1 = Fixed, -1 = NoChange,
function runTweaker( lState, rState, tState, bState, wState, hState, kLayerType, kAlign)
{

    // MSBitmapLayer有个特殊属性:高宽比例固定.UI视图限制选择:只能选择宽或者高缩放,另一边会随之改变
    //log("134"+layer);
    //var isBitmapLayer =  isLayerClass(layer, "MSBitmapLayer");

    //
    var w = 200, h = 200;
    var view = [[NSView alloc] initWithFrame:NSMakeRect(0, 0, w*2+20, h + 150)];
    //view.wantsLayer = 1;
    //[[view layer] setBackgroundColor:[[NSColor redColor] CGColor]];

    // 添加编辑框
    var frame = NSMakeRect(0, 0, w, h);
    addBox(frame, [NSColor whiteColor]);
    addBox(CGRectInset(frame, w/4, h/4), [NSColor colorWithDeviceWhite:0.98 alpha:1]);

    // 添加预览框
    // frame.origin.x += w + 20;
    // var outer = addBox(frame, [NSColor whiteColor]);
    // var inner = addBox(CGRectInset(frame, w/4, h/4), [NSColor colorWithDeviceWhite:0.98 alpha:1]);

    // 添加按钮
    var lButton = addButton(lState, 0           , h/2 - h/16    , w/4, h/8);
    var rButton = addButton(rState, w*3/4       , h/2 - h/16    , w/4, h/8);
    var tButton = addButton(tState, w/2 - w/16  , h*3/4 - 1     , w/8, h/4);
    var bButton = addButton(bState, w/2 - w/16  , 0             , w/8, h/4);
    var wButton = addSideButton(wState, w/4         , h/2 - h/16    , w/2, h/8);
    var hButton = addSideButton(hState, w/2 - w/16  , h/4           , w/8, h/2);

    // 添加选择框
    var iconButton = addChekckButton("Icon"     , w + 20    ,h - 30   , 80, 20);
    var textButton = addChekckButton("Text"     , w + 20    ,h - 30*2 , 80, 20);
    var navButton = addChekckButton("Navigation", w + 20    ,h - 30*3 , 80, 20);
    var cellButton = addChekckButton("Cell"     , w + 20    ,h - 30*4 , 80, 20);
    var bannerButton = addChekckButton("Banner" , w + 20    ,h - 30*5 , 80, 20);

    // Alignment
    var alignLeft = addChekckButton("Alignment Left"     , w + 100    ,h - 30   , 150, 20);
    var horizontalCenter = addChekckButton("Horizontal Center" , w + 100    ,h - 30*2 , 150, 20);
    var alignRight = addChekckButton("Alignment Right"   , w + 100    ,h - 30*3 , 150, 20);
    var alignTop = addChekckButton("Alignment Top"     , w + 100    ,h - 30*4 , 150, 20);
    var verticalCenter = addChekckButton("Vertical Center" , w + 100    ,h - 30*5 , 150, 20);
    var alignBottom = addChekckButton("Alignment Bottom" , w + 100    ,h - 30*6 , 150, 20);

    //doc.showMessage("l = "+lState+" r ="+rState + " "+tState + " " + bState +" ");
    setCheckButtonTargetFunction();

    // 选组框状态
    setCheckbuttonState();

    // 说明文本
    addDescribleView(": 尺寸自动缩放",   0, 0, h + 120, 100, 15);
    addDescribleView(": 2X到2X设备尺寸固定, 2X到3X设备尺寸会乘以1.5",  1, 0, h + 90 , 100, 15);
    addDescribleView(": 高宽比例固定,缩放时高随宽变,或宽随高变",   2,    0,h+60    , 100, 15);
    addDescribleView(": 所选择的所有图层缩放属性不一致",    -1,    0, h+30   , 100, 15 );

    // 显示对话框
    var alertWindow = COSAlertWindow.new();
    alertWindow.addButtonWithTitle(@"OK");
    alertWindow.addButtonWithTitle(@"cancel");
    alertWindow.setMessageText(@"编辑缩放属性");
    alertWindow.setInformativeText(@"请操作选择图层缩放或固定尺寸");
    alertWindow.setAccessoryView(view); // 不用 addAccessoryView，否则宽度强制被固定为300
    if (alertWindow.runModal() != "1000")
    {
        return [-1, -1, -1, -1, -1, -1, LayerType.kNone, 0];
    }
    return [lButton.state(), rButton.state(), tButton.state(), bButton.state(), wButton.tag(), hButton.tag(), kLayerType, kAlign];

    //
    function addBox(frame, color)
    {
        var box = [[NSBox alloc] initWithFrame:frame];
        box.boxType = 4;
        box.fillColor = color;
        [view addSubview:box];
        return box;
    }

    // 创建按钮
    function addButton(state, x, y, w, h)
    {
        var button = [[NSButton alloc] initWithFrame:NSMakeRect(x, y, w, h)];
        [button setButtonType:2];
        button.bezelStyle = 1;
        button.bordered = 0;
        button.allowsMixedState = (state < 0);  // 仅初始化状态为混合态时允许
        button.state = state;
        updateLine(button, state);
        button.cell().imageScaling = 1;
        [button setCOSJSTargetFunction:function(sender) {updateLine(sender);}];
        [view addSubview:button];
        return button;
    }

    // 高度或者宽度按钮
    function addSideButton(state, x, y, w, h)
    {
        var button = [[NSButton alloc] initWithFrame:NSMakeRect(x, y, w, h)];
        [button setButtonType:2];
        button.bezelStyle = 1;
        button.bordered = 0;
        button.tag = state;
        updateImage(button, state);
        button.cell().imageScaling = 1;
        [button setCOSJSTargetFunction:function(sender) {updateSideLine(sender);}];
        [view addSubview:button];
        return button;
    }

    // 选择按钮
    function addChekckButton(title, x, y, w, h)
    {
        var button = [[NSButton alloc] initWithFrame:NSMakeRect(x, y, w, h)];
        [button setButtonType:NSSwitchButton];
        button.bezelStyle = 0;
        button.title = title;
        [view addSubview:button];
        return button;
    }

    //
    function addDescribleView(title, state, x, y, w, h)
    {
        var imageView = [[NSImageView alloc] initWithFrame:NSMakeRect(x, y, w, h)];
        var imageState = drawImage(imageView.frame().size, state);
        imageView.image = imageState[0];
        [view addSubview:imageView];

         var textView = [[NSTextView alloc] initWithFrame:NSMakeRect(x + w, y, 4*w, h)];
        [textView setString:title];
        [textView setBackgroundColor:[NSColor colorWithCalibratedRed:0.91 green:0.91 blue:0.91 alpha:1]];
        [view addSubview:textView];
    }

    function  updateSideLine(sender)
    {
        var preState = sender.tag();
        print("prestate ="+preState);
        var state = (preState == 2) ? -1 : preState + 1;
        print("state ="+state);
        sender.tag = updateImage(sender, state);
    }

    function updateLine(sender)
    {
        var state = sender.state();
        updateImage(sender, state);
    }

    // 按状态和尺寸更新按钮图片
    function updateImage(sender, state)
    {
        var imageState = drawImage(sender.frame().size, state);
        sender.image = imageState[0];
        return imageState[1];
    }

    function drawImage(size, state) {

        var w = size.width, h = size.height;
        var image = [NSImage imageWithSize:size];
        [image lockFocus];

        [[NSColor colorWithCalibratedRed:0.9 green:0 blue:0 alpha:((state==-1)?0.2:1)] set];

        var path = [NSBezierPath bezierPath];
        var v = w < h;
        if (v)
        {
            // 垂直方向的按钮的竖直线
            [path moveToPoint:NSMakePoint(w/2,3)];
            [path lineToPoint:NSMakePoint(w/2,h-3)];

            if (state != 0 && state != 2)
            {
                // 垂直方向的按钮的横直线
                [path moveToPoint:NSMakePoint(0, 3)];
                [path lineToPoint:NSMakePoint(w, 3)];
                [path moveToPoint:NSMakePoint(0, h-3)];
                [path lineToPoint:NSMakePoint(w, h-3)];
            }
            if (state != 1)
            {
                // 斜线
                [path moveToPoint:NSMakePoint(0, w/2)];
                [path lineToPoint:NSMakePoint(w/2, 3)];
                [path lineToPoint:NSMakePoint(w, w/2)];

                [path moveToPoint:NSMakePoint(0, h-w/2)];
                [path lineToPoint:NSMakePoint(w/2, h-3)];
                [path lineToPoint:NSMakePoint(w, h-w/2)];
            }
            if (state == 2)
            {
                [[NSColor lightGrayColor] set];
                [path moveToPoint:NSMakePoint(w/2,3)];
                [path lineToPoint:NSMakePoint(w/2,h-3)];
                //var lineDash = [5,5,5];
                //[path setLineDash:lineDash count:3 phase:0];
            }
        }
        else
        {
            [path moveToPoint:NSMakePoint(3, h/2)];
            [path lineToPoint:NSMakePoint(w-3, h/2)];

            if (state != 0 && state != 2)
            {
                [path moveToPoint:NSMakePoint(3, 0)];
                [path lineToPoint:NSMakePoint(3, h)];
                [path moveToPoint:NSMakePoint(w-3, 0)];
                [path lineToPoint:NSMakePoint(w-3, h)];
            }
            if (state != 1)
            {
                [path moveToPoint:NSMakePoint(h/2, 0)];
                [path lineToPoint:NSMakePoint(3, h/2)];
                [path lineToPoint:NSMakePoint(h/2, h)];

                [path moveToPoint:NSMakePoint(w-h/2, 0)];
                [path lineToPoint:NSMakePoint(w-3, h/2)];
                [path lineToPoint:NSMakePoint(w-h/2, h)];
            }
            if (state == 2)
            {
                //var lineDash = [5,5,5];
                //[path setLineDash:lineDash count:3 phase:0];
                [[NSColor lightGrayColor] set];
                [path moveToPoint:NSMakePoint(3, h/2)];
                [path lineToPoint:NSMakePoint(w-3, h/2)];
            }
        }

        [path stroke];
        [image unlockFocus];
        return [image,state];
    }

    function setCheckButtonTargetFunction()
    {
        [iconButton setCOSJSTargetFunction:function(sender) {onClickIconButton(sender);}];
        [textButton setCOSJSTargetFunction:function(sender) {onClickTextButton(sender);}];
        [navButton setCOSJSTargetFunction:function(sender) {onClickNavigation(sender);}];
        [cellButton setCOSJSTargetFunction:function(sender) {onClickCell(sender);}];
        [bannerButton setCOSJSTargetFunction:function(sender) {onClickBanner(sender);}];

        [alignLeft setCOSJSTargetFunction:function(sender) {
            lButton.state = sender.state;
            updateLine(lButton);
        }];

        [alignRight setCOSJSTargetFunction:function(sender) {
            rButton.state = sender.state;
            updateLine(rButton);
        }];
        [horizontalCenter setCOSJSTargetFunction:function(sender) {
            if (sender.state == 0) return;
            kAlign = AlignmentType.AlignmentHorizontalCenter;
        }];

        [alignTop setCOSJSTargetFunction:function(sender) {
            tButton.state = sender.state;
            updateLine(tButton);
        }];
        [alignBottom setCOSJSTargetFunction:function(sender) {
            bButton.state = sender.state;
            updateLine(bButton);
        }];

        [verticalCenter setCOSJSTargetFunction:function(sender) {
            if (sender.state == 0) return;
            kAlign = AlignmentType.AlignmentVerticalCenter;
        }];
    }

    function onClickTextButton(sender)
    {
        offCheckButtons(sender);
        if (sender.state == 0) return;
        kLayerType = LayerType.kText;
        updateAllLine( 1, 1, 1, 1, 0, 0);
    }

    function onClickIconButton(sender)
    {
        offCheckButtons(sender);
        if (sender.state == 0) return;
        kLayerType = LayerType.kIcon;
        updateAllLine(1, 0, 1, 0, 1, 1);
    }

    function onClickNavigation(sender)
    {
        offCheckButtons(sender);
        if (sender.state == 0) return;
        kLayerType = LayerType.kNavigation;
        updateAllLine(1, 1, 1, 1, 0, 1);
    }

    function onClickCell(sender)
    {
        offCheckButtons(sender);
        if (sender.state == 0) return;
        kLayerType = LayerType.kCell;
        updateAllLine(1, 1, 1, 0, 1, 0);
    }

    function onClickBanner(sender)
    {
        offCheckButtons(sender);
        if (sender.state == 0) return;
        kLayerType = LayerType.kBanner;
        updateAllLine(1, 1, 1, 1, 0, 2);
    }

    function updateAllLine(lState, rState, tState, bState, wTag, hTag)
    {
        lButton.state = lState;
        rButton.state = rState;
        tButton.state = tState;
        bButton.state = bState;
        wButton.tag = wTag;
        hButton.tag = hTag;

        updateLine(lButton);
        updateLine(rButton);
        updateLine(tButton);
        updateLine(bButton);
        updateImage(wButton, wButton.tag());
        updateImage(hButton, hButton.tag());
    }

    function offCheckButtons(sender)
    {
        if (sender != iconButton) {
            iconButton.state = 0;
        }
        if (sender != textButton) {
            textButton.state = 0;
        }
        if (sender != navButton) {
            navButton.state = 0;
        }
        if (sender != cellButton) {
            cellButton.state = 0;
        }
        if (sender != bannerButton) {
            bannerButton.state = 0;
        }
    }

    function setCheckbuttonState() {

        log("set-wise type= "+kLayerType);
        switch (parseInt(kLayerType))
        {
            case LayerType.kCell:
                cellButton.state = 1;
                onClickCell(cellButton);
                break;
            case LayerType.kText:
                textButton.state = 1;
                onClickTextButton(textButton);
                break;
            case LayerType.kIcon:
                iconButton.state = 1;
                log("set-wise type kIcon");
                onClickIconButton(iconButton);
                break;
            case LayerType.kNavigation:
                navButton.state = 1;
                onClickNavigation(navButton);
                break;
            case LayerType.kBanner:
                bannerButton.state = 1;
                onClickBanner(bannerButton);
                break;
            default:
                break;
        }

        if (lButton.state() == 1)
        {
            alignLeft.state = 1;
        }

        if (rButton.state() == 1)
        {
            alignRight.state = 1;
        }

        if (tButton.state() == 1)
        {
            alignTop.state = 1;
        }

        if (bButton.state() == 1)
        {
            alignBottom.state = 1;
        }

        switch (parseInt(kAlign)) {
            case AlignmentType.AlignmentHorizontalCenter:
                horizontalCenter.state = 1;
                break;
            case AlignmentType.AlignmentVerticalCenter:
                verticalCenter.state = 1;
                break;
            default:
                break;
        }
    }

    /*/
    function animatePreview()
    {
        [coscript setShouldKeepAround:true];

        // var target = [COSTarget targetWithJSFunction:function(cinterval) {
        //     print("hi!xx");
        // }];
        // [target performSelector:target.action() withObject:0 afterDelay:3];
        //[NSTimer scheduledTimerWithTimeInterval:1 target:target selector:target.action() userInfo:nil repeats:1];

        [coscript scheduleWithRepeatingInterval:2 jsFunction:function(cinterval) {
            print("Doing...");
        }];
    }*/
}
