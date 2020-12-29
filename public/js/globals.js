
class Globals {

    constructor() {
        this.attributes = {};
        this.set('select-modes', {
            Default:    1,
            Create:     2,
            Connect:    3,
            Disconnect: 4,
            Remove:     5
        });
        this.set('select-mode', this.get('select-modes').Default);
    }

    get(name) {
        console.log('GET Global: ' + name + ', Val: ' + this.attributes[name]);
        return this.attributes[name];
    }

    set(name, value) {
        console.log('SET Global: ' + name + ', Val: ' + value);
        this.attributes[name] = value;
    }
}

var globals = new Globals();