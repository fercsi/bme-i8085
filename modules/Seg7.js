
var moduleSeg7 = {
    name: 'Seg7',
    size: 6,
    base: 0xD0,
    initialize: function() {
        moduleSeg7.openSeg7Window();
        moduleSeg7.window.document.writeln('<html><body><title>Képernyő</title>' +
            '<link rel="stylesheet" type="text/css" href="modules/Seg7.css" media="all" />' +
            '<body style="background:black"><div></div></body></html>');
    },
    reset: function() {
        var html = '';
        for ( var i = 0; i < moduleSeg7.size; ++i ) {
            html += '<div style="position:absolute;left:'+(i*120+10)+'px;top:10px">' +
                '<img src="modules/alloff.gif" style="position:absolute"/>';
            for ( var j = 0; j < 8; ++j ) {
                html += '<img src="modules/s' + j + '.gif" style="position:absolute;display:none" id="seg_'+i+'_'+j+'"/>';
            }
            html += '</div>';
//>            for ( var x = 0; x < moduleSeg7.size[0]; ++x ) {
//>                html += '<span id="c' + ( y * moduleSeg7.size[0] + x ) + '">' + moduleSeg7.defaultChar + '</span>';
//>            }
//>            html += '<br/>';
        }
        moduleSeg7.window.document.getElementsByTagName('DIV')[0].innerHTML = html;
    },
    ioWrite: function( index, value ) {
        index -= moduleSeg7.base;
        var doc = moduleSeg7.window.document;
        if ( index >= 0 && index < moduleSeg7.size ) {
            for ( var i = 0; i < 8; ++i ) {
                if ( value & 1 ) doc.getElementById( 'seg_' + index + '_' + i ).style.display = 'block';
                else doc.getElementById( 'seg_' + index + '_' + i ).style.display = 'none';
                value >>= 1;
            }
        }
    },
    openSeg7Window: function() {
        moduleSeg7.window = window.open( "", 'Seg7',
            'fullscreen=yes,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no');
        moduleSeg7.window.resizeTo( 35 + 120 * moduleSeg7.size, 230 );
        moduleSeg7.window.moveTo(20,20);

    }
};

registerModule( moduleSeg7 );

