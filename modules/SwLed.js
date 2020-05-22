
var moduleSwLed = {
    name: 'Switches and Leds',
    size: 6,
    base: 0x00,
    initialize: function() {
        moduleSwLed.openSwLedWindow();
        moduleSwLed.window.document.writeln('<html><body><title>Switches and Leds</title>' +
            '<link rel="stylesheet" type="text/css" href="modules/SwLed.css" media="all" />' +
            '<script type="text/javascript">\n' +
            'function toggle(i){document.getElementById("sw"+i).setAttribute("class",document.getElementById("sw"+i).getAttribute("class")=="swoff"?"swon":"swoff")}\n' +
            '</script><body><div></div></body></html>');
    },
    reset: function() {
//>alert(1);
        var html = '';
        html += '<div id="dip">'
        for ( var i = 7; i >= 0; --i ) {
//>            html += '<input id="sw'+i+'" type="checkbox"/>';
            html += '<div id="sw'+i+'" class="swoff" onclick="toggle('+i+')"></div>';
        }
        html += '</div>';
        html += '<div id="panel">'
        for ( var i = 7; i >= 0; --i ) {
            html += '<div id="led'+i+'" class="ledoff">&nbsp;</div>';
        }
        html += '</div>';
        moduleSwLed.window.document.getElementsByTagName('DIV')[0].innerHTML = html;
    },
    ioWrite: function( index, value ) {
        if ( index != moduleSwLed.base ) return;
        var doc = moduleSwLed.window.document;
        for ( var i = 0; i < 8; ++i ) {
//>            doc.getElementById( 'led' + i ).class = value & 1 ? 'ledon' : 'ledoff';
            doc.getElementById( 'led' + i ).setAttribute( "class", value & 1 ? 'ledon' : 'ledoff' );
            value >>= 1;
        }
    },
    ioRead: function( index ) {
        if ( index != moduleSwLed.base ) return;
        var doc = moduleSwLed.window.document;
        var value = 0;
        for ( var i = 7; i >= 0; --i ) {
            value <<= 1;
            value |= doc.getElementById( 'sw' + i ).getAttribute("class") == "swon" ? 1 : 0;
        }
        return value;
    },
    openSwLedWindow: function() {
        moduleSwLed.window = window.open( "", 'SwLed',
            'fullscreen=yes,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no');
        moduleSwLed.window.resizeTo( 430, 330 );
        moduleSwLed.window.moveTo(20,20);

    }
};

registerModule( moduleSwLed );

