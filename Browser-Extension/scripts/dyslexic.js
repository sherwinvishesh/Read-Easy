


// Setting up global variables
let prefs;
let noText = ["SCRIPT", "LINK", "I", "MAT-ICON"];
let all = Array.from(document.body.getElementsByTagName("*"));
let playing = false;
let highlighter = new Highlighter();
let speechKey = new SpeechTyping();
let ruler = null;
let overlay = null;
let moving;
const localOrigin = ["db.sherwinvishesh.com", "github.com", "127.0.0.1", "localhost"];

change_font();


/***************************************************************************************************************
 * Hot Key Listeners
 */
document.addEventListener("keypress", async (key) => {
    if(key.target != document.body) return;
    switch(key.code){
        case "KeyU":
            change_font();
            break;
        case "KeyR":
            await update_prefs();
            toggleRuler();
            break;
        case "KeyO": 
            await update_prefs();
            toggleOverlay();
            break;
        case "KeyF":
            await update_prefs();
            toggleFont();
            break;
        case "KeyS":
            if(ruler){
                if(moving){
                    document.removeEventListener("mousemove", updateRulerPos);
                    ruler.style.position = "absolute";
                    ruler.style.top = `${lastMouseMove.pageY +  Number(prefs.r_o)}px`;
                    moving=false;
                }else {
                    moving=true;
                    document.addEventListener("mousemove", updateRulerPos);
                    ruler.style.position = "fixed";
                    ruler.style.top = `${lastMouseMove.clientY + Number(prefs.r_o)}px`;
                }
            }
        break;
    }
});


/***************************************************************************************************************
 * Ruler controls
 */
let lastMouseMove;
function updateRulerPos(e){
    lastMouseMove = e;
    ruler.style.top = `${e.clientY + Number(prefs.r_o)}px`;
}


let lastPos = 0;
document.addEventListener("mousemove", e => {
    lastPos = e.clientY;
})

function toggleRuler(){
    if(ruler == null){
        ruler = document.createElement("div");
        document.body.prepend(ruler);
        moving = true;
        ruler.style.background = prefs.r_c ? prefs.r_c : "red";
        ruler.style.width = "100%";
        ruler.style.height= prefs.r_h ? `${prefs.r_h}px` : "10px";
        ruler.style.position = "fixed";
        ruler.style.top= `${lastPos}px`;
        ruler.style.opacity = prefs.r_p ? `${prefs.r_p}%` : "50%";
        ruler.style.zIndex = 1000000;
        ruler.style.pointerEvents = "none";
        document.addEventListener("mousemove", updateRulerPos);
    }
    else{
        ruler.parentElement.removeChild(ruler);
        ruler = null;
        if(moving){
            document.removeEventListener("mousemove", updateRulerPos);
        }
    }
}
function reloadRuler(){
    if(ruler==null) return;
    ruler.style.background = prefs.r_c ? prefs.r_c : "red";
    ruler.style.height= prefs.r_h ? `${prefs.r_h}px` : "10px";
    ruler.style.top= `${lastPos}px`;
    ruler.style.opacity = prefs.r_p ? `${prefs.r_p}%` : "50%";
}



/***************************************************************************************************************
 * Overlay Controls
 * */
function toggleOverlay(){
    if(overlay == null){
        overlay = document.createElement("div");
        overlay.id = "overlay";
        overlay.style.background =  prefs.o_c;
        overlay.style.opacity = `${prefs.o_o}%`;
        document.body.prepend(overlay);
    }else{
        overlay.parentElement.removeChild(overlay);
        overlay = null;
    }
}
function reloadOverlay(){
    if(overlay == null) return;
    overlay.style.background =  prefs.o_c;
    overlay.style.opacity = `${prefs.o_o}%`;
}

/**********************************************************************************************
 * Bionic Reading
 */

function bionify(){
    let itterator = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT);
    let text;
    let arr = [];
    while(text = itterator.nextNode()){
        arr.push(itterator.referenceNode);
    }
    arr.forEach(el => {
        if(!/.*script|style/i.test(el.parentElement.tagName) && !el.parentElement.classList.contains("fj-bionic")){
            let nodeArr = el.textContent.split(" ");
            for(let i = 0; i < nodeArr.length; i++){
                if(!/^\s+$/.test(nodeArr[i])){
                    let half = Math.round(nodeArr[i].length/2);
                    nodeArr[i] = `<strong>${nodeArr[i].slice(0, half)}</strong>${nodeArr[i].slice(half)}`; 
                }
            }
            let nEl =document.createElement("inherit");
            nEl.classList.add('fj-bionic');
            nEl.innerHTML = nodeArr.join(" ");
            if(!/^\s+$/.test(nEl.textContent)){
                el.parentElement.replaceChild(nEl, el);
            }
        }
    })
}

function rmbionify(){
    
    document.body.querySelectorAll("inherit.fj-bionic").forEach(el =>{
        el.parentElement.replaceChild(document.createTextNode(el.textContent), el);
    })
}
/***************************************************************************************************************
 * Style changing function
 * */

function changeStyle(element, style, type, post){
    if(element.style[style]){
        element.setAttribute(`data-prev-${style}`, element.style[style]);
    }
    if(type[0]){
        if(post == ""){
            element.style.setProperty(style, type[1]);
        }else{
            element.style.setProperty(style, `${type[1]}${post}`);
        }
    }
}



/***************************************************************************************************************
 * Messaging interface
 * */

chrome.runtime.onMessage.addListener(
    async function(req, sender, send){
        switch(req.action){
            case "reload":
                prefs = req.data;
                reloadRuler();
                reloadOverlay();
            case "update-page":
                reloadFont();
                break;

            case "initSpeechText":
                start_diction();
                break;
            case "initRead":
                speechSynthesis.cancel();
                chrome.storage.sync.get(["font_prefs"], async(res) =>{
                    prefs = JSON.parse(res.font_prefs);
                    if(speechSynthesis.getVoices().length == 0){
                        await getVoices();
                    }
                    if(prefs.h_r && !prefs.h_d && !(window.location.href.split('.')[window.location.href.split('.').length -1] == "pdf")){
                        highlighter.end();
                        highlighter.rate = prefs.v_r;
                        highlighter.voice = speechSynthesis.getVoices()[prefs.v];
                        highlighter.volume = prefs.v_v;
                        highlighter.rate = prefs.v_r;
                        highlighter.pitch = prefs.v_p;
                        highlighter.color = prefs.h_c;
                        highlighter.startHighlightReader(req.text);
                    }else{
                        speechSynthesis.cancel();
                        read(req.text);
                    }
                    playing = false;
                    let button = document.body.querySelector(".reader-button");
                    button.setAttribute("style","visibility: visible");
                    let img = button.querySelector("img");
                    img.src = chrome.runtime.getURL("img/pause.svg");
                    let id = setInterval(() => {
                        if(!speechSynthesis.speaking){
                            end()
                            clearInterval(id)
                            chrome.runtime.sendMessage({action: "ended"});
                        }
                    }, 1000)
                });
                break;
            case "stop_reader":
                if(prefs.h_r && !prefs.h_d){
                    highlighter.end();
                }else{
                    speechSynthesis.cancel();
                }
                break;
            default: 
                send("unrecognized");
                return;
        }
        send("changed");
});


/***************************************************************************************************************
 * Reading functionality
 * * */
function end(){
    let button = document.body.querySelector(".reader-button");
    button.setAttribute("style","visibility: hidden");
}

function getVoices(){
    return new Promise((res, rej) => {
        let id;
        id = setInterval(() => {
            if(window.speechSynthesis.getVoices().length != 0){
                res(window.speechSynthesis.getVoices());
                clearInterval(id);
            }
        }, 10);
    });
    
}

async function read(text){
    text = split(text)
    text = Array.from(text);
    text.forEach(text => {
        const msg = new SpeechSynthesisUtterance(text);
        msg.voice = speechSynthesis.getVoices()[prefs.v];
        msg.volume = prefs.v_v;
        msg.rate = prefs.v_r;
        msg.pitch = prefs.v_p;
        speechSynthesis.speak(msg);
    });
}

function split(string){
    if(string.length < 200){
        return [string];   
    }
    else{
        let num = 200;
        let first = string.substr(0, num);
        let charArr = ['.', '?', '!',';',',', ':', '/', ' '];
        while(!first.endsWith(charArr[0])){
            num--;
            if(num < 5){
                num = 200;
                charArr.shift();
            }
            first = string.substr(0, num);
        }
        let last = string.substring(num, string.length);
        let arr = [first].concat(split(last));
        return arr;
    }
};
function showPlay(){
    let button = document.querySelector(".reader-button");
    button.style.visibility = "visible";
}

/**
 * PDF funcitonality
 */

if(/.*.pdf$/.test(window.location.href)){
    suggest_pdf();
}

async function suggest_pdf(){
    await update_prefs();
    setTimeout(()=>{
        if(prefs.client && prefs.client.curr && prefs.client.subs.includes("pdf")){
            let element = createElement("div",  {
                class:"fj-db-slide-in",
                child: [
                    {
                        type: "button",
                        args:{
                            class: "fj-db-close",
                            el: {
                                type: "click",
                                func: e=> {
                                    e.target.parentElement.parentElement.removeChild(e.target.parentElement);
                                }
                            }
                        }

                    },
                    {
                        type: "h2",
                        args: {
                            text: "We Detected a pdf"
                        }
                    }, 
                    {
                        type: "div",
                        args: {
                            text:"Want to use our viewer?"
                        }
                    }
                    
                ]
            })
            document.body.prepend(element);
        }
    },1000);
}

/***************************************************************************************************************
 * Utility functions
 * * */
 function update_prefs(){
    return chrome.storage.sync.get(["font_prefs"], res => {
        prefs = JSON.parse(res.font_prefs);
    })
}

function detOrigin(){
    let origin = location.href;
    origin = origin.split("/")[2];
    origin = origin.split(":")[0];
    if(localOrigin.includes(origin)){
        return true;
    }
    return false;
}


/***************************************************************************************************************
 * Font Changing Functions
 * */
 let fontOn = false;
 function removeStyle(el, style){
    if(el.hasAttribute(`data-prev-${style}`)){
        el.style.setProperty(style, el.getAttribute(`data-prev-${style}`))
        el.removeAttribute(`data-prev-${style}`);
    }else{
        el.style.removeProperty(style);
    }
}
 function update_font(el){
    if(el.nodeType != 3){
        if( (el.innerHTML != "" && el.innerHTML != "")){
            if(prefs.f[0] && !noText.includes(el.tagName)){
                
                if(el.style.getPropertyValue("font-family") && el.style.getPropertyValue("font-family") != prefs.f[1]){
        
                    
                    el.setAttribute("data-prev-font-family", el.style.fontFamily);
                }
                el.style.fontFamily = prefs.f[1];
            }
            if(!detOrigin(location.href)){
                changeStyle(el, "font-size", prefs.s, "px");
            }
            changeStyle(el, "color", prefs.c, "");
            changeStyle(el, "word-spacing", prefs.w_s, "rem");
            changeStyle(el, "line-height", prefs.l_s, "");
            changeStyle(el, "letter-spacing", prefs.c_s, "px");
        }
    }
}

 async function reloadFont(){
    toggleFont();
    toggleFont();
}

function toggleFont(){
    if(fontOn){
        fontOn = false;
        document.body.style.removeProperty("font-family");
        document.querySelectorAll("*").forEach(el => {
            if( (el.innerHTML != "" && el.innerHTML != "")){
                removeStyle(el, "font-family")
                if(!detOrigin()){
                    removeStyle(el, "font-size");
                }
                removeStyle(el, "color");
                removeStyle(el, "word-spacing");
                removeStyle(el, "line-height");
                removeStyle(el, "letter-spacing");
            }
            if(el.style == ""){
                el.removeAttribute("style");
            }
        });
        if(prefs.b_r){
            rmbionify();
        }
        if(document.body.querySelector("#db-gf-import")){
            document.body.removeChild(document.getElementById('db-gf-import'));
        }
    }else{
        if(window.location.href.indexOf('facebook.com') != -1){
            Array.from(document.querySelectorAll('div')).forEach(el => {
                if(el.hasAttribute('data-offset-key')){
                    el.removeAttribute("data-offset-key");
                }
            });
        }
        fontOn = true;
        
        if(prefs.src){
            document.body.prepend(createElement('style', {
                html: `@import url('https://fonts.googleapis.com/css2?family=${prefs.f[1].split(',')[0].replace("'", '')}`,
                id: "db-gf-import"
            }))
        }
        document.querySelectorAll("*").forEach(el => {
           update_font(el);
        });
        if(prefs.f[0]){
            document.body
            .style.setProperty("font-family", prefs.f[1]);
        } 
        if(prefs.b_r){
            bionify();
        }


    }
}



// called on page load
function change_font(){
    chrome.storage.sync.get(["font_prefs"], function (res){
        prefs = JSON.parse(res.font_prefs);
        if(prefs.t){
            if(prefs.src){
                document.body.prepend(createElement('style', {
                    html: `@import url('https://fonts.googleapis.com/css2?family=${prefs.f[1].split(',')[0].replace("'", '')}`,
                    id: "db-gf-import"
                }))
            }
            fontOn = true;
            if(prefs.f[0]){
                document.body
                .style.setProperty("font-family", prefs.f[1]);
            }
            all.forEach(el => {
                update_font(el);
            }); 
            if(prefs.b_r){
                bionify();
            }  
        }
        
        if(prefs.o_t){
            if(overlay != null){
                overlay.parentElement.removeChild(overlay);
                overlay = null;
            }
            toggleOverlay();
        }
        if(prefs.r_t){
            if(ruler != null){
                ruler.parentElement.removeChild(ruler);
                ruler = null;
            }
            toggleRuler();
        }
        if(document.querySelector(".reader-button") == null){
            let element = createElement("div", {
                class: "reader-button",
                style: "visibility: hidden",
                child: [
                    {
                        type: "button",
                        args: {
                            child: {
                                type: "img",
                                args: {
                                    src: chrome.runtime.getURL("img/pause.svg")
                                }
                            },
                            el: {
                                type: "click",
                                func: e => {
                                    if(!playing){
                                        playing = true;
                                        speechSynthesis.pause();
                            
                                        e.target.src = chrome.runtime.getURL("img/play.svg");
                                        chrome.runtime.sendMessage({action: "play"})
                                    }else{
                                        playing = false;
                                        speechSynthesis.resume();
                                        e.target.src = chrome.runtime.getURL("img/pause.svg");
                                        chrome.runtime.sendMessage({action: "pause"});
                                    }
                                }
                            }
                        }
                    },
                    {
                        type: "button",
                        args: {
                            child: {
                                type:  "img",
                                args: {
                                    src: chrome.runtime.getURL("img/cancel.svg")
                                }
                            },
                            el: {
                                type: "click",
                                func: e => {
                                    speechSynthesis.cancel();
                                    highlighter.end();
                                    playing=false;
                                }
                            }
                        }
                    }
                ]
            })
            document.body.append(element);
        }
    });
}


/**************************************************************************************************************
 * Speech to text Code
 */


function start_diction(){
    speechKey.setLanguage(prefs.lang ? prefs.lang : "en");
    speechKey.start();
}