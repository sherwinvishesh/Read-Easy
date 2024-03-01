

let defaults = {
    v_v: "1",
    v: "0",
    v_r: "1",
    v_b: true,
    v_p: "1",
    c: [false, "#000000"],
    c_s: [false, "0"],
    a_r: true,
    f: [true, "dyslexic"],
    l_s: [false, "1"],
    o_c: "#000000",
    o_o: "0",
    o_t: false,
    s: [false, "16"],
    t: true,
    w_s: [false, "0.25"],
    client: null,
}
var prefs;
var playing = null;

// chrome.runtime.onInstalled.addListener(async dets => {
//     switch (dets.reason) {
//         case "install":
//             chrome.tabs.create({ url: "https://sherwinvishesh.com" })
//             break;
//         case "update":
//             break;
//     }
// })





getPrefs();
function getPrefs() {
    return chrome.storage.sync.get(["font_prefs"], res => {
        if (res.font_prefs != null) {
            prefs = JSON.parse(res.font_prefs);
        } else {
            chrome.storage.sync.set({ "font_prefs": JSON.stringify(defaults) }, () => {
                prefs = defaults;
            })
        }
    });
}


async function readWords(info) {
    let text = info.selectionText;
    sendMessage({
        action: "initRead",
        text: text
    }, { active: true, currentWindow: true })
}
function sendMessage(msg, sendTo) {
    chrome.tabs.query(sendTo, tabs => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, msg, resp => {
                if (resp == null) {
                    console.error("no response");
                } else {
                    console.log(resp);
                }
            })
        })
    })
}


function updateSub(sub) {
    fetch("https://db.sherwinvishesh.com/update-sub", {
        method: "POST",
        body: JSON.stringify({
            client: client.subs
        })
    })
}

async function getNext() {
    return Number(await fetch("http://db.sherwinvishesh.com/get-next-checkup", {
        method: "POST",
        body: JSON.stringify({
            u: prefs.client.id
        })
    }).then(res => { return res.text() }));
}

function updatePrefs() {
    chrome.storage.sync.set({ "font_prefs": JSON.stringify(prefs) });
}

const allowedOrigins = ["https://db.sherwinvishesh.com", "https://github.com"];
// "http://localhost:5000", "http://127.0.0.1:5501",
chrome.runtime.onMessageExternal.addListener(async (req, sender, resp) => {

    if (!allowedOrigins.includes(sender.origin)) {
        resp(false);
        return;
    }
    if (!!prefs.client && ((!prefs.client.next) || (prefs.client.subs.length != 0 && !prefs.client.next) || (prefs.client.next && prefs.client.next >= Date.now()))) {
        prefs.client.next = await getNext();
        if (prefs.client.next == null) {
            prefs.client.curr = false;
        }
    }
    switch (req.action) {
        case "give-pdf":
            if (!prefs.client || !prefs.client.curr || !prefs.client.subs.includes("pdf")) {
                resp(null);
                return;
            }
            resp(prefs.client.id);
            break;
        case "update-page":
            sendMessage({ action: "update-page" }, { currentWindow: true, active: true });
            resp(true);
            break;
        case "update-client":
            prefs.client = req.data;
            prefs.client.next = await getNext();
            updatePrefs();
            resp(true);
            break;
        default:
            console.error(`unknown message: MSG: ${JSON.stringify(message)}, SNDR: ${JSON.stringify(sender)}`);
            resp(null);
    }
})

chrome.runtime.onMessage.addListener((req, sender, resp) => {
    switch (req.action) {
        case "logout":
            prefs.client = null;
            updatePrefs();
            resp(true);
            break;
        case "change-sub":
            if (client) {
                updateSub(req.sub);
                resp(true);
                return;
            }
            resp(false);
            break;
        case "pause":
            resp(true);
            break;
        case "play":
            if (playing = null) {
                sendMessage({ action: "stop_reader" }, { url: playing })
            }
            playing = sender.url;
            resp(true);
            break;
        case "update":
            getPrefs();
            resp(true);
            break;
        case "end":
            playing = null;
            resp(true);
            break;
        default:
            resp(false);
    }
})

function interpret(data) {
    switch (data.menuItemId) {
        case "dyslexic_browser_read":
            readWords(data);
            break;
        case "dyslexic_browser_recognition":
            startRecognition(data);
            break;
    }
}

function startRecognition(data) {
    sendMessage({ action: 'initSpeechText' }, { active: true, currentWindow: true });
}
chrome.contextMenus.onClicked.addListener(interpret);

chrome.contextMenus.create({
    title: "Read Selected",
    contexts: ["selection"],
    id: "dyslexic_browser_read"
});


chrome.contextMenus.create({
    title: "Activate Voice Recognition",
    contexts: ['editable'],
    id: "dyslexic_browser_recognition"
})