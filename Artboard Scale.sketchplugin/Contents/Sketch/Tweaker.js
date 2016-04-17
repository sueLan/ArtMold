// 参数：插件实例和六项状态，0 = Flexible, 1 = Fixed, -1 = Mixed, -2 = apsectRatioFix
// 返回：设定的六项状态数组，0 = Flexible, 1 = Fixed, -1 = NoChange,

function runTweaker(layer, lState, rState, tState, bState, wState, hState)
{

    // MSBitmapLayer有个特殊属性:高宽比例固定.UI视图限制选择:只能选择宽或者高缩放,另一边会随之改变
    var isBitmapLayer =  isLayerClass(layer, "MSBitmapLayer");

    //
    var w = 200, h = 200;
    var view = [[NSView alloc] initWithFrame:NSMakeRect(0, 0, w/**2+20*/, h)];
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
    var wButton = addButton(wState, w/4         , h/2 - h/16    , w/2, h/8);
    var hButton = addButton(hState, w/2 - w/16  , h/4           , w/8, h/2);
    
    // 显示对话框
    var alertWindow = COSAlertWindow.new();
    alertWindow.addButtonWithTitle(@"OK");
    alertWindow.addButtonWithTitle(@"cancel");
    alertWindow.setMessageText(@"编辑缩放属性");
    alertWindow.setInformativeText(@"请选择缩放或固定间距、尺寸");
    alertWindow.setAccessoryView(view); // 不用 addAccessoryView，否则宽度强制被固定为300
    if (alertWindow.runModal() != "1000")
    {
        return [-1, -1, -1, -1, -1, -1];
    }
    return [lButton.state(), rButton.state(), tButton.state(), bButton.state(), wButton.state(), hButton.state()];

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
        updateImage(button);
        button.cell().imageScaling = 1;
        [button setCOSJSTargetFunction:function(sender) {ClickHandler(sender);}];
        [view addSubview:button];
        return button;
    }

    function ClickHandler(sender)
    {
        if (isBitmapLayer)
        {
            if (sender.state == 1)
            {
                if (sender === wButton)
                {
                    hButton.state = -2;
                }

                if (sender === hButton)
                {
                    wButton.state = -2;
                }
            }
        }
        updateImage(sender);
    }
    // 按状态和尺寸更新按钮图片
    function updateImage(sender)
    {
        var state = sender.state();
        var size = sender.frame().size;
        var w = size.width, h = size.height;

        var image = [NSImage imageWithSize:size];
        [image lockFocus]
        
        [[NSColor colorWithCalibratedRed:0.9 green:0 blue:0 alpha:((state==-1)?0.2:1)] set];

        var path = [NSBezierPath bezierPath];
        //path.lineWidth = 2;

        var v = w < h;
        if (v)
        {
            // 垂直方向的按钮的竖直线
            [path moveToPoint:NSMakePoint(w/2,3)];
            [path lineToPoint:NSMakePoint(w/2,h-3)];

            if (state != 0)
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

            if (state == -2)
            {
                [path moveToPoint:NSMakePoint(0, h/2)];
                [path lineToPoint:NSMakePoint(w, h/2)];
            }
        }
        else
        {
            [path moveToPoint:NSMakePoint(3, h/2)];
            [path lineToPoint:NSMakePoint(w-3, h/2)];

            if (state != 0)
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

            if (state == -2)
            {
                [path moveToPoint:NSMakePoint(0, h/2)];
                [path lineToPoint:NSMakePoint(w, h/2)];
            }
        }

        [path stroke];
        [image unlockFocus];

        sender.image = image;
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
