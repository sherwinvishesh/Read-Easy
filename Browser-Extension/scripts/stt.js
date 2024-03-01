
class SpeechTyping{
    #path;
    #recog;
    #element;
    #qArr = ['is', 'are', 'how', 'when', 'who', 'what', 'why', 'does'];
    constructor(language){
        document.addEventListener("contextmenu", e=> {
            this.#path = e.target;
        })
        this.#recog = new webkitSpeechRecognition() || new SpeechRecognition();
        this.#recog.continuous = true;
        this.#recog.interimResults = true;
        this.#element = createElement("div", {
            class: "db-stt-readout",
            child: [
                {
                    type: "button",
                    args: {
                        text: "Stop Diction",
                        el:{
                            type: 'click',
                            func: e=> {this.end();}
                        }
                    }
                },
                {
                    type: "span",
                    args: {
                        text: "Confidence:",
                        class: "db-conf"
                    }
                },
                {
                    type: "span",
                    args:{
                        text:"",
                        class: "db-readout",
                        child: [
                            {
                                type: "input",
                                args:{
                                    type: "checkbox",
                                    class:"clicked"
                                }
                            },
                        ]
                    }
                },
                {
                    type: "input",
                    args:{
                        type: "checkbox",
                        disabled: true,
                        class:"clicked"
                    }
                },
                {
                    type: "div",
                    args:{
                        text: "",
                        class: "db-full-transcript",
                        el: {
                            type: "click",
                            func: this.copy
                        }
                    }
                },
                {
                    type:"button",
                    args:{
                        text: "Read Back",
                        el: {
                            type: 'click',
                            func: e => {
                                e.preventDefault();
                                read(this.#element.querySelector(".db-readout").textContent);
                            }
                        }
                    }
                }
            ]
        });
        

        this.#recog.addEventListener('end', e=> {
            this.end();
        })

    }
    copy(){
        navigator.clipboard.writeText(this.textContent);
        let click = this.parentElement.querySelector(".clicked")
        click.checked = true;
        setTimeout(() => {
            click.checked = false;
        }, 1000);
        
    }

    setLanguage(language){
        this.#recog.lang = language;
    }

    start(){
        update_prefs();
        this.#recog.stop();
        this.#element.querySelector(".db-full-transcript").textContent = "";
        let output = this.#path;
        let increment = 0;
        document.body.prepend(this.#element);
        this.#recog.addEventListener("result", e=> {
            this.#element.querySelector('.db-conf').textContent = `Confidence: ${(e.results[increment][0].confidence * 100).toFixed(2)}%`
            this.#element.querySelector(".db-readout").textContent = e.results[increment][0].transcript;
            if(e.results[increment].isFinal){
                let data = this.grammarize(e.results[increment][0].transcript)
                output.value += data;
                this.#element.querySelector(".db-full-transcript").textContent += data;
                increment++;
                   
            }
    
        })
        this.#recog.start();
    }

    grammarize(text){
        let arr  = text.split(' ');
        if(arr[0] == ''){
            arr[0] = arr[1];
        }
        switch(true){
            
            case this.#qArr.indexOf(arr[0]) != -1:
                text += '?';
                break;
            default:
                text += '.';
        }
        if(text[0] == ' '){
            text = ' ' + text.charAt(1).toUpperCase() + text.slice(2);
        }else{
            text = text.charAt(0).toUpperCase() + text.slice(1);
        }
       
        console.log(text);
        return text;
    }
    end(){
        document.body.removeChild(this.#element);
        this.#recog.stop();
    }
}