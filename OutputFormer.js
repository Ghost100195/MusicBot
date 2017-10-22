const LINIE = {
    horizontal: "\u2500",
    vertikal: "\u2502",
    top_right: "\u250C",
    top_left: "\u2510",
    bottom_right: "\u2514",
    bottom_left: "\u2518",
    center_right: "\u251C",
    center_left: "\u2525"
};

//const BOX_LENGTH = 10;
// 3 Position : TOP, middle, BOTTOM, SOLO
function drawBox({ content, length, padding, position, align, sideNote}){
    // FEHLER ABFRAGE
    if(!content) return;
    if(!padding || padding === -1) padding = 0;
    padding = 2 * Math.floor(padding / 2);
    if(!position || position.length === 0) position = "solo";
    if(!align || align.length === 0) align = "left";
    align = align.toLowerCase();
    if(!sideNote || sideNote.length === 0) sideNote = "";
    if(!length || length === 0) length = content.length + sideNote.length;
    length += padding; 

    let box = "";
    var { top_left , top_right, bottom_left, bottom_right } = LINIE; 

    position = position.toLowerCase();
    if(position !== "solo"){
        if(position === "top"){
            bottom_left = LINIE.center_left;
            bottom_right = LINIE.center_right;
        }else if(position === "middle"){
            top_left = LINIE.center_left;
            top_right = LINIE.center_right;
            
            bottom_left = LINIE.center_left;
            bottom_right = LINIE.center_right;
        }else if(position === "bottom"){
            top_left = LINIE.center_left;
            top_right = LINIE.center_right;
        }
    }   

    if(position !== "middle" && position !== "bottom" ){
        box += top_right;
        for(let i = 0; i < length; i++){
            box += LINIE.horizontal;
        }
        box +=  top_left;
        box += "\n";    
    }
    // UMBRUCH

    var tmp_content_line = "";
    
   
    var placeholder = "";
    for(let i = 0; i < padding/2; i++){
        placeholder += " ";
    }

    if(align === "left"){
        tmp_content_line += LINIE.vertikal;
        tmp_content_line += placeholder + content; 
        for(let i = 0; i < (length - (content.length + padding + sideNote.length)); i++){
            tmp_content_line += " ";
        }
        tmp_content_line += sideNote + placeholder + LINIE.vertikal;
    }else{
        tmp_content_line += LINIE.vertikal + placeholder + sideNote;
        for(let i = 0; i < (length - (content.length + padding + sideNote.length)); i++){
            tmp_content_line += " ";
        }
        tmp_content_line +=  content  + placeholder +  LINIE.vertikal; 
    }
    box += tmp_content_line;
    box += "\n";

    box += bottom_right;
    for(let i = 0; i < length; i++){
        box += LINIE.horizontal;
    }
    box += bottom_left;
    box += "\n";
    return box;
}

let box = {
    content : "- Hallo welt!",
    padding: 3
}




module.exports = {drawBox};