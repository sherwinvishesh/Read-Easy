
//style definitions
const normStyle = `
:root{
    --text-color:#EEEEEE;
    --text-color:#EEEEEE;
    --background:#4d4d4d;
    --shadow-color: rgba(0, 0, 0, .25);
    --dark-text: #272932;
    --button-hightlight: #000;
    --highlight-color:#616161;
    --accent: #350946;
    --gery-color: #C4C4C4;
    --background-second: #000;
    --tab-highlight:#c2c2c2;
    --tab-color:#616161;
    --header-color: #ff2400;
    --sel-font: dyslexic3;
    --on-color: #616161;
    --anim: cubic-bezier(.62,.55,.6,1.24);
}`;
const octStyle = `
:root{
    --text-color:#EEEEEE;
    --background:#4d4d4d;
    --shadow-color: rgba(0, 0, 0, .25);
    --dark-text: #272932;
    --button-hightlight: #000;
    --highlight-color:#616161;
    --accent: #350946;
    --gery-color: #C4C4C4;
    --background-second: #000;
    --tab-highlight:#c2c2c2;
    --tab-color:#616161;
    --header-color: #ff2400;
    --sel-font: dyslexic3;
    --on-color: #616161;
    --anim: cubic-bezier(.62,.55,.6,1.24);
  }`;

let defaults = {
    font: "dyslexic",
    scale: 1,
    color: "#000000",
    w_s: .25,
    l_s: 1,
    c_s: 0,
    o_c: "#000000",
    o_t: false,
    o_o: 0,
    h_c: "#add8e6"
}

// set up globals
let warn = document.getElementById("warning");
let active = document.getElementById("font");
let form = document.getElementById("main-form");
let sliders = document.querySelectorAll(".slider");
let font;
let client;


function updateSuccess(resp){
    let element = createElement("span", {
        class: "pop-up",
        text: `Update Successful`,
    });
    document.body.append(element);
    setTimeout(() => {
        document.body.removeChild(element)
    })
}

function updatePrem(){
    if(client){
        client.subs = [];
        document.getElementById("prem-form").querySelectorAll(".sub-check::checked").forEach(el => {
            client.subs 
        })
        fetch("https://github.com/update-subs", {
            method: "POST",
            body: JSON.stringify({
                subs: client.subs
            })
        }).catch(err => {
            showError(err);
        }).then(resp => {
            updateSuccess(resp);
        })
    }
}

const prem_map = {
    pdf: {
        url: "https://github.com/pdf-comp.html",
        name: "Compatible PDF Viewer"
    }
}

function loadPremium(){
    let form = document.getElementById("p-form");
    form.innerHTML = "";
    let inners = createElement("div", {
        id: "prem-form",
        child: [
        {
            type: "span",
            args: {
                text:"Here are your current subscriptions:"
            }
        },
        {
            type: "ul", 
            args: {
                child: client.subs.map(el => {
                    return {
                        type: "li",
                        args: {
                            child: 
                                {
                                    type:"a",
                                    args: {
                                        text: prem_map[el].name,
                                        target: "_blank",
                                        href: prem_map[el].url
                                    }
                                }
                        }
                    }
                })
            }

        },
        {
            type: "span",
            args: {
                html: 'To update your subscriptions visit <a href="https://github.com/profile" target="_blank">This Link</a>.',
            }
        },
        {
            type:"br"
        },
        {
            type:"button",
            args: {
                text: "Log Out",
                class: "yellow-button",
                el: {
                    
                    type: "click",
                    func: e=> {
                        e.preventDefault();
                        chrome.runtime.sendMessage({action:"logout"}, res => {
                            UnloadPrem();
                        })
                    }
                }
            }
        }
    ]  
    })
    form.append(inners);
    let icon;
    if(client.patron){
        icon ={
            type: "div",
            args: {
                class: "patreon"
            }
        }
    }
    else{
        icon = [];
    }
    document.querySelector("header").append(createElement("div", {
        text: `Welcome ${client.name}`,
        child: icon,
        class: "hello"
    }))
}

function loadNonPrem(){
    document.getElementById("p-form").innerHTML = 
    `<p>In an effort to offset server costs, some of our features are sheilded behind a premium version of the extension.</p>
    <p>Currently we offer the following services:</p>
    <ul>
        <li>PDF Compatibility (1.99 USD/month)</li>
    </ul>
    <a target="_blank" class="yellow-button" href="https://github.com/login">Log In!</a>
    <a target="_blank" class="yellow-button" href="https://github.com/signup">Sign Up!</a>
    <div></div>`;
}

function UnloadPrem(){
    loadNonPrem();
    let welcome = document.querySelector(".hello");
    welcome.parentElement.removeChild(welcome)
}


function loadAuth(){
    if(client && client.curr){
        loadPremium();
    }else{
        loadNonPrem();
    }
}


//grab preferences.
chrome.storage.sync.get(["font_prefs"], (res) => {
    font = JSON.parse(res.font_prefs);
    // auth functionality
    client = font.client;
    loadAuth();

    // general preference settings
    form["auto-load"].checked = font.a_r != null ? font.a_r : true;

   
    // tts settings
    form["voices"].value = font.v != null ? font.v : 0;
    form["rate"].value = font.v_r != null ? font.v_r : 1;
    form["pitch"].value = font.v_p != null ? font.v_p : 1;
    form["volume"].value = font.v_v != null ? font.v_v : 1;
    form["pause"].checked = font.v_b != null ? font.v_b : true;

     // highlight settings
    form["do-highlight"].checked = font.h_r != null ? font.h_r : true;
    form["highlight-color"].value = font.h_c != null ? font.h_c: defaults.h_c;
    form["lang"].value = font.lang != null ? font.lang : "en";
    // font preferences
    if(font.src){
        let val = font.f[1];
        form["font-name"].append(createElement('option', {
            value: val,
            style: `font-family:'${val}'`,
            "data-src": font.src,
            text: val.substring(1, val.indexOf("'", 1)),
            selected: true
        }))
    }else{
        form["font-name"].value = font.f != null ? font.f[1] : defaults.font;
    }
    form["for-font"].checked = font.t != null ? font.t : true;
    form["do-font"].checked = font.f[0] != null ? font.f[0] : true;
    form["scale"].value = font.s != null? font.s[1] : defaults.scale;
    form["do-size"].checked = font.s != null? font.s[0] : false;
    form["font-color"].value = font.c != null ? font.c[1] : defaults.color;
    form["do-color"].checked = font.c != null ? font.c[0] : false;
    form["word-spacing"].value = font.w_s != null ? font.w_s[1] : defaults.w_s;
    form["do-word"].checked = font.w_s != null ? font.w_s[0] : false;
    form["line-spacing"].value = font.l_s != null ? font.l_s[1] : defaults.l_s;
    form["do-line"].checked = font.l_s != null ? font.l_s[0] : false;
    form["letter-spacing"].value = font.c_s != null ? font.c_s[1] : defaults.c_s;
    form["do-letter"].checked = font.c_s != null ? font.c_s[0] : false;
    form["bionic"].checked = font.b_r ? font.b_r : false;

    // overlay settings
    form["for-color"].checked = font.o_t != null ? font.o_t : false;
    form["color"].value = font.o_c != null ? font.o_c : defaults.o_c;
    form["opacity"].value = font.o_o != null ? font.o_o : defaults.o_o;

    // ruler settings
    form["for-ruler"].checked = font.r_t != null ? font.r_t : false;
    form["ruler-offset"].value = font.r_o != null ? font.r_o : 0;
    form["ruler-height"].value = font.r_h != null ? font.r_h : 16;
    form["ruler-opacity"].value = font.r_p != null ? font.r_p: 50;
    form["ruler-color"].value = font.r_c != null ? font.r_c : "#FF0000";

    // get voices
    let voiceSel = document.getElementById("voices");
    getVoices().then(voices => {
        voices.forEach((voice, ind) => {
            let op = document.createElement("option");
            op.value = ind;
            if(ind == font.v){
                op.selected = "selected";
            }
            op.textContent = voice.localService ? `${voice.name} - Higlightable`: voice.name;
            voiceSel.append(op);
            form['do-highlight'].disabled = !speechSynthesis.getVoices()[form["voices"].value].localService;
        }); 
    });
})

const voiceSelect = document.getElementById('voices');
const doHighlight = document.getElementById('highlight');

document.getElementById('voices').addEventListener('change', (e) => {
    if(speechSynthesis.getVoices()[voiceSelect.value].localService){
        doHighlight.disabled = false;
    } else {
        doHighlight.disabled = true;
    }
})

// all nav buttons
let nav = [
    {
        name: "Font Manip",
        action: "font"
    },
    {
        name: "Overlays",
        action: "over"
    },
    {
        name: "Reading Controls",
        action: "read"
    },
    
    {
        name: "Ruler",
        action: "ruler"
    }
   
    // {
    //     name: "Dyslexic Shop",
    //     action: "shop"
    // },
]

// Ruler Preview.
let rulerPrev = document.getElementById("ruler-prev");
let ruler = document.getElementById("prev-ruler");
let offset;
let rect;
let height;


// ruler preview functionality.
rulerPrev.addEventListener("mouseenter", e => {
    ruler.style.background = form["ruler-color"].value;
    ruler.style.height = `${form["ruler-height"].value}px`;
    height = form["ruler-height"].value;
    ruler.style.opacity = `${form["ruler-opacity"].value}%`;
    offset = Number(form["ruler-offset"].value);
    rect = e.target.getBoundingClientRect();
})

rulerPrev.addEventListener("mousemove", (e)=>{
    if(e.clientY < rect.bottom - offset - height){
        ruler.style.top = `${(e.clientY - rect.top + offset)}px`;    
    }
})


// set up nav and voice settings
document.addEventListener("DOMContentLoaded", () => {

    //define constants
    let sel = document.querySelector(".selector");
    let currStyle = document.createElement("style");
    let date = new Date()
    currStyle.innerHTML = date.getMonth() == 9 ? octStyle : normStyle;
    document.body.prepend(currStyle);
    if(date.getMonth() == 9){
        document.body.insertBefore(createElement("div", {
            child: [
                {
                    type: "h1",
                    args:{
                        style: "margin-left: 15%; font-size: 1.5rem; margin-bottom: 1.25em; color: var(--text-color); padding: 2ch; border-radius: 1ch;",
                        text: "Happy Dyslexic Awareness Month!!",
                        child: [
                            {
                                type:"br"
                            },
                            
                            {
                                type: "a",
                                args: {
                                    href: "https://dyslexiaida.org/october-is-dyslexia-awareness-month-2/",
                                    style: "font-size: small; color: var(--text-color)",
                                    target: "_blank",
                                    text: "Click here to learn more!"
                                }
                            }
                        ]
                    }
                },
                {
                    type: "br"
                },

            ]
            
        }
        ), document.body.querySelector("footer"));
    }

    //set up navigation
    nav.forEach(el => {
        let but = document.createElement("button");
        but.textContent = el.name;
        but.classList = el.action == "sup" ? "" : "nav-button";
        but.addEventListener("click", () => {
            let tab = document.getElementById(el.action);
            active.style.display = "none";
            tab.style.display = "flex";
            active = tab;
        });
        if(el.action == "sup"){
            but.id="support";
            document.querySelector("header").append(but);
        }else{
            but.id = `${el.action}-link`;
            sel.append(but);
        }
    });
    
    active.style.display="flex";
    // https://github.com
    document.getElementById('shop-link').addEventListener('click', e=> {
        let link = 'https://github.com/shop?t=iframe'
        const shop = document.getElementById('shop-iframe');
        if(shop.src != link){
            shop.src = link;
            shop.style.display = 'none';
        }
        shop.addEventListener('load', e => {
            document.getElementById('loading').style.display = 'none';
            shop.style.display = '';
        })
    })
   


    // google fonts
    window.requestIdleCallback(async e => {
        let master_fonts = await getFonts();
        let stylesheet = '';
        let elList = [];
        let modal = document.getElementById('google-font-list');
        modal.parentElement.querySelector('.yellow-button').addEventListener('click', e => {
            e.preventDefault();
            modal.parentElement.close();
        })
        Object.keys(master_fonts).forEach(key=> {
            if(key != 'size'){
                master_fonts[key].forEach( el => {
                    stylesheet += `@font-face{src:url("${el.f}");font-family:'${el.n}'}\n`;
                    let element = createElement('div', {
                        text: `${el.n}`,
                        class: 'inline-selection',
                        style: `font-family:'${el.n}', sans-serif`,
                        "data-font": JSON.stringify(el),
                        child: {
                            type: 'button',
                            args:{
                                text: 'Select Font',
                                el: {
                                    type:'click',
                                    func: selectFont,
                                }
                            }
                        }
                    })
                    modal.append(element);
                    elList.push({n: el.n.toLowerCase(), e:element});
                })
            }
        })
        modal.prepend(createElement('style', {
            html: stylesheet,
        }));
        document.getElementById('google-search').addEventListener('keyup', e => {
            let value = e.target.value || e.target.value == '' ? e.target.value.toLowerCase(): null;
            console.log(value);
            if(value){
                let regEx = new RegExp(`^${value}`);
                elList.forEach(el => {
                    if(!el.e.classList.contains('h') && !regEx.test(el.n)){
                        el.e.classList.add('h');
                    }else if(el.e.classList.contains('h') && regEx.test(el.n)){
                        el.e.classList.remove('h');
                    }
                })
            }
            else{
                Array.from(document.getElementById('google-font-list').querySelectorAll('.h')).forEach(el => {
                    el.classList.remove('h');
                })
            }
        })   
    }); 
});



function selectFont(e){
    e.preventDefault();
    let value = JSON.parse(this.parentElement.getAttribute('data-font'));
    form.prepend(createElement('style', {
        html: `@font-face{src:url('${value.f}'); font-family:'${value.n}';}`
    }))
    form['font-name'].append(createElement('option', {
        value: `'${value.n}', sans-serif`,
        style: `font-family:'${value.n}', sans-serif';`,
        "data-src": value.f,
        text: value.n,
        selected: true
    }))
    this.parentElement.parentElement.parentElement.close();
    form["font-name"].dispatchEvent(new Event('change'));
    form.dispatchEvent(new Event("change"));
}

document.getElementById('google-font').addEventListener('click', async e => {
    e.preventDefault();
    
    document.getElementById('google-font-list').parentElement.showModal();
});

function remove(el){
    el.parentElement.removeChild(el);
}

function createElement(type, args){
    let element = document.createElement(type);
    if(args != null){
        Object.keys(args).forEach(el => {
            switch(el){
                case 'text':
                    element.textContent = args[el];
                    break;
                case 'html':
                    element.innerHTML = args[el];
                    break;
                case 'class':
                    if(Array.isArray(args[el])){
                        args[el].forEach(el => {
                            element.classList.add(el);
                        });
                    }else{
                        element.classList.add(args[el]);
                    }
                    break;
                case 'id':
                    element.id = args[el]; 
                    break;
                case 'child':
                    if(Array.isArray(args[el])){
                        args[el].forEach(kid => {
                            element.append(createElement(kid.type, kid.args));
                        })
                    }else{
                        element.append(createElement(args[el].type, args[el].args));
                    }
                    break;
                case 'el':
                    element.addEventListener(args[el].type, args[el].func);
                    break;
                default: 
                    element.setAttribute(el, args[el]);
            }
    })
    }
    return element;
    
}

function googleTranslateElementInit() {
    new google.translate.TranslateElement({pageLanguage: 'en'}, 'google_translate_element');
}

async function getFonts(){
    let key = 'AIzaSyDGhOHU7RAIACBcBbhjozIE62A3P6VNNHQ';
    let data = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${key}`).then(res => {
        return res.json();
    }).catch(err => {
        alert(err);
    })
    let map = {size: 1};
    data.items.forEach(el => {
        let font = {
            n: el.family,
            f: el.files.regular
        }
        map[el.family[0]] ? map[el.family[0]].push(font) :map[el.family[0]] = [font];
    })
    return map;
}


// load in system fonts
window.requestIdleCallback( () => {
    chrome.fontSettings.getFontList().then(fonts => {
        let selection = form["font-name"];
        fonts.forEach(el => {
            let option = document.createElement("option");
            option.value = el.fontId;
            option.textContent = el.displayName;
            option.style.fontFamily = el.fontId;
            selection.append(option);
            if(font.f[1] == el.fontId){
                option.selected = true;
            }
        })
        let root = document.querySelector(":root");
        root.style.setProperty("--sel-font", form["font-name"].value);
    });
})

form["font-name"].addEventListener("change", () => {
    let root = document.querySelector(":root");
    root.style.setProperty("--sel-font", form["font-name"].value);
});

// set up
document.getElementById("test").addEventListener("click", () => {
    window.speechSynthesis.cancel();
    let utt = new SpeechSynthesisUtterance("hello there");
    utt.pitch = form["pitch"].value;
    utt.rate = form["rate"].value;
    utt.volume = form["volume"].value;
    utt.voice = speechSynthesis.getVoices()[form["voices"].value];
    window.speechSynthesis.speak(utt);
});

function getVoices(){
    return new Promise(function(res, rej){
        let id;
        id = setInterval(() => {
            if(window.speechSynthesis.getVoices().length != 0){
                res(window.speechSynthesis.getVoices());
                clearInterval(id);
            }
        }, 10);
    });
}


// save prefs.
form.addEventListener("change", (e) => {
    e.preventDefault();
    let s = form['font-name'];
    s = s.options[s.selectedIndex];
    let fontPref = {

        // general settings
        a_r: form["auto-load"].checked,
        
        // highlighter settings
        h_r: form["do-highlight"].checked,
        h_d: form["do-highlight"].disabled,
        h_c: form["highlight-color"].value,

        // voices checking
        v: form["voices"].value,
        v_r: form["rate"].value,
        v_p: form["pitch"].value,
        v_v: form["volume"].value,
        v_b: form["pause"].checked,

        // font settings
        t: form["for-font"].checked,
        src: s.hasAttribute('data-src') ? s.getAttribute('data-src') : null,
        s: [form["do-size"].checked, form["scale"].value],
        f: [form["do-font"].checked, form["font-name"].value],
        c: [form["do-color"].checked, form["font-color"].value],
        w_s: [form["do-word"].checked, form["word-spacing"].value],
        l_s: [form["do-line"].checked, form["line-spacing"].value],
        c_s: [form["do-letter"].checked, form["letter-spacing"].value],
        b_r: form["bionic"].checked,

        // overlay settings
        o_t: form["for-color"].checked,
        o_c: form["color"].value,
        o_o: form["opacity"].value,

        //ruler settings
        
        r_t: form["for-ruler"].checked,
        r_o: form["ruler-offset"].value,
        r_h: form["ruler-height"].value,
        r_p: form["ruler-opacity"].value,
        r_c: form["ruler-color"].value,
        
        // speech typing settings
        lang: form["lang"].value,

        // auth functionality
        client: client
    }
    
    chrome.storage.sync.set({"font_prefs": JSON.stringify(fontPref)}, function () {
        chrome.runtime.sendMessage({action: "update"}, resp => {
            if(resp){
                console.log(resp);
            }else{
                console.error("no response from background page on update");
            }
        })
        if(form["auto-load"].checked){
            chrome.tabs.query({}, tabs => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {action: "reload", data: fontPref}, (resp) => {
                    });
                })
            })
        }
        
    });

})
