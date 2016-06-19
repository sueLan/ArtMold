/**
 * Created by rongyanzry on 16/4/23.
 */

// 返回：返回选定的导出项目数组
function showBizRules(kVertically, kScaleText, kHeight)
{
    var items = [
        "垂直方向间距是否变化",
        "屏幕尺寸变化,字体变化",
        "目标画板高度跟真机一致.大屏到小屏,高度内容较多时建议不选"
    ];
    var states = [kVertically, kScaleText, kHeight];
    doc.showMessage("kVertically states = " + states);

    //
    var w = 400, h = items.length * 30;
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
        button.state = states[i];

        buttons[i] = button;
        [view addSubview:button];

        frame.origin.y += frame.size.height;
    }

    // 显示对话框
    var alertWindow = COSAlertWindow.new();
    alertWindow.addButtonWithTitle("OK");
    alertWindow.addButtonWithTitle("cancel");
    alertWindow.setMessageText("UI规则:");
    alertWindow.setInformativeText("请勾选需要遵守的规则");
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
