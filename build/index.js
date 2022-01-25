"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_2 = require("@capacitor-community/electron");
const electron_updater_1 = require("electron-updater");
const electron_log_1 = require("electron-log");
let updater;
electron_updater_1.autoUpdater.autoDownload = false;
// The MainWindow object can be accessed via myCapacitorApp.getMainWindow()
const myCapacitorApp = electron_2.createCapacitorElectronApp({
    mainWindow: {
        windowOptions: { minHeight: 768, minWidth: 1024 }
    }
});
let win;
function createDefaultWindow() {
    return new Promise((resolve) => {
        win = new electron_1.BrowserWindow({
            height: 400,
            width: 400,
            resizable: false,
            minimizable: false,
            maximizable: false,
            show: true,
            parent: myCapacitorApp.getMainWindow(),
            webPreferences: {
                nodeIntegration: true
            }
        });
        win.setMenu(null);
        win.setTitle("");
        win.loadURL(`file://${__dirname}/version.html`);
        win.webContents.on('dom-ready', () => {
            win.show();
            electron_1.ipcMain.on("updateAction", function (event, data) {
                switch (data) {
                    case "success":
                        electron_updater_1.autoUpdater.quitAndInstall();
                        break;
                    case "start":
                        electron_updater_1.autoUpdater.downloadUpdate();
                        break;
                    default:
                        win.close();
                        break;
                }
            });
            resolve(win);
        });
        win.on('closed', () => {
            win = null;
        });
    });
}
electron_updater_1.autoUpdater.on('checking-for-update', () => {
    //log('Checking for update...');
});
electron_updater_1.autoUpdater.on('update-available', (info) => {
    //log('Update available.');
    createDefaultWindow().then(() => {
        win.webContents.send('message', info);
    });
});
electron_updater_1.autoUpdater.on('update-not-available', (info) => {
    // log('Update not available.');
});
electron_updater_1.autoUpdater.on('error', (err) => {
    electron_log_1.log('Error in auto-updater. ' + err);
});
electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Tốc độ tải xuống: " + Math.round(progressObj.bytesPerSecond / (1024 * 1024)) + "MB/s";
    log_message = log_message + ' - Đã tải xuống ' + Math.round(progressObj.percent) + '%';
    log_message = log_message + ' (' + Math.round(progressObj.transferred / (1024 * 1024)) + "MB/" + Math.round(progressObj.total / (1024 * 1024)) + 'MB)';
    // log(log_message);
    win.webContents.send('download_progress', log_message);
});
electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
    // log('Update downloaded');
    win.webContents.send('download_progress', 'success');
});
// printer
let print; // khởi tạo cửa sổ để in, ở chế độ ẩn
function createPrinttWindow() {
    print = new electron_1.BrowserWindow({
        title: 'Print',
        show: false,
        width: 800,
        height: 600,
        parent: myCapacitorApp.getMainWindow(),
        webPreferences: {
            nodeIntegration: true,
        }
    });
    print.loadURL(`file://${__dirname}/print.html`); // load file này để show dữ liệu html nhận từ angular gửi xuống để custom in
    initPrintEvent();
    print.on('close', () => {
        print = null;
    });
}
function initPrintEvent() {
    //** nhận sự kiện từ angular gửi xuống, để lấy mấy in, lấy dánh sách máy in gửi ngược lại cho angular */
    electron_1.ipcMain.on('allPrint', () => {
        console.log('received getPrinters msg');
        const printers = print.webContents.getPrinters();
        myCapacitorApp.getMainWindow().webContents.send('printName', printers);
    });
    //** nhận sự kiện in từ angular, rồi gửi qua trang print.html để chỉnh trang in */, bên trang print.html edit xong, gửi lại sự kiên "do" để thực hiện in
    electron_1.ipcMain.on('print-start', (event, obj) => {
        console.log('print-start');
        print.webContents.send('print-edit', obj);
    });
    //** nhận sự kiện "do" từ print.html để in */
    electron_1.ipcMain.on('do', (event, printer) => {
        const options = {
            silent: true,
            deviceName: printer.deviceName,
        };
        print.webContents.print(options, (success, errorType) => {
            if (!success)
                myCapacitorApp.getMainWindow().webContents.send('print-done', false); // gửi sự kiện lên angular nếu in lỗi
            myCapacitorApp.getMainWindow().webContents.send('print-done', true); // gửi sự kiện lên angular nếu in ok
        });
    });
}
electron_1.app.on('ready', function () {
    myCapacitorApp.init();
    // Create the Menu
    electron_1.Menu.setApplicationMenu(null);
    createPrinttWindow();
    electron_updater_1.autoUpdater.checkForUpdates();
});
electron_1.app.on('window-all-closed', () => {
    electron_1.app.quit();
});
electron_1.app.on("activate", function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (myCapacitorApp.getMainWindow().isDestroyed())
        myCapacitorApp.init();
});
