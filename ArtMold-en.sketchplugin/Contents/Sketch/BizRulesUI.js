/**
 * Created by rongyanzry on 16/4/23.
 */

// 返回：返回选定的导出项目数组
function showBizRules()
{
    var items = [
        "Should scale vertically ?",
        "Should size of text scale with that of screen ?",
        "Should height of target artboard as with that of device screen ? No (Recommended)"
    ];
    //
    var w = 500, h = items.length * 30;
    var view = [[NSView alloc] initWithFrame:NSMakeRect(0, 0, w, h)];

    var frame = NSMakeRect(0, 0, w, 30);
    var buttons = [];
    for (var i in items)
    {

        var title = items[i];
        var button = [[NSButton alloc] initWithFrame:frame];
        [button setButtonType:NSSwitchButton];
        button.bezelStyle = 0;

        button.title = title;
        button.state = i < 2 ? 0 : 1;

        buttons[i] = button;
        [view addSubview:button];

        frame.origin.y += frame.size.height;
    }

    // 显示对话框
    var alertWindow = COSAlertWindow.new();
    alertWindow.addButtonWithTitle("OK");
    alertWindow.addButtonWithTitle("cancel");
    alertWindow.setMessageText("UI switch:");
    //alertWindow.setInformativeText("switch");
    alertWindow.setAccessoryView(view); // 不用 addAccessoryView，否则宽度强制被固定为300

    if (alertWindow.runModal() != "1000")
    {
        return [];
    }
    //
    var k = 0;
    var ret = [];
    for (var i = 0; i < items.length; i++)
    {
        ret[k++] = buttons[i].state();
    }
    return ret;
}

//log(runExporter(750,1334,2));
