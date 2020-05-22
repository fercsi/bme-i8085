
var moduleRandom = {
    name: 'Random',
    base: 0xA8,
    initialize: function() {},
    reset: function() {},
    ioRead: function( index ) {
        if ( index == moduleRandom.base ) return Math.random()*256>>0;
    },
};

registerModule( moduleRandom );

