

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