let div = document.querySelector('div');

let newDiv = reorder(div);
newDiv.classList = div.classList;

div.parentElement.insertBefore(newDiv, div);
div.parentElement.removeChild(div);