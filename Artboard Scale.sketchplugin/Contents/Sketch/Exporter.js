
// 参数：传入当前模型的尺寸和比例
// 返回：返回选定的导出项目数组
function runExporter(width, height, scale)
{
    var items = [
        ["Customize", 1000, 1000, 2],
        ["Android Device", 1080, 1920, 3],
        ["iPad Retina", 1536, 2048, 2],
        //["iPhone 3Gs", 320, 480, 1],
        ["iPhone 6/6s plus", 1080, 1920, 3],
        ["iPhone 6/6s", 750, 1334, 2],
        ["iPhone 5/5s/5c", 768, 1136, 2],
        ["iPhone 4/4s", 640, 960, 2]
    ];

    //
    var w = 300, h = items.length * 30;
    var view = [[NSView alloc] initWithFrame:NSMakeRect(0, 0, w, h)];

    var frame = NSMakeRect(0, 0, w, 30);
    var buttons = [];
    var fields = [];
    for (var i in items)
    {
        var t = items[i][0];
        var w = items[i][1];
        var h = items[i][2];
        var s = items[i][3];

        var title;

        if (t == "Customize")
        {
            title = t;
            for (var j = 0; j < 3; j++)
            {
                var field = [[NSTextField alloc] initWithFrame:NSMakeRect(90+j*52, frame.origin.y+4, (j == 2 ? 24 : 48), 20)];
                field.stringValue= items[i][1+j].toString();
                field.cell().placeholderString = (j==0 ? "W" : (j==1 ? "H" : "X"));
                [view addSubview:field];
                fields[j] = field;
            }
            frame.size.width = 90;
        }
        else
        {
            frame.size.width = w;
            title = t + " (" + w + "x" + h + "@" + s + "X)";
        }

        var button = [[NSButton alloc] initWithFrame:frame];
        [button setButtonType:NSSwitchButton];
        button.bezelStyle = 0;
        
        button.title = title;
        if (w == width && h == height && s == scale)
        {
            button.enabled = false;
            button.state = true;
        }

        buttons[i] = button;
        [view addSubview:button];

        frame.origin.y += frame.size.height;
    }

    // 显示对话框
    var alertWindow = COSAlertWindow.new();
    alertWindow.addButtonWithTitle("OK");
    alertWindow.setMessageText(width + "x" + height + "@" + scale + "X");
    alertWindow.setInformativeText("请勾选要生成的其它尺寸模型");
    alertWindow.setAccessoryView(view); // 不用 addAccessoryView，否则宽度强制被固定为300
    alertWindow.runModal();

    //
    var k = 0;
    var ret = [];
    for (var i in items)
    {
        if (buttons[i].state() && buttons[i].isEnabled())
        {
            if (items[i][0] == "Customize")
            {
                for (var j = 0; j < 3; j++)
                {
                    items[i][1+j] = fields[j].intValue();
                }
            }
            ret[k++] = items[i];
        }
    }
    return ret;
}

//log(runExporter(750,1334,2));
