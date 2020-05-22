
var moduleScreen = {
    name: 'Screen',
    size: [ 80, 25 ],
    defaultChar: '&nbsp;',
    initialize: function() {
        moduleScreen.openScreenWindow();
        moduleScreen.window.document.writeln('<html><body><title>Képernyő</title>' +
            '<meta http-equiv="content-type" content="text/html; charset=utf-8" />' +
//>            '<meta http-equiv="content-type" content="text/html; charset=iso-8859-2" />' +
            '<link rel="stylesheet" type="text/css" href="modules/Screen.css" media="all" />' +
            '<body><div></div></body></html>');
    },
    reset: function() {
        var html = '';
        for ( var y = 0; y < moduleScreen.size[1]; ++y ) {
            for ( var x = 0; x < moduleScreen.size[0]; ++x ) {
                html += '<span id="c' + ( y * moduleScreen.size[0] + x ) + '">' + moduleScreen.defaultChar + '</span>';
            }
            html += '<br/>';
        }
        moduleScreen.window.document.getElementsByTagName('DIV')[0].innerHTML = html;
    },
    memoryWrite: function( index, value ) {
        if ( index >= 0x8000 && index < 0xA000 ) {
            var text = '&nbsp;';
            if ( value > 0x20 && value < 0x7f || value > 0xa0 && value != 0xad ) text = String.fromCharCode( value );
            switch ( text ) {
                case '&': text = '&amp;'; break;
                case '<': text = '&lt;'; break;
            }
            moduleScreen.window.document.getElementById( 'c' + ( index - 0x8000 ) ).innerHTML = text;
        }
    },
    openScreenWindow: function() {
        moduleScreen.window = window.open( "", 'Screen',
            'fullscreen=yes,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no');
        moduleScreen.window.resizeTo( 35 + 8 * moduleScreen.size[0], 80 + 17 * moduleScreen.size[1]);
        moduleScreen.window.moveTo(20,20);

    }
};

registerModule( moduleScreen );

