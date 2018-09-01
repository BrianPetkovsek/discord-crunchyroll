const {BrowserWindow, app} = require('electron');
const {Client} 			   = require('discord-rpc');
const widevine             = require('electron-widevinecdm');
const moment               = require('moment');
const rpc                  = new Client({transport: 'ipc'});

widevine.load(app);

let clientId = '484509333166751751',
    mainWindow,
    smallImageKey,
	smallImageText,
    start, end,
    WindowSettings = {
        backgroundColor: '#FFF',
        useContentSize: false,
        autoHideMenuBar: true,
        resizable: true,
        center: true,
        frame: true,
        alwaysOnTop: false,
        title: 'Crunchyroll',
        icon: __dirname + '/icon.ico',
        webPreferences: {
            nodeIntegration: false,
            plugins: true,
        },
    },
    login = (tries = 0) => {
        if (tries > 10) return mainWindow.webContents.executeJavaScript(connectionNotice);
        tries += 1;
		rpc.login({clientId}).catch(e => setTimeout(() => login(tries), 10E3));
    },
    getInfos = `(function() {
		try{windowName   	 = document.title;}catch(err){}
		show = null;
        try{show 		 	 = document.querySelector('.text-link').textContent;}catch(err){}
		try{episode 		 = document.querySelector('.ellipsis').textContent;}catch(err){}
		return {
			show: show,
			episode: episode,
			title: windowName
		};
    })()`,
    connectionNotice = `let notice = document.createElement('div'),
        close_btn = document.createElement('span');
        notice.className = 'error-notice';
        notice.setAttribute('style', 'position: fixed; top: 0px; background: #ef5858; border-bottom: 3px solid #e61616; border-radius: 3px; z-index: 101; color: white; width: 99%; line-height: 2em; text-align: center; margin: 0.5%;');
        close_btn.className = 'close-btn';
        close_btn.innerHTML = '&times;';
        close_btn.setAttribute('style', 'float: right; margin-right: 0.5%; font-size: 20px;');
        notice.innerHTML = 'Failed to connect to Discord IRC. Connection timed out.';
        notice.appendChild(close_btn);
        document.body.appendChild(notice);
        notice.onclick = () => document.body.removeChild(notice);
        setTimeout(() => document.body.removeChild(notice), 15E3);`;
		
async function checkCrunchyroll() {
    if (!rpc || !mainWindow) return;
	
    let infos = await mainWindow.webContents.executeJavaScript(getInfos);
	/*
	{
		details: details,
		state: state,
		largeImageKey: 'crunchyroll_logo_name',
		largeImageText: 'Crunchyroll',
		smallImageKey,
		smallImageText,
		instance: false,
		endTimestamp: endTime
	}
	*/
	data = {largeImageKey: 'crunchyroll_logo_name', largeImageText: 'Crunchyroll'}
	console.log(infos);
	if (infos) {
		if (infos['show']){
			if (infos['title'].indexOf(infos['show']) != -1){
				infos['episode'] = infos['episode'].replace(infos['show'],"")
				data['details'] = infos['show']
				data['state'] = infos['episode']
			}else{
				data['details'] = 'browsing'
				data['state'] = 'idle'
			}
		}else{
			data['details'] = 'browsing'
			data['state'] = 'idle'
		}
	}
	
	rpc.setActivity(data);
}

rpc.on('ready', () => {
    checkCrunchyroll();
    setInterval(() => {
        checkCrunchyroll();
    }, 15E3);
});

app.on('ready', () => {
    mainWindow = new BrowserWindow(WindowSettings);
    mainWindow.maximize();
    mainWindow.loadURL("https://www.crunchyroll.com/");
    login();
});

app.on('window-all-closed', () => {
    app.quit();
});
