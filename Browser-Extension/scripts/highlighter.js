

class Highlighter{ 
    readPath;
    pathHTML;
    wordArr = new Array();
    currIndex;
    #path;
    voice = 0;
    pitch = 1;
    going = false;
    volume = 1;
    color  = "#add8e6";
    rate = 1;
    
    constructor(){
        document.addEventListener("contextmenu",  e => {
            this.#path = e.target;
        })
    }

    cleanString(string){
        let pattern = new RegExp("\x20|\x0A");
        let before = '';
        while(string != before){
            before = string;
            string = string.replace(pattern, '');
        }
        return string;
    }

    startHighlightReader(text){
        let i;
        let cleanText = this.cleanString(text);
        if(!this.#path) {
            console.error("not path visible");
            return;
        }
        let prev;
        do{
            i = this.cleanString(this.#path.innerText).includes(cleanText);
            prev = this.#path;
            this.#path = this.#path.parentElement; 
        }while(!i && (!this.#path || this.#path.nodeName != "HTML"));
        if(!this.#path || this.#path.nodeName == "HTML"){
            console.error("couldn't find element");
            return;
        }
        this.readPath = prev;
        this.pathHTML = this.readPath.innerHTML;
        // let ind = pathHTML.indexOf(cleanText.substr(0, 10)) - 10;
        // let end = pathHTML.indexOf(clean.substr(-10)) + 10;
        // if(ind < 0 || end < 0){
        //     console.error(`start: ${ind}, end: ${end}, less than zero error`);
        //     return;
        // }
        let [start, end] = this.testInclude(cleanText);
        
        /** */
        this.wordArr = this.itterate(start, end);
        
        this.currIndex = 0;
        this.read(text);
        
    }

    testInclude(text){
        if(text == null || text == undefined){
            return [null, null];
        }
        let end = 0;
        let start = 0;
        let index = 0;
        let len = text.length * 10
        let notFoundStart= true;

        //finds start point 
        let tracker = 0
        let second = 0
        while(notFoundStart && tracker < 1000000){
            index=0;
            start = this.pathHTML.indexOf(text[0], start + 1);
            if(start == null || start == undefined){
                return [null, null];
            }
            end = start;
            second = 0
            //finds end point
            while(notFoundStart && second < len){
                second++
                if(this.pathHTML[end] == ' ' || this.pathHTML[end] == '\n'){
                    end++;
                }
                else if(this.pathHTML[end] == '<'){
                    end = this.pathHTML.indexOf('>', end) + 1;
                }else if(this.pathHTML[end] == '&'){
                    end = this.pathHTML.indexOf(' ', end);
                    index++
                } else {
                    if(this.pathHTML[end] == text[index]){
                        end++;
                        index++;
                        if(index == text.length){
                            notFoundStart = false;
                        }
                    }else{
                        break;
                    }
                }
            }
            tracker ++; 
        }
        if (tracker == 1000000){
            console.log("could not find - canceling highlight.")
        }
        return [start, end];
    }

    read(text){
        this.going = true;
        let utter = new SpeechSynthesisUtterance(text);
        utter.rate = this.rate;
        utter.voice = this.voice;
        utter.pitch = this.pitch;
        utter.volume = this.volume;
        utter.onboundary = (e) => {
            if(e.name == "word"){
                this.changeWord(text.substring(e.charIndex, e.charIndex + e.charLength));
            }
        }
        
        utter.onend = () => {
            this.readPath.innerHTML = this.pathHTML;
            this.currIndex = 0;
            this.going = false;
        }
        utter.onerror = console.log
        speechSynthesis.speak(utter);
        
    }

    end(){
        if(this.pathHTML != null && this.going){
            while(speechSynthesis.pending){
                window.speechSynthesis.cancel();
            }
            this.readPath.innerHTML = this.pathHTML;
            this.currIndex = 0;
            this.going = false;
        }
    }

    itterate(start, end){
        let arr = new Array();
        arr.push(start);
        //while not at end
        while(start < end){
            // has a space or and end character
            if(this.pathHTML[start] == ' ' || this.pathHTML[start] == '\n'){
                start++;
                continue;

            // has a html tag
            }else if(this.pathHTML[start] == '<'){
                
                let ind = this.pathHTML.indexOf('>', start);
                start = ind + 1;
                arr.push(ind +  1);
            }
            // else either space or char is next
            else{  
                //check the location of the next space
                let ind2 = this.pathHTML.indexOf(' ', start);
                let bracket = this.pathHTML.indexOf('<', start);

                // if bracket is first and not the end of the string
                if((ind2 > bracket || ind2 == -1) && bracket != -1){
                    
                    // push on the bracket
                    arr.push(bracket);
                    // push on the ending bracket
                    arr.push(this.pathHTML.indexOf('>', bracket) + 1);
                    // put start to the end of the html tag
                    start = this.pathHTML.indexOf('>', bracket)+ 1;
                // if its the end of the string
                }else if(ind2 == -1 && bracket == -1){
                    arr.push(this.pathHTML.length -1);
                    start = end;
                // else no other conditins just push and continue.
                }else{
                    arr.push(ind2 + 1);
                    start = ind2 + 1;
                }
                
            }
        }
        return arr;
    }

    changeWord(str){
        let is_word = new RegExp('[a-zA-Z0-9]')
        if(this.readPath != null && this.currIndex != -1){
            while((this.pathHTML.substring(this.wordArr[this.currIndex], this.wordArr[this.currIndex + 1]).includes('<') || !is_word.test(this.pathHTML.substring(this.wordArr[this.currIndex], this.wordArr[this.currIndex + 1]))) && this.currIndex < this.wordArr.length){
                this.currIndex++
            }
            if( this.pathHTML.substring(this.wordArr[this.currIndex], this.wordArr[this.currIndex + 1]).indexOf(str) != -1 && this.currIndex < this.wordArr.length){
                let cancel_space = this.pathHTML[this.wordArr[this.currIndex + 1] - 1] == " " ? 1 : 0;
                this.readPath.innerHTML = `${this.pathHTML.slice(0, this.wordArr[this.currIndex])}<c style="background: ${this.color};">${this.pathHTML.slice(this.wordArr[this.currIndex], this.wordArr[this.currIndex + 1] - cancel_space)}</c>${this.pathHTML.slice(this.wordArr[this.currIndex + 1] - cancel_space)}`;
                this.currIndex ++;
            }
        }
    }
}