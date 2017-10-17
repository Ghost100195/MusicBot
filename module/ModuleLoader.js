const modules_config = require('./modules_config.json');

var moduleLoader = null;

/*
    Works like a Sub/pub System
*/
class ModuleLoader{
    
    constructor(){
        this.subscriber = {};
    }

    static _singleton(){
        if(moduleLoader === null) moduleLoader  = new ModuleLoader();
        return moduleLoader;
    }

    onAction(evt, action){
        if(this.subscriber[evt]){
            this.subscriber[evt].forEach((fnc) => {
                fnc(action);
            });
        }
    }   

    loadModules(client){
        Object.keys(modules_config).forEach((key) => {
            const ModClass = require(modules_config[key]);
            const mod = new ModClass(client);
            mod.connect(this.connectModules.bind(this));
        });
    }

    connectModules(evt, fnc){
        if(!this.subscriber[evt]){
            this.subscriber[evt] = [];
        } 
        this.subscriber[evt].push(fnc); 
    }
}

module.exports = ModuleLoader._singleton();