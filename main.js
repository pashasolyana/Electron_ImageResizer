const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');
let mainWindow;

//Create main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: "Image Resizer",
        width: 500,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarOverlay: true,
    });

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// App is ready
app.whenReady().then(() => {
    createMainWindow();

    mainWindow.on('closed', () => (mainWindow = null))
    app.on('activate', () => {
        if(BrowserWindow.getAllWindows().length == 0){
            createMainWindow();
        }
    })
});


// Respond to ipcRenderer resize

ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageresizer');
    resigeImage(options);
})

// Resize image

async function resigeImage({imgPath, width, height, dest}){
    try{
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height
        });

        // Create filename
        const filename = path.basename(imgPath);

        // Create dest folder if not exists

        console.log(dest)
        if(!fs.existsSync(dest)){
            fs.mkdirSync(dest);
        };

        // Write file to dest

        fs.writeFileSync(path.join(dest, filename), newPath);

        // Send success to render
        mainWindow.webContents.send('image:done')

        // Open dest folder
        shell.openPath(dest);
    }catch(e){
        console.log(e)
    }
}